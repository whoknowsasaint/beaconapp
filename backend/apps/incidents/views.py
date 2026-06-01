from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import BeaconPageNumberPagination
from .filters import IncidentFilter
from .models import Incident, IncidentUpdate
from .serializers import (
    IncidentReadSerializer,
    IncidentWriteSerializer,
    IncidentUpdateReadSerializer,
    IncidentUpdateWriteSerializer,
)


class IncidentListCreateView(APIView):

    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class    = IncidentFilter
    search_fields      = ["title"]
    ordering_fields    = ["started_at", "created_at", "severity", "status"]
    ordering           = ["-started_at"]

    def _apply_filters(self, request, queryset):
        for backend in self.filter_backends:
            queryset = backend().filter_queryset(request, queryset, self)
        return queryset

    def get(self, request):
        queryset = Incident.objects.filter(
            owner=request.user,
        ).prefetch_related(
            "updates",
            "affected_monitors__monitor",
        ).order_by("-started_at")

        queryset   = self._apply_filters(request, queryset)
        paginator  = BeaconPageNumberPagination()
        page       = paginator.paginate_queryset(queryset, request)
        serializer = IncidentReadSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = IncidentWriteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()
        return Response(
            IncidentReadSerializer(incident).data,
            status=status.HTTP_201_CREATED,
        )


class IncidentDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_incident(self, request, incident_id):
        try:
            return Incident.objects.prefetch_related(
                "updates",
                "affected_monitors__monitor",
            ).get(id=incident_id, owner=request.user)
        except Incident.DoesNotExist:
            return None

    def _not_found(self):
        return Response(
            {
                "error":   "not_found",
                "message": "Incident not found.",
                "fields":  None,
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    def get(self, request, incident_id):
        incident = self._get_incident(request, incident_id)
        if incident is None:
            return self._not_found()
        return Response(IncidentReadSerializer(incident).data)

    def patch(self, request, incident_id):
        incident = self._get_incident(request, incident_id)
        if incident is None:
            return self._not_found()

        serializer = IncidentWriteSerializer(
            incident,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()
        return Response(IncidentReadSerializer(incident).data)

    def delete(self, request, incident_id):
        incident = self._get_incident(request, incident_id)
        if incident is None:
            return self._not_found()
        incident.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IncidentUpdateListCreateView(APIView):
    """
    GET  /api/v1/incidents/{id}/updates/  -- list updates (newest first)
    POST /api/v1/incidents/{id}/updates/  -- post a new update
    """

    permission_classes = [IsAuthenticated]

    def _get_incident(self, request, incident_id):
        try:
            return Incident.objects.get(id=incident_id, owner=request.user)
        except Incident.DoesNotExist:
            return None

    def get(self, request, incident_id):
        incident = self._get_incident(request, incident_id)
        if incident is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Incident not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        updates = IncidentUpdate.objects.filter(
            incident=incident,
        ).order_by("-created_at")

        paginator  = BeaconPageNumberPagination()
        page       = paginator.paginate_queryset(updates, request)
        serializer = IncidentUpdateReadSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, incident_id):
        incident = self._get_incident(request, incident_id)
        if incident is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Incident not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IncidentUpdateWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        update = IncidentUpdate.objects.create(
            incident=incident,
            posted_by=request.user,
            status_at_update=incident.status,
            message=serializer.validated_data["message"],
            is_public=serializer.validated_data.get("is_public", True),
        )

        return Response(
            IncidentUpdateReadSerializer(update).data,
            status=status.HTTP_201_CREATED,
        )