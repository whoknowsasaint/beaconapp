# ──────────────────────────────────────────────
# Beacon — WSGI Entry Point
# Used by Gunicorn in production.
# ──────────────────────────────────────────────

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.production")

application = get_wsgi_application()