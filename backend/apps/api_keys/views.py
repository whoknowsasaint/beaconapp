# ──────────────────────────────────────────────
# Beacon- API Key Views + Auth Endpoints
#
# Auth endpoints (no authentication required):
#   GET  /api/v1/auth/csrf/   - set CSRF cookie
#   POST /api/v1/auth/login/  - session login
#   POST /api/v1/auth/logout/ - session logout
#   GET  /api/v1/auth/me/     - current user profile
#
# API Key endpoints (session or API key auth):
#   GET    /api/v1/api-keys/       - list keys
#   POST   /api/v1/api-keys/       - create key
#   GET    /api/v1/api-keys/{id}/  - retrieve key
#   DELETE /api/v1/api-keys/{id}/  - revoke key
# ──────────────────────────────────────────────

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.throttling import LoginRateThrottle
from .models import APIKey
from .serializers import (
    APIKeyReadSerializer,
    APIKeyCreateSerializer,
    APIKeyCreatedSerializer,
)


# ══ Auth Endpoints ═════════════════════════════

class CSRFView(APIView):
    """
    GET /api/v1/auth/csrf/

    Sets the csrftoken cookie on the client.
    The frontend calls this on initialisation
    before making any mutating requests.
    No authentication required.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # get_token() forces Django to set the csrftoken cookie.
        get_token(request)
        return Response({"detail": "CSRF cookie set."})


class LoginView(APIView):
    """
    POST /api/v1/auth/login/

    Body: { "username": "...", "password": "..." }

    Authenticates with Django's session backend.
    Returns the current user profile on success.
    Rate limited: 5 requests / minute per IP.
    """
    permission_classes  = [AllowAny]
    authentication_classes = []
    throttle_classes    = [LoginRateThrottle]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {
                    "error":   "validation",
                    "message": "Username and password are required.",
                    "fields":  {
                        "username": ["This field is required."] if not username else [],
                        "password": ["This field is required."] if not password else [],
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {
                    "error":   "auth",
                    "message": "Invalid username or password.",
                    "fields":  None,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {
                    "error":   "auth",
                    "message": "This account has been disabled.",
                    "fields":  None,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)

        return Response(
            {
                "id":         user.id,
                "username":   user.username,
                "email":      user.email,
                "first_name": user.first_name,
                "last_name":  user.last_name,
                "is_staff":   user.is_staff,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/

    Ends the current Django session.
    The API key (if any) is NOT revoked-
    session and API key auth are independent.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(
            {"detail": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    GET /api/v1/auth/me/

    Returns the current authenticated user's profile.
    Used by the frontend dashboard layout to verify
    session validity on each page load.
    Returns 401 if not authenticated.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id":         user.id,
                "username":   user.username,
                "email":      user.email,
                "first_name": user.first_name,
                "last_name":  user.last_name,
                "is_staff":   user.is_staff,
                "date_joined": user.date_joined,
            },
            status=status.HTTP_200_OK,
        )


# ══ API Key Endpoints ══════════════════════════

class APIKeyListCreateView(APIView):
    """
    GET  /api/v1/api-keys/ - list all keys for the current user
    POST /api/v1/api-keys/ - create a new key
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        keys = APIKey.objects.filter(
            owner=request.user,
        ).order_by("-created_at")

        serializer = APIKeyReadSerializer(keys, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = APIKeyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        api_key, raw_key = APIKey.generate(
            owner=request.user,
            name=serializer.validated_data["name"],
            expires_at=serializer.validated_data.get("expires_at"),
        )

        return Response(
            {
                "id":       str(api_key.id),
                "name":     api_key.name,
                "prefix":   api_key.prefix,
                "raw_key":  raw_key,
                "created_at": api_key.created_at,
            },
            status=status.HTTP_201_CREATED,
        )


class APIKeyDetailView(APIView):
    """
    GET    /api/v1/api-keys/{id}/ - retrieve a single key
    DELETE /api/v1/api-keys/{id}/ - revoke a key
    """
    permission_classes = [IsAuthenticated]

    def _get_key(self, request, key_id):
        """Fetch a key owned by the current user or return None."""
        try:
            return APIKey.objects.get(id=key_id, owner=request.user)
        except APIKey.DoesNotExist:
            return None

    def get(self, request, key_id):
        api_key = self._get_key(request, key_id)
        if api_key is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "API key not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = APIKeyReadSerializer(api_key)
        return Response(serializer.data)

    def delete(self, request, key_id):
        api_key = self._get_key(request, key_id)
        if api_key is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "API key not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not api_key.is_active:
            return Response(
                {
                    "error":   "validation",
                    "message": "This key has already been revoked.",
                    "fields":  None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key.revoke()

        return Response(
            {"detail": "API key revoked successfully."},
            status=status.HTTP_200_OK,
        )