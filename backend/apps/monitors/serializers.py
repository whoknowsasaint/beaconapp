# Beacon -- Monitor Serializers
#
# Two serializer pairs:
#   Monitor:      MonitorReadSerializer, MonitorWriteSerializer
#   MonitorCheck: MonitorCheckSerializer (read-only)
#
# Read serializers include computed fields and safe display values.
# Write serializers enforce validation and reject computed fields.

from rest_framework import serializers
from .models import Monitor, MonitorCheck


class MonitorCheckSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for MonitorCheck.
    Used in the nested checks history endpoint.
    MonitorChecks are never created via the API --
    they are written by the checker worker only.
    """

    class Meta:
        model  = MonitorCheck
        fields = [
            "id",
            "status",
            "response_time_ms",
            "http_status_code",
            "error",
            "region",
            "checked_at",
        ]
        read_only_fields = fields


class MonitorReadSerializer(serializers.ModelSerializer):
    """
    Read shape for Monitor.
    Returned by GET /api/v1/monitors/ and GET /api/v1/monitors/{id}/.
    Includes display labels for choice fields and computed fields.
    """

    monitor_type_display = serializers.CharField(
        source="get_monitor_type_display",
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    expected_status_codes_list = serializers.SerializerMethodField()

    class Meta:
        model  = Monitor
        fields = [
            "id",
            "name",
            "monitor_type",
            "monitor_type_display",
            "url",
            "host",
            "port",
            "interval",
            "timeout",
            "expected_status_codes",
            "expected_status_codes_list",
            "status",
            "status_display",
            "is_active",
            "last_checked_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_expected_status_codes_list(self, obj):
        return obj.get_expected_status_codes()


class MonitorWriteSerializer(serializers.ModelSerializer):
    """
    Write shape for Monitor.
    Used by POST /api/v1/monitors/ and PATCH /api/v1/monitors/{id}/.
    Validates field combinations per monitor type.
    Rejects all read-only and computed fields.
    """

    class Meta:
        model  = Monitor
        fields = [
            "name",
            "monitor_type",
            "url",
            "host",
            "port",
            "interval",
            "timeout",
            "expected_status_codes",
            "is_active",
        ]

    def validate(self, data):
        monitor_type = data.get(
            "monitor_type",
            getattr(self.instance, "monitor_type", Monitor.MonitorType.HTTP),
        )

        # HTTP monitors require a URL
        if monitor_type == Monitor.MonitorType.HTTP:
            url = data.get("url", getattr(self.instance, "url", ""))
            if not url:
                raise serializers.ValidationError({
                    "url": "URL is required for HTTP monitors.",
                })

        # TCP monitors require host and port
        if monitor_type == Monitor.MonitorType.TCP:
            host = data.get("host", getattr(self.instance, "host", ""))
            port = data.get("port", getattr(self.instance, "port", None))
            if not host:
                raise serializers.ValidationError({
                    "host": "Host is required for TCP monitors.",
                })
            if port is None:
                raise serializers.ValidationError({
                    "port": "Port is required for TCP monitors.",
                })

        # PING monitors require host
        if monitor_type == Monitor.MonitorType.PING:
            host = data.get("host", getattr(self.instance, "host", ""))
            if not host:
                raise serializers.ValidationError({
                    "host": "Host is required for PING monitors.",
                })

        # Validate expected_status_codes format
        codes_str = data.get("expected_status_codes", "")
        if codes_str:
            parts = [p.strip() for p in codes_str.split(",")]
            for part in parts:
                if not part.isdigit():
                    raise serializers.ValidationError({
                        "expected_status_codes": (
                            f"'{part}' is not a valid status code. "
                            "Use comma-separated integers e.g. '200,201'."
                        ),
                    })
                code = int(part)
                if not (100 <= code <= 599):
                    raise serializers.ValidationError({
                        "expected_status_codes": (
                            f"{code} is not a valid HTTP status code. "
                            "Must be between 100 and 599."
                        ),
                    })

        return data

    def create(self, validated_data):
        # owner is injected by the view, not the client
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)