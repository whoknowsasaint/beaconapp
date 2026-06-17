# ──────────────────────────────────────────────
# Beacon- Rate Limiting
#
# Three throttle classes with distinct policies:
#
#   LoginThrottle        5  / minute - brute-force protection
#   PublicStatusThrottle 120/ minute - CDN-friendly public reads
#   APIKeyThrottle       1000/ hour  - authenticated API usage
#
# Applied per-view via throttle_classes = [...].
# Global defaults (anon/user) set in settings/base.py.
# ──────────────────────────────────────────────

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Strict throttle for the login endpoint.
    Keyed by IP address (anonymous).
    5 attempts per minute before 429 is returned.
    Protects against credential stuffing and brute force.
    """
    scope = "login"
    rate  = "5/minute"


class PublicStatusPageThrottle(AnonRateThrottle):
    """
    Permissive throttle for public status page reads.
    Keyed by IP address (anonymous).
    120 requests per minute- high enough for CDN pre-warming
    and multiple browser tabs polling simultaneously.
    """
    scope = "public_status"
    rate  = "120/minute"


class APIKeyThrottle(UserRateThrottle):
    """
    Throttle for authenticated API key requests.
    Keyed by the authenticated user's ID.
    1000 requests per hour- sufficient for integrations
    and automation scripts without enabling abuse.
    """
    scope = "api_key"
    rate  = "1000/hour"