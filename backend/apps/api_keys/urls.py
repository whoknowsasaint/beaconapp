# ──────────────────────────────────────────────
# Beacon — API Key + Auth URL Patterns
# ──────────────────────────────────────────────

from django.urls import path
from .views import (
    CSRFView,
    LoginView,
    LogoutView,
    MeView,
    APIKeyListCreateView,
    APIKeyDetailView,
)

# Auth patterns — mounted at /api/v1/auth/
auth_urlpatterns = [
    path("csrf/",   CSRFView.as_view(),   name="auth-csrf"),
    path("login/",  LoginView.as_view(),  name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/",     MeView.as_view(),     name="auth-me"),
]

# API Key patterns — mounted at /api/v1/api-keys/
apikey_urlpatterns = [
    path("",          APIKeyListCreateView.as_view(), name="apikey-list-create"),
    path("<uuid:key_id>/", APIKeyDetailView.as_view(),     name="apikey-detail"),
]