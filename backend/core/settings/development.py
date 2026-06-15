# ──────────────────────────────────────────────
# Beacon — Development Settings
# Extends base settings with dev-only overrides.
# Never use in production.
# ──────────────────────────────────────────────

from .base import *  # noqa: F401, F403

# ─── Security ─────────────────────────────────
SILENCED_SYSTEM_CHECKS = ['models.E034']
DEBUG = True

# ─── CORS ─────────────────────────────────────
# Allow the Next.js dev server to talk to Django

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# ─── CSRF ─────────────────────────────────────
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ─── Email ────────────────────────────────────
# Print emails to the console in development

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ─── Django REST Framework (dev additions) ────

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",  # enables the browser UI
]

# ─── Logging ──────────────────────────────────

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "DEBUG",  # logs every SQL query in dev
            "propagate": False,
        },
    },
}