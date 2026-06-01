from rest_framework import serializers
from django.core.validators import RegexValidator
from apps.monitors.models import Monitor
from apps.monitors.serializers import MonitorReadSerializer
from apps.incidents.models import Incident
from apps.incidents.serializers import IncidentReadSerializer
from .models import StatusPage, StatusPageMonitor, Subscriber


class StatusPageMonitorReadSerializer(serializers.ModelSerializer):

    monitor      = MonitorReadSerializer(read_only=True)
    public_name  = serializers.CharField(read_only=True)

    class Meta:
        model  = StatusPageMonitor
        fields = [
            "id",
            "monitor",
            "display_name",
            "public_name",
            "display_order",
            "show_uptime_history",
            "created_at",
        ]
        read_only_fields = fields


class StatusPageMonitorWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model  = StatusPageMonitor
        fields = [
            "monitor",
            "display_name",
            "display_order",
            "show_uptime_history",
        ]

    def validate_monitor(self, monitor):
        request = self.context["request"]
        if monitor.owner != request.user:
            raise serializers.ValidationError(
                "Monitor not found."
            )
        return monitor


class StatusPageReadSerializer(serializers.ModelSerializer):

    monitors       = StatusPageMonitorReadSerializer(many=True, read_only=True)
    overall_status = serializers.CharField(read_only=True)
    public_url     = serializers.CharField(read_only=True)
    subscriber_count = serializers.SerializerMethodField()

    class Meta:
        model  = StatusPage
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "brand_color",
            "theme",
            "is_public",
            "allow_subscriptions",
            "show_beacon_branding",
            "custom_domain",
            "overall_status",
            "public_url",
            "subscriber_count",
            "monitors",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_subscriber_count(self, obj):
        return obj.subscribers.filter(
            is_active=True,
            is_confirmed=True,
        ).count()


class StatusPageWriteSerializer(serializers.ModelSerializer):

    slug = serializers.SlugField(
        max_length=100,
        validators=[
            RegexValidator(
                regex=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$",
                message=(
                    "Slug must be lowercase alphanumeric with hyphens only. "
                    "Must start and end with a letter or number."
                ),
            )
        ],
    )

    class Meta:
        model  = StatusPage
        fields = [
            "name",
            "slug",
            "description",
            "brand_color",
            "theme",
            "is_public",
            "allow_subscriptions",
            "show_beacon_branding",
            "custom_domain",
        ]

    def validate_slug(self, value):
        qs = StatusPage.objects.filter(slug=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "This slug is already taken."
            )
        return value

    def validate_brand_color(self, value):
        import re
        if not re.match(r"^[0-9A-Fa-f]{6}$", value):
            raise serializers.ValidationError(
                "Must be a 6-digit hex color without #. e.g. '3B82F6'."
            )
        return value.upper()

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("slug", None)
        return super().update(instance, validated_data)


class SubscriberWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Subscriber
        fields = [
            "notification_channel",
            "telegram_chat_id",
            "email",
        ]

    def validate(self, data):
        channel = data.get("notification_channel")

        if channel == Subscriber.NotificationChannel.TELEGRAM:
            if not data.get("telegram_chat_id", "").strip():
                raise serializers.ValidationError({
                    "telegram_chat_id": (
                        "telegram_chat_id is required for Telegram subscriptions."
                    ),
                })

        if channel == Subscriber.NotificationChannel.EMAIL:
            if not data.get("email", "").strip():
                raise serializers.ValidationError({
                    "email": "email is required for email subscriptions.",
                })

        return data


class PublicStatusPageSerializer(serializers.ModelSerializer):
    """
    Public-safe read shape for the unauthenticated status page endpoint.
    Strips all internal fields. Returns only what a visitor needs to see.
    Includes active incidents and monitor statuses.
    """

    overall_status   = serializers.CharField(read_only=True)
    public_url       = serializers.CharField(read_only=True)
    monitors         = serializers.SerializerMethodField()
    active_incidents = serializers.SerializerMethodField()

    class Meta:
        model  = StatusPage
        fields = [
            "name",
            "slug",
            "description",
            "brand_color",
            "theme",
            "allow_subscriptions",
            "show_beacon_branding",
            "overall_status",
            "public_url",
            "monitors",
            "active_incidents",
        ]

    def get_monitors(self, obj):
        entries = obj.monitors.select_related("monitor").order_by(
            "display_order", "created_at"
        )
        return [
            {
                "id":                  str(entry.monitor.id),
                "name":                entry.public_name,
                "status":              entry.monitor.status,
                "show_uptime_history": entry.show_uptime_history,
                "last_checked_at":     entry.monitor.last_checked_at,
            }
            for entry in entries
        ]

    def get_active_incidents(self, obj):
        monitor_ids = obj.monitors.values_list("monitor_id", flat=True)
        incidents = (
            Incident.objects.filter(
                owner=obj.owner,
                is_public=True,
            )
            .exclude(status=Incident.IncidentStatus.RESOLVED)
            .prefetch_related("updates", "affected_monitors__monitor")
            .order_by("-started_at")[:10]
        )
        return IncidentReadSerializer(incidents, many=True).data