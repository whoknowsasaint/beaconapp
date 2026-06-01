from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.api_keys.urls import auth_urlpatterns, apikey_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/v1/auth/",         include((auth_urlpatterns,   "auth"))),
    path("api/v1/api-keys/",     include((apikey_urlpatterns, "api-keys"))),
    path("api/v1/monitors/",     include("apps.monitors.urls")),
    path("api/v1/incidents/",    include("apps.incidents.urls")),
    path("api/v1/status-pages/", include("apps.status_pages.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )