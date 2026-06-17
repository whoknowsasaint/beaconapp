# ──────────────────────────────────────────────
# Beacon- Monitor Models
#
# Two models:
#   Monitor     - a service being watched
#   MonitorCheck- a single ping result for a monitor
#
# Design decisions:
#   - UUIDs as primary keys: safe to expose in URLs/API
#     without leaking sequential IDs or row counts.
#   - TextChoices for enums: validated at the ORM level,
#     stored as short strings in the DB (not integers),
#     readable in psql without a lookup table.
#   - MonitorCheck has a DB index on (monitor, checked_at)
#     because every uptime/history query filters by both.
#   - All timestamps are UTC (USE_TZ = True in settings).
# ──────────────────────────────────────────────

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Monitor(models.Model):
    """
    A single service being monitored by Beacon.
    Could be an HTTP endpoint, a TCP port, or a ping target.
    Owned by a user (the account that created it).
    """

    # ─── Monitor Types ────────────────────────
    class MonitorType(models.TextChoices):
        HTTP  = "http",  "HTTP / HTTPS"
        TCP   = "tcp",   "TCP Port"
        PING  = "ping",  "ICMP Ping"

    # ─── Current Status ───────────────────────
    # Denormalized from the latest MonitorCheck for
    # fast reads- we don't want to JOIN on every
    # status page load.
    class MonitorStatus(models.TextChoices):
        OPERATIONAL = "operational", "Operational"
        DEGRADED    = "degraded",    "Degraded"
        OUTAGE      = "outage",      "Outage"
        PAUSED      = "paused",      "Paused"
        PENDING     = "pending",     "Pending first check"

    # ─── Fields ───────────────────────────────

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier. Safe to expose in URLs.",
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="monitors",
        help_text="The user account this monitor belongs to.",
    )

    name = models.CharField(
        max_length=255,
        help_text="Human-readable name. e.g. 'API Gateway' or 'Main Website'.",
    )

    monitor_type = models.CharField(
        max_length=10,
        choices=MonitorType.choices,
        default=MonitorType.HTTP,
        help_text="The protocol used to check this monitor.",
    )

    url = models.URLField(
        max_length=2048,
        help_text="The endpoint to monitor. Required for HTTP monitors.",
        blank=True,
        default="",
    )

    host = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Hostname or IP. Used for TCP and PING monitors.",
    )

    port = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(65535)],
        help_text="TCP port number. Required for TCP monitors.",
    )

    # How often to check, in seconds.
    # Minimum: 30s (prevents abuse on self-hosted instances).
    # Default: 60s (1 minute).
    interval = models.PositiveIntegerField(
        default=60,
        validators=[MinValueValidator(30), MaxValueValidator(86400)],
        help_text="Check interval in seconds. Min: 30, Max: 86400 (24h).",
    )

    # HTTP-specific: what status codes are "healthy"
    # Stored as comma-separated string e.g. "200,201,204"
    expected_status_codes = models.CharField(
        max_length=100,
        default="200",
        blank=True,
        help_text=(
            "Comma-separated HTTP status codes considered healthy. "
            "e.g. '200,201,204'. HTTP monitors only."
        ),
    )

    # Timeout in seconds before a check is marked failed
    timeout = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text="Request timeout in seconds. Min: 1, Max: 60.",
    )

    # Current denormalized status- updated by the checker worker
    status = models.CharField(
        max_length=15,
        choices=MonitorStatus.choices,
        default=MonitorStatus.PENDING,
        db_index=True,
        help_text="Current operational status. Denormalized from latest check.",
    )

    # Whether this monitor is actively being checked
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="When False, no checks are performed. Status becomes PAUSED.",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # The last time a check completed (successful or not)
    last_checked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of the most recent completed check.",
    )

    class Meta:
        db_table = "monitors"
        ordering = ["-created_at"]
        verbose_name = "Monitor"
        verbose_name_plural = "Monitors"
        indexes = [
            # Fetch all active monitors for the checker worker
            models.Index(fields=["is_active", "status"], name="idx_monitor_active_status"),
            # Fetch all monitors by owner (dashboard view)
            models.Index(fields=["owner", "-created_at"], name="idx_monitor_owner_created"),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_monitor_type_display()})"

    def get_expected_status_codes(self):
        """
        Returns expected_status_codes as a list of integers.
        e.g. "200,201,204" → [200, 201, 204]
        """
        return [
            int(code.strip())
            for code in self.expected_status_codes.split(",")
            if code.strip().isdigit()
        ]


class MonitorCheck(models.Model):
    """
    A single check result for a Monitor.
    Created every time the checker worker pings a service.
    This is the raw time-series data that powers:
      - Uptime percentage calculations
      - Response time graphs
      - Incident detection
      - 90-day uptime bars on status pages
    """

    # ─── Check Result ─────────────────────────
    class CheckStatus(models.TextChoices):
        UP      = "up",      "Up"
        DOWN    = "down",    "Down"
        TIMEOUT = "timeout", "Timeout"
        ERROR   = "error",   "Error"

    # ─── Fields ───────────────────────────────

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    monitor = models.ForeignKey(
        Monitor,
        on_delete=models.CASCADE,
        related_name="checks",
        help_text="The monitor this check belongs to.",
    )

    status = models.CharField(
        max_length=10,
        choices=CheckStatus.choices,
        help_text="Outcome of this check.",
    )

    # Response time in milliseconds.
    # Null if the check timed out or errored before a response.
    response_time_ms = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Round-trip response time in milliseconds.",
    )

    # The actual HTTP status code returned.
    # Null for TCP/ping checks or if no response was received.
    http_status_code = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="HTTP status code returned by the endpoint.",
    )

    # Error message if the check failed
    error = models.TextField(
        blank=True,
        default="",
        help_text="Error detail if status is DOWN, TIMEOUT, or ERROR.",
    )

    # The region/location this check was performed from.
    # Defaults to "local" for self-hosted instances.
    region = models.CharField(
        max_length=50,
        default="local",
        help_text="Region or location where this check originated.",
    )

    # When the check completed (not when it started)
    checked_at = models.DateTimeField(
        db_index=True,
        help_text="UTC timestamp when this check completed.",
    )

    class Meta:
        db_table = "monitor_checks"
        # Most recent checks first- standard for time-series data
        ordering = ["-checked_at"]
        verbose_name = "Monitor Check"
        verbose_name_plural = "Monitor Checks"
        indexes = [
            # The most critical index in the entire schema.
            # Every uptime calculation queries:
            #   WHERE monitor_id = X AND checked_at >= Y
            # This compound index makes that O(log n).
            models.Index(
                fields=["monitor", "-checked_at"],
                name="idx_check_monitor_time",
            ),
            # For status-filtered queries:
            #   "how many DOWN checks in the last 24h?"
            models.Index(
                fields=["monitor", "status", "-checked_at"],
                name="idx_check_monitor_status_time",
            ),
        ]

    def __str__(self):
        return (
            f"{self.monitor.name}- {self.get_status_display()} "
            f"at {self.checked_at:%Y-%m-%d %H:%M:%S} UTC"
        )

    @property
    def is_up(self):
        """True if this check result indicates the service is healthy."""
        return self.status == self.CheckStatus.UP