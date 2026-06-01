# ──────────────────────────────────────────────
# Beacon — Root URL Configuration
# ──────────────────────────────────────────────

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # API v1 — all application routes mount here
    # Individual app URLs will be included as:
    # path("api/v1/monitors/", include("apps.monitors.urls")),
    # path("api/v1/incidents/", include("apps.incidents.urls")),
]

# Serve media files in development only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)