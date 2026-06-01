# ──────────────────────────────────────────────
# Beacon — Custom Exception Handler
#
# Standardises every error response to:
# {
#   "error":   "validation" | "auth" | "permission" | "not_found" | "server",
#   "message": "Human-readable description",
#   "fields":  { "field_name": ["error detail"] } | null
# }
#
# Registered in settings via:
#   REST_FRAMEWORK["EXCEPTION_HANDLER"] = "core.exceptions.beacon_exception_handler"
# ──────────────────────────────────────────────

from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    Throttled,
)
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def beacon_exception_handler(exc, context):
    """
    Custom DRF exception handler.
    Transforms all DRF exceptions into the Beacon standard error shape.
    Falls back to DRF's default handler for unrecognised exceptions.
    """

    # Let DRF handle the exception first so we get the response object.
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — 500
        logger.exception(
            "Unhandled exception in %s",
            context.get("view", "unknown view"),
            exc_info=exc,
        )
        return Response(
            {
                "error":   "server",
                "message": "An unexpected error occurred. Please try again.",
                "fields":  None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ── Map DRF exceptions → Beacon error shape ──

    if isinstance(exc, ValidationError):
        # ValidationError.detail can be a dict (field errors)
        # or a list (non-field errors).
        fields  = None
        message = "Validation failed. Please check the fields below."

        if isinstance(exc.detail, dict):
            fields = _flatten_errors(exc.detail)
        elif isinstance(exc.detail, list):
            # Non-field validation error — put in message
            message = _join_messages(exc.detail)

        response.data = {
            "error":   "validation",
            "message": message,
            "fields":  fields,
        }

    elif isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        response.data = {
            "error":   "auth",
            "message": "Authentication required. Please log in.",
            "fields":  None,
        }

    elif isinstance(exc, PermissionDenied):
        response.data = {
            "error":   "permission",
            "message": "You do not have permission to perform this action.",
            "fields":  None,
        }

    elif isinstance(exc, NotFound):
        response.data = {
            "error":   "not_found",
            "message": "The requested resource was not found.",
            "fields":  None,
        }

    elif isinstance(exc, MethodNotAllowed):
        response.data = {
            "error":   "validation",
            "message": f"Method '{exc.args[0]}' not allowed.",
            "fields":  None,
        }

    elif isinstance(exc, Throttled):
        wait = int(exc.wait) if exc.wait else "unknown"
        response.data = {
            "error":   "throttled",
            "message": f"Too many requests. Please wait {wait} seconds.",
            "fields":  None,
        }

    else:
        # Any other DRF exception — wrap generically
        response.data = {
            "error":   "server",
            "message": str(exc),
            "fields":  None,
        }

    return response


# ─── Helpers ──────────────────────────────────

def _flatten_errors(detail, prefix=""):
    """
    Recursively flattens DRF's nested validation error dict
    into a flat { field_name: [error_string, ...] } dict.

    Input:  {"name": [ErrorDetail("This field is required.")],
             "config": {"url": [ErrorDetail("Enter a valid URL.")]}}
    Output: {"name": ["This field is required."],
             "config.url": ["Enter a valid URL."]}
    """
    result = {}
    for key, value in detail.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            result.update(_flatten_errors(value, prefix=full_key))
        elif isinstance(value, list):
            result[full_key] = [str(e) for e in value]
        else:
            result[full_key] = [str(value)]
    return result


def _join_messages(detail):
    """Joins a list of ErrorDetail objects into a single string."""
    return " ".join(str(e) for e in detail)