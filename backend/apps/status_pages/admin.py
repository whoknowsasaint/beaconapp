# ──────────────────────────────────────────────
# Beacon- Status Pages Admin
# ──────────────────────────────────────────────

from django.contrib import admin
from django.utils.html import format_html
from .models import StatusPage, StatusPageMonitor, Subscriber


class StatusPageMonitorInline(admin.TabularInline):
    model = StatusPageMonitor
    extra = 0
    readonly_fields = ["id", "created_at"]
    fields = [
        "monitor",
        "display_name",
        "display_order",
        "show_uptime_history",
    ]
    ordering = ["display_order"]


class SubscriberInline(admin.TabularInline):
    model = Subscriber
    extra = 0
    readonly_fields = [
        "id",
        "notification_channel",
        "telegram_chat_id",
        "email",
        "unsubscribe_token",
        "is_confirmed",
        "is_active",
        "created_at",
    ]
    ordering = ["-created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(StatusPage)
class StatusPageAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "owner",
        "is_public",
        "allow_subscriptions",
        "subscriber_count",
        "created_at",
    ]
    list_filter  = ["is_public", "allow_subscriptions", "theme"]
    search_fields = ["name", "slug", "custom_domain"]
    readonly_fields = ["id", "created_at", "updated_at", "public_url"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["-created_at"]
    inlines  = [StatusPageMonitorInline, SubscriberInline]

    fieldsets = [
        ("Identity", {
            "fields": ["id", "owner", "name", "slug", "public_url"],
        }),
        ("Content", {
            "fields": ["description"],
        }),
        ("Appearance", {
            "fields": ["theme", "brand_color", "show_beacon_branding"],
        }),
        ("Access", {
            "fields": ["is_public", "allow_subscriptions", "custom_domain"],
        }),
        ("Audit", {
            "fields": ["created_at", "updated_at"],
            "classes": ["collapse"],
        }),
    ]

    def subscriber_count(self, obj):
        count = obj.subscribers.filter(is_active=True, is_confirmed=True).count()
        return format_html("<strong>{}</strong>", count)
    subscriber_count.short_description = "Active Subscribers"


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = [
        "notification_channel",
        "contact",
        "status_page",
        "is_confirmed",
        "is_active",
        "created_at",
    ]
    list_filter  = [
        "notification_channel",
        "is_confirmed",
        "is_active",
    ]
    search_fields = [
        "telegram_chat_id",
        "email",
        "status_page__name",
    ]
    readonly_fields = [
        "id",
        "unsubscribe_token",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]

    def contact(self, obj):
        if obj.notification_channel == Subscriber.NotificationChannel.TELEGRAM:
            return f"Telegram: {obj.telegram_chat_id}"
        return f"Email: {obj.email}"
    contact.short_description = "Contact"