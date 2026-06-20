import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.monitors.models import Monitor


class Incident(models.Model):
    class IncidentStatus(models.TextChoices):
        INVESTIGATING = "investigating", "Investigating"
        IDENTIFIED    = "identified",    "Identified"
        MONITORING    = "monitoring",    "Monitoring"
        RESOLVED      = "resolved",      "Resolved"

    class Severity(models.TextChoices):
        CRITICAL  = "critical",  "Critical"
        MAJOR     = "major",     "Major"
        MINOR     = "minor",     "Minor"
        NOTICE    = "notice",    "Notice"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier. Used in status page URLs.",
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="incidents",
        help_text="The user account this incident belongs to.",
    )

    title = models.CharField(
        max_length=255,
        help_text="Short description. e.g. 'API Gateway- Elevated Error Rate'.",
    )

    status = models.CharField(
        max_length=15,
        choices=IncidentStatus.choices,
        default=IncidentStatus.INVESTIGATING,
        db_index=True,
        help_text="Current lifecycle stage of this incident.",
    )

    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        default=Severity.MINOR,
        db_index=True,
        help_text="Impact severity. Independent of lifecycle status.",
    )

    summary = models.TextField(
        blank=True,
        default="",
        help_text=(
            "Optional public-facing summary of the incident. "
            "Shown on the status page above the update feed."
        ),
    )

    is_public = models.BooleanField(
        default=True,
        db_index=True,
        help_text=(
            "When True, this incident appears on the public status page. "
            "Set to False to investigate privately before publishing."
        ),
    )

    auto_created = models.BooleanField(
        default=False,
        help_text="True if created automatically by the monitor checker worker.",
    )

    started_at = models.DateTimeField(
        help_text="When the incident started. May be backdated.",
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the incident was resolved. Null if still active.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "incidents"
        ordering = ["-started_at"]
        verbose_name = "Incident"
        verbose_name_plural = "Incidents"
        indexes = [
            models.Index(
                fields=["owner", "status", "is_public"],
                name="idx_inc_owner_status_public",
            ),
            models.Index(
                fields=["owner", "-started_at"],
                name="idx_incident_owner_started",
            ),
            models.Index(
                fields=["status", "severity"],
                name="idx_incident_status_severity",
            ),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_severity_display()} · {self.get_status_display()}]"

    @property
    def is_resolved(self):
        return self.status == self.IncidentStatus.RESOLVED

    @property
    def is_active(self):
        return self.status != self.IncidentStatus.RESOLVED

    @property
    def duration_seconds(self):
        if not self.started_at:
            return None
        from django.utils import timezone
        end = self.resolved_at or timezone.now()
        return int((end - self.started_at).total_seconds())

    def resolve(self, resolved_at=None):
        from django.utils import timezone
        self.status = self.IncidentStatus.RESOLVED
        self.resolved_at = resolved_at or timezone.now()
        self.save(update_fields=["status", "resolved_at", "updated_at"])


class IncidentUpdate(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="updates",
        help_text="The incident this update belongs to.",
    )

    posted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incident_updates",
        help_text="Team member who posted this update. Null if automated.",
    )

    status_at_update = models.CharField(
        max_length=15,
        choices=Incident.IncidentStatus.choices,
        help_text="Incident status at the time this update was posted.",
    )

    message = models.TextField(
        help_text="The update message. Plain text. Markdown support coming in Phase 03.",
    )

    is_public = models.BooleanField(
        default=True,
        help_text="When False, this update is only visible to team members.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "incident_updates"
        ordering = ["-created_at"]
        verbose_name = "Incident Update"
        verbose_name_plural = "Incident Updates"
        indexes = [
            models.Index(
                fields=["incident", "-created_at"],
                name="idx_update_incident_created",
            ),
            models.Index(
                fields=["incident", "is_public", "-created_at"],
                name="idx_update_inc_public_created",
            ),
        ]

    def __str__(self):
        poster = self.posted_by.username if self.posted_by else "system"
        return f"Update on '{self.incident.title}' by {poster}"


class IncidentMonitor(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="affected_monitors",
        help_text="The incident this link belongs to.",
    )

    monitor = models.ForeignKey(
        Monitor,
        on_delete=models.CASCADE,
        related_name="incidents",
        help_text="The monitor affected by this incident.",
    )

    monitor_status_snapshot = models.CharField(
        max_length=15,
        choices=Monitor.MonitorStatus.choices,
        help_text="The monitor's status at the time it was linked to this incident.",
    )

    recovered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this monitor recovered. Null if still affected.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "incident_monitors"
        verbose_name = "Incident Monitor"
        verbose_name_plural = "Incident Monitors"
        unique_together = [["incident", "monitor"]]
        indexes = [
            models.Index(
                fields=["incident", "monitor"],
                name="idx_im_incident_monitor",
            ),
            models.Index(
                fields=["monitor", "-created_at"],
                name="idx_im_monitor_created",
            ),
        ]

    def __str__(self):
        return f"{self.incident.title} → {self.monitor.name}"