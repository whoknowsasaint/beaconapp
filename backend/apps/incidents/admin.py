# ──────────────────────────────────────────────
# Beacon- Incidents Admin
# ──────────────────────────────────────────────

from django.contrib import admin
from django.utils.html import format_html
from .models import Incident, IncidentUpdate, IncidentMonitor


class IncidentUpdateInline(admin.TabularInline):
    """
    Shows all updates for an incident inline on the
    incident detail page. Read-only- updates are
    posted via the API, not the admin.
    """
    model = IncidentUpdate
    extra = 0
    readonly_fields = [
        "id",
        "posted_by",
        "status_at_update",
        "message",
        "is_public",
        "created_at",
    ]
    ordering = ["-created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class IncidentMonitorInline(admin.TabularInline):
    """
    Shows all affected monitors for an incident inline.
    """
    model = IncidentMonitor
    extra = 0
    readonly_fields = [
        "id",
        "monitor",
        "monitor_status_snapshot",
        "recovered_at",
        "created_at",
    ]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "severity_badge",
        "status",
        "is_public",
        "auto_created",
        "started_at",
        "resolved_at",
    ]
    list_filter  = ["status", "severity", "is_public", "auto_created"]
    search_fields = ["title", "summary"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "auto_created",
    ]
    ordering = ["-started_at"]
    inlines  = [IncidentMonitorInline, IncidentUpdateInline]

    fieldsets = [
        ("Identity", {
            "fields": ["id", "owner", "title", "severity"],
        }),
        ("Status & Visibility", {
            "fields": ["status", "is_public", "auto_created"],
        }),
        ("Content", {
            "fields": ["summary"],
        }),
        ("Timeline", {
            "fields": ["started_at", "resolved_at"],
        }),
        ("Audit", {
            "fields": ["created_at", "updated_at"],
            "classes": ["collapse"],
        }),
    ]

    def severity_badge(self, obj):
        """Render severity as a colored badge in the list view."""
        colors = {
            "critical": "#EF4444",
            "major":    "#F59E0B",
            "minor":    "#3B82F6",
            "notice":   "#6B7280",
        }
        color = colors.get(obj.severity, "#6B7280")
        return format_html(
            '<span style="color: {}; font-weight: 600;">{}</span>',
            color,
            obj.get_severity_display(),
        )
    severity_badge.short_description = "Severity"


@admin.register(IncidentUpdate)
class IncidentUpdateAdmin(admin.ModelAdmin):
    list_display  = [
        "incident",
        "posted_by",
        "status_at_update",
        "is_public",
        "created_at",
    ]
    list_filter   = ["status_at_update", "is_public"]
    search_fields = ["incident__title", "message"]
    readonly_fields = [
        "id",
        "incident",
        "posted_by",
        "status_at_update",
        "message",
        "is_public",
        "created_at",
    ]
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False