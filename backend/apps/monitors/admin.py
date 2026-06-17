# ──────────────────────────────────────────────
# Beacon- Monitors Admin
# Registers Monitor and MonitorCheck with the
# Django admin for data inspection during development.
# ──────────────────────────────────────────────

from django.contrib import admin
from .models import Monitor, MonitorCheck


@admin.register(Monitor)
class MonitorAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "monitor_type",
        "status",
        "is_active",
        "interval",
        "last_checked_at",
        "created_at",
    ]
    list_filter  = ["monitor_type", "status", "is_active"]
    search_fields = ["name", "url", "host"]
    readonly_fields = ["id", "created_at", "updated_at", "last_checked_at"]
    ordering = ["-created_at"]

    fieldsets = [
        ("Identity", {
            "fields": ["id", "owner", "name", "monitor_type"],
        }),
        ("Target", {
            "fields": ["url", "host", "port"],
            "description": "URL for HTTP monitors. Host + port for TCP. Host for PING.",
        }),
        ("Configuration", {
            "fields": ["interval", "timeout", "expected_status_codes"],
        }),
        ("State", {
            "fields": ["status", "is_active", "last_checked_at"],
        }),
        ("Timestamps", {
            "fields": ["created_at", "updated_at"],
            "classes": ["collapse"],
        }),
    ]


@admin.register(MonitorCheck)
class MonitorCheckAdmin(admin.ModelAdmin):
    list_display = [
        "monitor",
        "status",
        "response_time_ms",
        "http_status_code",
        "region",
        "checked_at",
    ]
    list_filter  = ["status", "region"]
    search_fields = ["monitor__name"]
    readonly_fields = [
        "id",
        "monitor",
        "status",
        "response_time_ms",
        "http_status_code",
        "error",
        "region",
        "checked_at",
    ]
    ordering = ["-checked_at"]

    # MonitorChecks are never created manually in admin-
    # they are written by the checker worker only.
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False