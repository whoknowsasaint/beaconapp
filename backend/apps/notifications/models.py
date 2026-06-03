import uuid
from django.db import models
from apps.incidents.models import Incident
from apps.status_pages.models import Subscriber


class NotificationLog(models.Model):

    class EventType(models.TextChoices):
        INCIDENT_CREATED  = "incident_created",  "Incident created"
        INCIDENT_UPDATED  = "incident_updated",  "Incident updated"
        INCIDENT_RESOLVED = "incident_resolved", "Incident resolved"

    class DeliveryStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT    = "sent",    "Sent"
        FAILED  = "failed",  "Failed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )

    subscriber = models.ForeignKey(
        Subscriber,
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )

    event_type = models.CharField(
        max_length=25,
        choices=EventType.choices,
    )

    delivery_status = models.CharField(
        max_length=10,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
        db_index=True,
    )

    error = models.TextField(
        blank=True,
        default="",
        help_text="Error detail if delivery failed.",
    )

    retry_count = models.PositiveSmallIntegerField(default=0)

    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification_logs"
        ordering = ["-created_at"]
        verbose_name = "Notification Log"
        verbose_name_plural = "Notification Logs"
        constraints = [
            models.UniqueConstraint(
                fields=["incident", "subscriber", "event_type"],
                name="uniq_notification_incident_subscriber_event",
            )
        ]
        indexes = [
            models.Index(
                fields=["incident", "event_type"],
                name="idx_notiflog_incident_event",
            ),
            models.Index(
                fields=["delivery_status", "created_at"],
                name="idx_notiflog_status_created",
            ),
        ]

    def __str__(self):
        return (
            f"{self.event_type} -> "
            f"{self.subscriber} "
            f"[{self.delivery_status}]"
        )

    def mark_sent(self):
        from django.utils import timezone
        self.delivery_status = self.DeliveryStatus.SENT
        self.sent_at         = timezone.now()
        self.save(update_fields=["delivery_status", "sent_at"])

    def mark_failed(self, error):
        self.delivery_status = self.DeliveryStatus.FAILED
        self.error           = error
        self.retry_count    += 1
        self.save(update_fields=["delivery_status", "error", "retry_count"])