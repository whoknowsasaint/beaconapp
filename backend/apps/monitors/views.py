# Beacon -- Monitor Views
#
# Endpoints:
#   GET    /api/v1/monitors/                  list monitors
#   POST   /api/v1/monitors/                  create monitor
#   GET    /api/v1/monitors/{id}/             retrieve monitor
#   PATCH  /api/v1/monitors/{id}/             partial update
#   DELETE /api/v1/monitors/{id}/             delete monitor
#   GET    /api/v1/monitors/{id}/checks/      list check history
#
# All endpoints scope to request.user -- users never
# see or modify monitors belonging to other accounts.

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import BeaconPageNumberPagination
from .filters import MonitorFilter
from .models import Monitor, MonitorCheck
from .serializers import (
    MonitorReadSerializer,
    MonitorWriteSerializer,
    MonitorCheckSerializer,
)


class MonitorListCreateView(APIView):
    """
    GET  /api/v1/monitors/
    POST /api/v1/monitors/
    """

    permission_classes = [IsAuthenticated]

    # Wire up filter backends manually on APIView
    # (they are auto-wired on ModelViewSet but we use APIView
    # for explicit control over the read/write serializer split)
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = MonitorFilter
    search_fields   = ["name"]
    ordering_fields = ["created_at", "name", "status"]
    ordering        = ["-created_at"]

    def _apply_filters(self, request, queryset):
        """
        Manually applies filter, search, and ordering backends.
        Required because APIView does not call these automatically.
        """
        for backend in self.filter_backends:
            queryset = backend().filter_queryset(request, queryset, self)
        return queryset

    def get(self, request):
        queryset = Monitor.objects.filter(
            owner=request.user,
        ).order_by("-created_at")

        queryset   = self._apply_filters(request, queryset)
        paginator  = BeaconPageNumberPagination()
        page       = paginator.paginate_queryset(queryset, request)
        serializer = MonitorReadSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = MonitorWriteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        monitor = serializer.save()
        return Response(
            MonitorReadSerializer(monitor).data,
            status=status.HTTP_201_CREATED,
        )


class MonitorDetailView(APIView):
    """
    GET    /api/v1/monitors/{monitor_id}/
    PATCH  /api/v1/monitors/{monitor_id}/
    DELETE /api/v1/monitors/{monitor_id}/
    """

    permission_classes = [IsAuthenticated]

    def _get_monitor(self, request, monitor_id):
        """
        Fetch a monitor owned by request.user.
        Ownership is enforced at the queryset level --
        not just at the permission level.
        Returns Monitor or None.
        """
        try:
            return Monitor.objects.get(id=monitor_id, owner=request.user)
        except Monitor.DoesNotExist:
            return None

    def get(self, request, monitor_id):
        monitor = self._get_monitor(request, monitor_id)
        if monitor is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Monitor not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(MonitorReadSerializer(monitor).data)

    def patch(self, request, monitor_id):
        monitor = self._get_monitor(request, monitor_id)
        if monitor is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Monitor not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MonitorWriteSerializer(
            monitor,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        monitor = serializer.save()
        return Response(MonitorReadSerializer(monitor).data)

    def delete(self, request, monitor_id):
        monitor = self._get_monitor(request, monitor_id)
        if monitor is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Monitor not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        monitor.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MonitorCheckListView(APIView):
    """
    GET /api/v1/monitors/{monitor_id}/checks/

    Returns paginated check history for a single monitor.
    Most recent checks first.
    Supports ?limit query param to cap results (default: page_size=20).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, monitor_id):
        try:
            monitor = Monitor.objects.get(id=monitor_id, owner=request.user)
        except Monitor.DoesNotExist:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Monitor not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        checks = MonitorCheck.objects.filter(
            monitor=monitor,
        ).order_by("-checked_at")

        paginator  = BeaconPageNumberPagination()
        page       = paginator.paginate_queryset(checks, request)
        serializer = MonitorCheckSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)