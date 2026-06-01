from django.contrib import admin
from django.utils.html import format_html
from .models import APIKey


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = [
        "name", "owner", "prefix_display",
        "is_active", "last_used_at", "expires_at", "created_at",
    ]
    list_filter  = ["is_active"]
    search_fields = ["name", "owner__username", "prefix"]
    readonly_fields = [
        "id", "prefix", "key_hash",
        "created_at", "updated_at",
        "last_used_at", "revoked_at",
    ]
    ordering = ["-created_at"]

    def prefix_display(self, obj):
        return format_html("<code>{}...</code>", obj.prefix)
    prefix_display.short_description = "Key prefix"

    def has_add_permission(self, request):
        # Keys are created via the API only — never via admin.
        return False