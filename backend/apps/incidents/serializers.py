from django.utils import timezone
from rest_framework import serializers
from .models import Incident, IncidentUpdate, IncidentMonitor
from apps.monitors.models import Monitor


class IncidentUpdateReadSerializer(serializers.ModelSerializer):

    posted_by_username = serializers.SerializerMethodField()
    status_at_update_display = serializers.CharField(
        source="get_status_at_update_display",
        read_only=True,
    )

    class Meta:
        model  = IncidentUpdate
        fields = [
            "id",
            "posted_by_username",
            "status_at_update",
            "status_at_update_display",
            "message",
            "is_public",
            "created_at",
        ]
        read_only_fields = fields

    def get_posted_by_username(self, obj):
        if obj.posted_by:
            return obj.posted_by.username
        return "system"


class IncidentUpdateWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model  = IncidentUpdate
        fields = ["message", "is_public"]

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be blank.")
        return value.strip()


class IncidentMonitorReadSerializer(serializers.ModelSerializer):

    monitor_id   = serializers.UUIDField(source="monitor.id",   read_only=True)
    monitor_name = serializers.CharField(source="monitor.name", read_only=True)
    monitor_status_snapshot_display = serializers.CharField(
        source="get_monitor_status_snapshot_display",
        read_only=True,
    )

    class Meta:
        model  = IncidentMonitor
        fields = [
            "id",
            "monitor_id",
            "monitor_name",
            "monitor_status_snapshot",
            "monitor_status_snapshot_display",
            "recovered_at",
            "created_at",
        ]
        read_only_fields = fields


class IncidentReadSerializer(serializers.ModelSerializer):

    severity_display = serializers.CharField(
        source="get_severity_display",
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    is_active        = serializers.BooleanField(read_only=True)
    is_resolved      = serializers.BooleanField(read_only=True)
    duration_seconds = serializers.IntegerField(read_only=True)
    updates          = IncidentUpdateReadSerializer(many=True, read_only=True)
    affected_monitors = IncidentMonitorReadSerializer(many=True, read_only=True)

    class Meta:
        model  = Incident
        fields = [
            "id",
            "title",
            "status",
            "status_display",
            "severity",
            "severity_display",
            "summary",
            "is_public",
            "auto_created",
            "is_active",
            "is_resolved",
            "duration_seconds",
            "started_at",
            "resolved_at",
            "created_at",
            "updated_at",
            "updates",
            "affected_monitors",
        ]
        read_only_fields = fields


class IncidentWriteSerializer(serializers.ModelSerializer):
    """
    Accepts an optional list of monitor UUIDs to link
    as affected monitors on create.
    """

    affected_monitor_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True,
        help_text="UUIDs of monitors affected by this incident.",
    )

    class Meta:
        model  = Incident
        fields = [
            "title",
            "status",
            "severity",
            "summary",
            "is_public",
            "started_at",
            "resolved_at",
            "affected_monitor_ids",
        ]

    def validate_resolved_at(self, value):
        if value and value > timezone.now():
            raise serializers.ValidationError(
                "resolved_at cannot be in the future."
            )
        return value

    def validate(self, data):
        status_val   = data.get("status", getattr(self.instance, "status", None))
        resolved_at  = data.get("resolved_at", getattr(self.instance, "resolved_at", None))

        if status_val == Incident.IncidentStatus.RESOLVED and not resolved_at:
            data["resolved_at"] = timezone.now()

        return data

    def validate_affected_monitor_ids(self, value):
        request = self.context["request"]
        if not value:
            return value
        existing = Monitor.objects.filter(
            id__in=value,
            owner=request.user,
        ).values_list("id", flat=True)
        missing = set(str(v) for v in value) - set(str(e) for e in existing)
        if missing:
            raise serializers.ValidationError(
                f"Monitor(s) not found: {', '.join(missing)}"
            )
        return value

    def create(self, validated_data):
        monitor_ids = validated_data.pop("affected_monitor_ids", [])
        validated_data["owner"] = self.context["request"].user
        incident = super().create(validated_data)
        self._link_monitors(incident, monitor_ids)
        return incident

    def update(self, instance, validated_data):
        validated_data.pop("affected_monitor_ids", None)
        return super().update(instance, validated_data)

    def _link_monitors(self, incident, monitor_ids):
        for monitor_id in monitor_ids:
            monitor = Monitor.objects.get(id=monitor_id)
            IncidentMonitor.objects.get_or_create(
                incident=incident,
                monitor=monitor,
                defaults={
                    "monitor_status_snapshot": monitor.status,
                },
            )