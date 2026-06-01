# ──────────────────────────────────────────────
# Beacon — API Key Serializers
# ──────────────────────────────────────────────

from rest_framework import serializers
from .models import APIKey


class APIKeyReadSerializer(serializers.ModelSerializer):
    """
    Read shape for listing API keys.
    Never exposes key_hash.
    Shows prefix, name, and lifecycle fields only.
    """
    is_expired = serializers.BooleanField(read_only=True)
    is_valid   = serializers.BooleanField(read_only=True)

    class Meta:
        model  = APIKey
        fields = [
            "id",
            "name",
            "prefix",
            "is_active",
            "is_expired",
            "is_valid",
            "last_used_at",
            "expires_at",
            "revoked_at",
            "created_at",
        ]
        read_only_fields = fields


class APIKeyCreateSerializer(serializers.Serializer):
    """
    Write shape for creating a new API key.
    Only accepts name and optional expires_at.
    """
    name       = serializers.CharField(max_length=100)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be blank.")
        return value.strip()


class APIKeyCreatedSerializer(serializers.Serializer):
    """
    Response shape for a newly created API key.
    Includes the raw key — shown exactly once.
    """
    id      = serializers.UUIDField()
    name    = serializers.CharField()
    prefix  = serializers.CharField()
    raw_key = serializers.CharField(
        help_text="The full API key. Store this now — it will not be shown again."
    )
    created_at = serializers.DateTimeField()