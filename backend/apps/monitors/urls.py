# Beacon -- Monitor URL Patterns
# Mounted at /api/v1/monitors/ in core/urls.py

from django.urls import path
from .views import (
    MonitorListCreateView,
    MonitorDetailView,
    MonitorCheckListView,
)

urlpatterns = [
    path(
        "",
        MonitorListCreateView.as_view(),
        name="monitor-list-create",
    ),
    path(
        "<uuid:monitor_id>/",
        MonitorDetailView.as_view(),
        name="monitor-detail",
    ),
    path(
        "<uuid:monitor_id>/checks/",
        MonitorCheckListView.as_view(),
        name="monitor-check-list",
    ),
]