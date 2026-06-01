from django.urls import path
from .views import (
    StatusPageListCreateView,
    StatusPageDetailView,
    StatusPageMonitorView,
    PublicStatusPageView,
    SubscribeView,
    UnsubscribeView,
)

urlpatterns = [
    path(
        "",
        StatusPageListCreateView.as_view(),
        name="statuspage-list-create",
    ),
    path(
        "<slug:slug>/",
        StatusPageDetailView.as_view(),
        name="statuspage-detail",
    ),
    path(
        "<slug:slug>/monitors/",
        StatusPageMonitorView.as_view(),
        name="statuspage-monitor-add",
    ),
    path(
        "<slug:slug>/monitors/<uuid:entry_id>/",
        StatusPageMonitorView.as_view(),
        name="statuspage-monitor-remove",
    ),
    path(
        "<slug:slug>/public/",
        PublicStatusPageView.as_view(),
        name="statuspage-public",
    ),
    path(
        "<slug:slug>/subscribe/",
        SubscribeView.as_view(),
        name="statuspage-subscribe",
    ),
    path(
        "<slug:slug>/unsubscribe/<uuid:token>/",
        UnsubscribeView.as_view(),
        name="statuspage-unsubscribe",
    ),
]