# ──────────────────────────────────────────────
# Beacon- Base Settings
# Shared across all environments.
# Environment-specific files import from here.
# ──────────────────────────────────────────────

from pathlib import Path
from decouple import config, Csv

# ─── Paths ────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ─── Security ─────────────────────────────────

SECRET_KEY = config("SECRET_KEY", default="")

ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv(), default="")

# ─── Application Definition ───────────────────

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "django_filters",
]

LOCAL_APPS = [
    "apps.monitors",
    "apps.incidents",
    "apps.status_pages",
    "apps.api_keys",
    "apps.checker",
    "apps.notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─── Middleware ────────────────────────────────

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",          
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ─── URL Configuration ────────────────────────

ROOT_URLCONF = "core.urls"

# ─── Templates ────────────────────────────────

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ─── WSGI / ASGI ──────────────────────────────

WSGI_APPLICATION = "core.wsgi.application"

# ─── Database ─────────────────────────────────

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default=""),
        "USER": config("DB_USER", default=""),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}

# ─── Password Validation ──────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─── Internationalisation ─────────────────────

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ─── Static & Media Files ─────────────────────

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ─── Default Primary Key ──────────────────────

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Django REST Framework ────────────────────

REST_FRAMEWORK = {
    # ── Authentication ──────────────────────
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "apps.api_keys.authentication.APIKeyAuthentication",
    ],

    # ── Permissions ─────────────────────────
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],

    # ── Rendering ───────────────────────────
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],

    # ── Pagination ──────────────────────────
    # Single class used by all list views.
    "DEFAULT_PAGINATION_CLASS": "core.pagination.BeaconPageNumberPagination",
    "PAGE_SIZE": 20,

    # ── Filtering ───────────────────────────
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],

    # ── Exception Handling ──────────────────
    # Transforms all errors into { error, message, fields }.
    "EXCEPTION_HANDLER": "core.exceptions.beacon_exception_handler",

    # ── Throttling ──────────────────────────
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Global defaults
        "anon":          "100/hour",
        "user":          "1000/hour",
        # Named scopes- matched by throttle_classes on each view
        "login":         "5/minute",
        "public_status": "120/minute",
        "api_key":       "1000/hour",
    },
}

TELEGRAM_BOT_TOKEN  = config("TELEGRAM_BOT_TOKEN",  default="")
# ── Application URL ─────────────────────────────────────────────────────────
# Used in email templates and bot confirmation messages.
APP_URL = config("APP_URL", default="http://localhost:3000")

# ── Email ────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST          = config("EMAIL_HOST",          default="smtp.gmail.com")
EMAIL_PORT          = config("EMAIL_PORT",          default=587, cast=int)
EMAIL_USE_TLS       = config("EMAIL_USE_TLS",       default=True, cast=bool)
EMAIL_HOST_USER     = config("EMAIL_HOST_USER",     default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL  = config(
    "DEFAULT_FROM_EMAIL",
    default="Beacon Alerts <alerts@beacon.example.com>",
)