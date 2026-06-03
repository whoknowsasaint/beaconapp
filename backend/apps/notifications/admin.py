from django.contrib import admin
from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display  = [
        "incident",
        "subscriber",
        "event_type",
        "delivery_status",
        "retry_count",
        "sent_at",
        "created_at",
    ]
    list_filter   = ["event_type", "delivery_status"]
    search_fields = ["incident__title"]
    readonly_fields = [
        "id", "incident", "subscriber",
        "event_type", "delivery_status",
        "error", "retry_count",
        "sent_at", "created_at",
    ]
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False