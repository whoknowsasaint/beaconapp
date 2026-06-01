from django.urls import path
from .views import (
    IncidentListCreateView,
    IncidentDetailView,
    IncidentUpdateListCreateView,
)

urlpatterns = [
    path(
        "",
        IncidentListCreateView.as_view(),
        name="incident-list-create",
    ),
    path(
        "<uuid:incident_id>/",
        IncidentDetailView.as_view(),
        name="incident-detail",
    ),
    path(
        "<uuid:incident_id>/updates/",
        IncidentUpdateListCreateView.as_view(),
        name="incident-update-list-create",
    ),
]