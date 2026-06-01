# ──────────────────────────────────────────────
# Beacon — Incident Models
#
# Three models:
#   Incident        — a declared service disruption
#   IncidentUpdate  — a timestamped message during an incident
#   IncidentMonitor — through-table: incident ↔ affected monitors
#
# Design decisions:
#   - Incidents use UUIDs (safe to expose in status page URLs)
#   - Status follows ITIL-inspired lifecycle:
#       investigating → identified → monitoring → resolved
#   - Severity is separate from status:
#       a CRITICAL incident can be in any lifecycle state
#   - IncidentUpdate is append-only by convention:
#       updates are never edited, only added
#       (audit trail integrity)
#   - resolved_at is set explicitly rather than derived
#       from status so it survives status rollbacks
#   - IncidentMonitor stores the monitor's status snapshot
#       at the time it was linked — historical accuracy
# ──────────────────────────────────────────────

import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.monitors.models import Monitor


class Incident(models.Model):
    """
    A declared service disruption.

    Lifecycle:
        INVESTIGATING → IDENTIFIED → MONITORING → RESOLVED

    Created by:
        - A team member manually via dashboard
        - The checker worker automatically when a monitor
          transitions from operational to outage

    Appears on:
        - The team dashboard (Scene 02)
        - The public status page (Scene 05)
        - Telegram / Slack notifications (Scenes 03, 04)
        - Historical reports (Scene 06)
    """

    # ─── Incident Status ──────────────────────
    # Follows the standard incident lifecycle.
    # Displayed as a progress stepper in Scene 02.

    class IncidentStatus(models.TextChoices):
        INVESTIGATING = "investigating", "Investigating"
        IDENTIFIED    = "identified",    "Identified"
        MONITORING    = "monitoring",    "Monitoring"
        RESOLVED      = "resolved",      "Resolved"

    # ─── Severity ─────────────────────────────
    # Orthogonal to status — a CRITICAL incident
    # can be RESOLVED, a MINOR one still INVESTIGATING.

    class Severity(models.TextChoices):
        CRITICAL  = "critical",  "Critical"
        MAJOR     = "major",     "Major"
        MINOR     = "minor",     "Minor"
        NOTICE    = "notice",    "Notice"

    # ─── Fields ───────────────────────────────

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
        help_text="Short description. e.g. 'API Gateway — Elevated Error Rate'.",
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

    # Human-readable summary shown at the top of the
    # status page incident section. Optional — teams may
    # prefer to communicate only via IncidentUpdates.
    summary = models.TextField(
        blank=True,
        default="",
        help_text=(
            "Optional public-facing summary of the incident. "
            "Shown on the status page above the update feed."
        ),
    )

    # Whether this incident is visible on the public status page.
    # A team might create an internal incident (is_public=False)
    # while investigating before making it public.
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        help_text=(
            "When True, this incident appears on the public status page. "
            "Set to False to investigate privately before publishing."
        ),
    )

    # Whether this incident was created automatically by
    # the checker worker (True) or manually by a team member (False).
    auto_created = models.BooleanField(
        default=False,
        help_text="True if created automatically by the monitor checker worker.",
    )

    # Lifecycle timestamps
    # started_at: when the incident began (may differ from created_at
    #             if the team backdates the start time)
    started_at = models.DateTimeField(
        help_text="When the incident started. May be backdated.",
    )

    # resolved_at: set explicitly when status → RESOLVED
    # Stored separately so it survives any status rollbacks
    # and provides an accurate duration calculation.
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the incident was resolved. Null if still active.",
    )

    # Standard audit timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "incidents"
        ordering = ["-started_at"]
        verbose_name = "Incident"
        verbose_name_plural = "Incidents"
        indexes = [
            # Status page query: active public incidents for an owner
            models.Index(
                fields=["owner", "status", "is_public"],
                name="idx_incident_owner_status_public",
            ),
            # Historical report query: all incidents in a date range
            models.Index(
                fields=["owner", "-started_at"],
                name="idx_incident_owner_started",
            ),
            # Active incident count (dashboard badge)
            models.Index(
                fields=["status", "severity"],
                name="idx_incident_status_severity",
            ),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_severity_display()} · {self.get_status_display()}]"

    @property
    def is_resolved(self):
        """True if the incident lifecycle is complete."""
        return self.status == self.IncidentStatus.RESOLVED

    @property
    def is_active(self):
        """True if the incident is still in progress."""
        return self.status != self.IncidentStatus.RESOLVED

    @property
    def duration_seconds(self):
        """
        Elapsed seconds from started_at to resolved_at (or now).
        Returns None if started_at is not set.
        """
        if not self.started_at:
            return None
        from django.utils import timezone
        end = self.resolved_at or timezone.now()
        return int((end - self.started_at).total_seconds())

    def resolve(self, resolved_at=None):
        """
        Mark the incident as resolved.
        Sets status, resolved_at, and saves.
        """
        from django.utils import timezone
        self.status = self.IncidentStatus.RESOLVED
        self.resolved_at = resolved_at or timezone.now()
        self.save(update_fields=["status", "resolved_at", "updated_at"])


class IncidentUpdate(models.Model):
    """
    A single timestamped message posted during an incident.

    These are the entries in the update feed shown in Scene 02.
    By convention, updates are append-only — never edited after posting.
    This preserves audit trail integrity and subscriber trust.

    Displayed on:
        - The incident detail panel (Scene 02)
        - The public status page timeline (Scene 05)
        - Telegram / Slack notifications (Scenes 03, 04)
    """

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

    # The team member who posted this update.
    # Null if posted by the automated checker worker.
    posted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incident_updates",
        help_text="Team member who posted this update. Null if automated.",
    )

    # The status of the incident at the time this update was posted.
    # Stored on the update itself so the timeline accurately reflects
    # the state progression even if the incident status changes later.
    status_at_update = models.CharField(
        max_length=15,
        choices=Incident.IncidentStatus.choices,
        help_text="Incident status at the time this update was posted.",
    )

    # The update message body.
    # Supports plain text only for now.
    # Markdown support is planned for Phase 03.
    message = models.TextField(
        help_text="The update message. Plain text. Markdown support coming in Phase 03.",
    )

    # Whether this update is visible on the public status page.
    # Allows teams to post internal notes during an incident
    # without exposing them to subscribers.
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
            # Fetch all updates for an incident timeline
            models.Index(
                fields=["incident", "-created_at"],
                name="idx_update_incident_created",
            ),
            # Public update feed for status page
            models.Index(
                fields=["incident", "is_public", "-created_at"],
                name="idx_update_incident_public_created",
            ),
        ]

    def __str__(self):
        poster = self.posted_by.username if self.posted_by else "system"
        return f"Update on '{self.incident.title}' by {poster}"


class IncidentMonitor(models.Model):
    """
    Through-table linking an Incident to affected Monitors.

    Explicit through-table (rather than ManyToManyField) because:
      - We need to store the monitor's status snapshot at link time
      - We need to record when the monitor recovered within the incident
      - We may add more join metadata in future phases

    One Incident → many IncidentMonitors → many Monitors
    One Monitor  → many IncidentMonitors → many Incidents (over time)
    """

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

    # The monitor's status when it was linked to this incident.
    # Stored as a snapshot — the monitor's current status may
    # have changed since the link was created.
    monitor_status_snapshot = models.CharField(
        max_length=15,
        choices=Monitor.MonitorStatus.choices,
        help_text="The monitor's status at the time it was linked to this incident.",
    )

    # When this specific monitor recovered within the incident.
    # May differ from incident.resolved_at if multiple monitors
    # are affected and they recover at different times.
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
        # An incident cannot list the same monitor twice
        unique_together = [["incident", "monitor"]]
        indexes = [
            # Fetch all monitors for an incident
            models.Index(
                fields=["incident", "monitor"],
                name="idx_incidentmonitor_incident_monitor",
            ),
            # Fetch all incidents affecting a given monitor
            models.Index(
                fields=["monitor", "-created_at"],
                name="idx_incidentmonitor_monitor_created",
            ),
        ]

    def __str__(self):
        return f"{self.incident.title} → {self.monitor.name}"