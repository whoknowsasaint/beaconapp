# ──────────────────────────────────────────────
# Beacon- Monitors App Configuration
# ──────────────────────────────────────────────

from django.apps import AppConfig


class MonitorsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    # Must use the full dotted path because the app
    # lives inside the apps/ subdirectory.
    name = "apps.monitors"
    verbose_name = "Monitors"