import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from apps.monitors.models import Monitor

slug_validator = RegexValidator(
    regex=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$",
    message=(
        "Slug must be lowercase alphanumeric with hyphens only. "
        "Must start and end with a letter or number. "
        "Example: 'acme-api'"
    ),
)


class StatusPage(models.Model):
    class Theme(models.TextChoices):
        SYSTEM  = "system",  "System default"
        CUSTOM  = "custom",  "Custom color"

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

    name = models.CharField(
        max_length=255,
        help_text="Public name shown at the top of the status page.",
    )

    slug = models.SlugField(
        max_length=100,
        unique=True,
        validators=[slug_validator],
        help_text=(
            "URL-safe identifier. Forms the public URL. "
            "Lowercase, hyphens only. Immutable after creation."
        ),
    )

    description = models.TextField(
        blank=True,
        default="",
        help_text="Optional public description shown below the page title.",
    )

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

    is_public = models.BooleanField(
        default=True,
        db_index=True,
        help_text="When False, the page is not accessible to the public.",
    )

    show_beacon_branding = models.BooleanField(
        default=True,
        help_text="Show 'Powered by Beacon' badge on the public page.",
    )

    allow_subscriptions = models.BooleanField(
        default=True,
        help_text="Allow visitors to subscribe for incident notifications.",
    )

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
            models.Index(
                fields=["slug"],
                name="idx_statuspage_slug",
            ),
            models.Index(
                fields=["owner", "-created_at"],
                name="idx_statuspage_owner_created",
            ),
            models.Index(
                fields=["slug", "is_public"],
                name="idx_statuspage_slug_public",
            ),
        ]

    def __str__(self):
        return f"{self.name} (/{self.slug}/)"

    @property
    def public_url(self):
        return f"/status/{self.slug}/"

    @property
    def overall_status(self):
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

    display_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text=(
            "Public-facing name for this monitor on the status page. "
            "Falls back to the monitor's internal name if blank."
        ),
    )

    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Display order. Lower numbers appear first.",
    )

    show_uptime_history = models.BooleanField(
        default=True,
        help_text="Show the 90-day uptime history bar for this monitor.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "status_page_monitors"
        unique_together = [["status_page", "monitor"]]
        ordering = ["display_order", "created_at"]
        verbose_name = "Status Page Monitor"
        verbose_name_plural = "Status Page Monitors"
        indexes = [
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
        return self.display_name or self.monitor.name


class Subscriber(models.Model):
    class NotificationChannel(models.TextChoices):
        TELEGRAM = "telegram", "Telegram"
        EMAIL    = "email",    "Email"

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

    telegram_chat_id = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Telegram chat ID. Required for telegram channel.",
    )

    email = models.EmailField(
        blank=True,
        default="",
        help_text="Email address. Required for email channel.",
    )

    unsubscribe_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        help_text="Token used in unsubscribe URLs. Never changes.",
    )

    is_confirmed = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Only confirmed subscribers receive notifications.",
    )

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
            models.Index(
                fields=["status_page", "notification_channel",
                        "is_confirmed", "is_active"],
                name="idx_sub_page_channel_active",
            ),
            models.Index(
                fields=["unsubscribe_token"],
                name="idx_sub_unsubscribe_token",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["status_page", "telegram_chat_id"],
                condition=models.Q(
                    notification_channel="telegram",
                    is_active=True,
                ),
                name="uniq_subscriber_telegram_per_page",
            ),
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
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])