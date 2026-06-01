# ──────────────────────────────────────────────
# Beacon — Pagination
# Single pagination class used by all list views.
# Returns: { count, next, previous, results }
# ──────────────────────────────────────────────

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class BeaconPageNumberPagination(PageNumberPagination):
    page_size            = 20
    page_size_query_param = "page_size"
    max_page_size        = 100
    page_query_param     = "page"

    def get_paginated_response(self, data):
        return Response({
            "count":    self.page.paginator.count,
            "next":     self.get_next_link(),
            "previous": self.get_previous_link(),
            "results":  data,
        })

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "count":    {"type": "integer", "example": 42},
                "next":     {"type": "string",  "nullable": True, "example": "http://localhost:8000/api/v1/monitors/?page=2"},
                "previous": {"type": "string",  "nullable": True, "example": None},
                "results":  schema,
            },
        }