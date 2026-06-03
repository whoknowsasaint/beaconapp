# ──────────────────────────────────────────────
# Beacon — Status Page Models
#
# Three models:
#   StatusPage        — a branded public status page
#   StatusPageMonitor — through-table: page ↔ monitors shown
#   Subscriber        — someone who receives notifications
#
# Design decisions:
#   - StatusPage slug is unique and slug-validated at model level.
#     It forms the public URL and must never change after creation.
#   - StatusPageMonitor controls display_order so teams can arrange
#     services in a meaningful order (e.g. most critical first).
#   - Subscriber uses a UUID token for one-click unsubscribe links —
#     no authentication required to unsubscribe.
#   - Subscriber notification_channel is extensible — we start with
#     telegram and email; slack and webhook come in Phase 04.
#   - Subscriber stores telegram_chat_id for Telegram delivery and
#     email for email delivery. Only the relevant field is populated.
# ──────────────────────────────────────────────

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from apps.monitors.models import Monitor


# ─── Slug Validator ───────────────────────────
# Status page slugs must be lowercase alphanumeric
# with hyphens only. No underscores, no spaces.
# Valid:   "acme", "acme-api", "my-service-123"
# Invalid: "Acme", "acme_api", "my service"

slug_validator = RegexValidator(
    regex=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$",
    message=(
        "Slug must be lowercase alphanumeric with hyphens only. "
        "Must start and end with a letter or number. "
        "Example: 'acme-api'"
    ),
)


class StatusPage(models.Model):
    """
    A branded, public-facing status page.

    A single user may own multiple status pages —
    one per product, environment, or customer segment.

    The slug forms the public URL:
        /status/{slug}/             (path-based routing)
        status.{slug}.beacon.app    (subdomain routing — future)

    Once created, the slug is immutable. Changing it
    would break existing subscriber links, bookmarks,
    and embeds. Enforced at the API layer in Phase 02.

    Displayed in:
        Scene 05 — Public Status Pages
    """

    # ─── Theme ────────────────────────────────
    # Controls the accent color on the public page.
    # Stored as a 6-digit hex string without the #.

    class Theme(models.TextChoices):
        SYSTEM  = "system",  "System default"
        CUSTOM  = "custom",  "Custom color"

    # ─── Fields ───────────────────────────────

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier.",
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="status_pages",
        help_text="The user account this status page belongs to.",
    )

    # The public name shown at the top of the status page.
    # e.g. "Acme Corp Status" or "API Status"
    name = models.CharField(
        max_length=255,
        help_text="Public name shown at the top of the status page.",
    )

    # URL-safe identifier. Unique across the platform.
    # Immutable after creation (enforced in API layer).
    slug = models.SlugField(
        max_length=100,
        unique=True,
        validators=[slug_validator],
        help_text=(
            "URL-safe identifier. Forms the public URL. "
            "Lowercase, hyphens only. Immutable after creation."
        ),
    )

    # Optional description shown below the page title.
    description = models.TextField(
        blank=True,
        default="",
        help_text="Optional public description shown below the page title.",
    )

    # Custom brand color — 6-digit hex without #.
    # e.g. "3B82F6" for Beacon blue.
    # Only used when theme = CUSTOM.
    brand_color = models.CharField(
        max_length=6,
        default="3B82F6",
        help_text="6-digit hex color code (without #) for the page accent.",
    )

    theme = models.CharField(
        max_length=10,
        choices=Theme.choices,
        default=Theme.SYSTEM,
        help_text="Color theme for the public page.",
    )

    # Whether the status page is publicly accessible.
    # When False, the page returns 404 to unauthenticated visitors.
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        help_text="When False, the page is not accessible to the public.",
    )

    # Whether to show the "Powered by Beacon" badge.
    # True by default — helps with open-source visibility.
    show_beacon_branding = models.BooleanField(
        default=True,
        help_text="Show 'Powered by Beacon' badge on the public page.",
    )

    # Whether to allow visitors to subscribe for notifications.
    allow_subscriptions = models.BooleanField(
        default=True,
        help_text="Allow visitors to subscribe for incident notifications.",
    )

    # Custom domain — future feature placeholder.
    # e.g. "status.acme.com"
    # When set, the status page is also accessible at this domain.
    custom_domain = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Custom domain for this status page. e.g. 'status.acme.com'.",
    )
    slack_webhook_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        help_text="Slack incoming webhook URL for incident notifications.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "status_pages"
        ordering = ["-created_at"]
        verbose_name = "Status Page"
        verbose_name_plural = "Status Pages"
        indexes = [
            # Lookup by slug — the most common query (every page view)
            models.Index(
                fields=["slug"],
                name="idx_statuspage_slug",
            ),
            # Owner dashboard: all pages for a user
            models.Index(
                fields=["owner", "-created_at"],
                name="idx_statuspage_owner_created",
            ),
            # Public page routing: is_public filter
            models.Index(
                fields=["slug", "is_public"],
                name="idx_statuspage_slug_public",
            ),
        ]

    def __str__(self):
        return f"{self.name} (/{self.slug}/)"

    @property
    def public_url(self):
        """
        The public URL path for this status page.
        Full URL construction happens in the frontend.
        """
        return f"/status/{self.slug}/"

    @property
    def overall_status(self):
        """
        Derives the page's overall status from its monitors.
        Returns the worst status across all linked monitors:
            outage > degraded > operational

        Used to render the "All Systems Operational" headline
        on the public status page (Scene 05).
        """
        monitors = self.monitors.select_related("monitor").all()
        if not monitors.exists():
            return "operational"

        statuses = [pm.monitor.status for pm in monitors]

        if "outage" in statuses:
            return "outage"
        if "degraded" in statuses:
            return "degraded"
        return "operational"


class StatusPageMonitor(models.Model):
    """
    Through-table linking a StatusPage to a Monitor.

    Controls:
        - Which monitors appear on this status page
        - The public-facing display name for each monitor
        - The display order (drag-and-drop ordering in the dashboard)
        - Whether this monitor's history is shown (90-day uptime bars)

    A monitor can appear on multiple status pages.
    A status page can show multiple monitors.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    status_page = models.ForeignKey(
        StatusPage,
        on_delete=models.CASCADE,
        related_name="monitors",
        help_text="The status page this monitor appears on.",
    )

    monitor = models.ForeignKey(
        Monitor,
        on_delete=models.CASCADE,
        related_name="status_page_entries",
        help_text="The monitor being displayed.",
    )

    # Public-facing label for this monitor on the status page.
    # Defaults to the monitor's internal name if blank.
    # Allows teams to show "API" publicly while naming it
    # "api-gateway-prod-us-east-1" internally.
    display_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text=(
            "Public-facing name for this monitor on the status page. "
            "Falls back to the monitor's internal name if blank."
        ),
    )

    # Controls the vertical order of monitors on the status page.
    # Lower numbers appear first. Updated via drag-and-drop in dashboard.
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Display order. Lower numbers appear first.",
    )

    # Whether to show the 90-day uptime history bar for this monitor.
    show_uptime_history = models.BooleanField(
        default=True,
        help_text="Show the 90-day uptime history bar for this monitor.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "status_page_monitors"
        # A monitor can only appear once per status page
        unique_together = [["status_page", "monitor"]]
        # Default ordering: display_order ascending
        ordering = ["display_order", "created_at"]
        verbose_name = "Status Page Monitor"
        verbose_name_plural = "Status Page Monitors"
        indexes = [
            # Fetch all monitors for a page in display order
            models.Index(
                fields=["status_page", "display_order"],
                name="idx_spm_page_order",
            ),
        ]

    def __str__(self):
        label = self.display_name or self.monitor.name
        return f"{self.status_page.name} → {label}"

    @property
    def public_name(self):
        """The name shown on the public status page."""
        return self.display_name or self.monitor.name


class Subscriber(models.Model):
    """
    Someone who has opted in to receive notifications
    for a specific status page.

    Notification channels:
        telegram — message sent via Telegram bot to chat_id
        email    — message sent via SMTP to email address
        (slack and webhook planned for Phase 04)

    Unsubscribe flow:
        Every subscriber gets a UUID token.
        Unsubscribe URL: /status/{slug}/unsubscribe/{token}/
        No authentication required — the token is the credential.

    Confirmation flow:
        is_confirmed starts False.
        A confirmation message is sent on subscribe.
        is_confirmed becomes True when the user confirms.
        Unconfirmed subscribers do not receive notifications.
    """

    # ─── Notification Channels ────────────────

    class NotificationChannel(models.TextChoices):
        TELEGRAM = "telegram", "Telegram"
        EMAIL    = "email",    "Email"

    # ─── Fields ───────────────────────────────

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    status_page = models.ForeignKey(
        StatusPage,
        on_delete=models.CASCADE,
        related_name="subscribers",
        help_text="The status page this subscription is for.",
    )

    notification_channel = models.CharField(
        max_length=10,
        choices=NotificationChannel.choices,
        help_text="The channel through which notifications are delivered.",
    )

    # ── Telegram-specific ─────────────────────
    # The Telegram chat ID to send messages to.
    # Obtained when the user messages the Beacon Telegram bot.
    telegram_chat_id = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Telegram chat ID. Required for telegram channel.",
    )

    # ── Email-specific ────────────────────────
    email = models.EmailField(
        blank=True,
        default="",
        help_text="Email address. Required for email channel.",
    )

    # UUID token for unsubscribe links.
    # Generated once at creation. Never changes.
    unsubscribe_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        help_text="Token used in unsubscribe URLs. Never changes.",
    )

    # Confirmed subscribers only receive notifications.
    # Telegram: confirmed when user sends /start to the bot.
    # Email: confirmed when user clicks the confirmation link.
    is_confirmed = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Only confirmed subscribers receive notifications.",
    )

    # Whether this subscriber is currently active.
    # Set to False on unsubscribe (soft delete — preserves history).
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="When False, no notifications are sent. Set on unsubscribe.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscribers"
        ordering = ["-created_at"]
        verbose_name = "Subscriber"
        verbose_name_plural = "Subscribers"
        indexes = [
            # Notification worker query:
            # all active confirmed subscribers for a page + channel
            models.Index(
                fields=["status_page", "notification_channel",
                        "is_confirmed", "is_active"],
                name="idx_subscriber_page_channel_active",
            ),
            # Unsubscribe lookup by token
            models.Index(
                fields=["unsubscribe_token"],
                name="idx_subscriber_unsubscribe_token",
            ),
        ]
        constraints = [
            # A Telegram chat ID can only subscribe once per page
            models.UniqueConstraint(
                fields=["status_page", "telegram_chat_id"],
                condition=models.Q(
                    notification_channel="telegram",
                    is_active=True,
                ),
                name="uniq_subscriber_telegram_per_page",
            ),
            # An email can only subscribe once per page
            models.UniqueConstraint(
                fields=["status_page", "email"],
                condition=models.Q(
                    notification_channel="email",
                    is_active=True,
                ),
                name="uniq_subscriber_email_per_page",
            ),
        ]

    def __str__(self):
        if self.notification_channel == self.NotificationChannel.TELEGRAM:
            return f"Telegram:{self.telegram_chat_id} → {self.status_page.name}"
        return f"Email:{self.email} → {self.status_page.name}"

    def unsubscribe(self):
        """
        Soft-deletes this subscriber.
        Sets is_active=False and saves.
        Preserves the record for historical subscriber count reporting.
        """
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])