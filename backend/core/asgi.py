# ──────────────────────────────────────────────
# Beacon- ASGI Entry Point
# Reserved for future WebSocket support
# (real-time status updates via Django Channels).
# ──────────────────────────────────────────────

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.production")

application = get_asgi_application()