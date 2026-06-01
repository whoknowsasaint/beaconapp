# ──────────────────────────────────────────────
# Beacon — API Key Authentication Backend
#
# Plugs into DRF's authentication system.
# Reads the Authorization header, extracts the key,
# and delegates to APIKey.authenticate().
#
# Header format:
#   Authorization: Bearer bk_live_<32 hex chars>
#
# Added to REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"]
# in settings/base.py after this file exists.
# ──────────────────────────────────────────────

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class APIKeyAuthentication(BaseAuthentication):

    HEADER_PREFIX = "Bearer"

    def authenticate(self, request):
        """
        Called by DRF on every request.
        Returns (user, api_key) tuple if authenticated.
        Returns None if no API key header is present
        (allows DRF to try the next authentication class).
        Raises AuthenticationFailed for invalid keys.
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header.startswith(self.HEADER_PREFIX + " "):
            # No Bearer header — not our responsibility.
            # Return None so DRF tries SessionAuthentication next.
            return None

        raw_key = auth_header[len(self.HEADER_PREFIX) + 1:].strip()

        if not raw_key:
            raise AuthenticationFailed("API key is empty.")

        # Lazy import to avoid circular import at module load time
        from .models import APIKey

        api_key = APIKey.authenticate(raw_key)

        if api_key is None:
            raise AuthenticationFailed(
                "Invalid or expired API key."
            )

        # DRF expects (user, auth) where auth is stored
        # as request.auth for the lifetime of the request.
        return (api_key.owner, api_key)

    def authenticate_header(self, request):
        """
        Returned in the WWW-Authenticate header on 401 responses.
        Tells API clients what authentication scheme to use.
        """
        return 'Bearer realm="Beacon API"'