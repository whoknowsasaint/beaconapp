from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import BeaconPageNumberPagination
from core.throttling import PublicStatusPageThrottle
from .filters import StatusPageFilter
from .models import StatusPage, StatusPageMonitor, Subscriber
from .serializers import (
    StatusPageReadSerializer,
    StatusPageWriteSerializer,
    StatusPageMonitorWriteSerializer,
    SubscriberWriteSerializer,
    PublicStatusPageSerializer,
)


class StatusPageListCreateView(APIView):

    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class    = StatusPageFilter
    search_fields      = ["name", "slug"]
    ordering_fields    = ["created_at", "name"]
    ordering           = ["-created_at"]

    def _apply_filters(self, request, queryset):
        for backend in self.filter_backends:
            queryset = backend().filter_queryset(request, queryset, self)
        return queryset

    def get(self, request):
        queryset = StatusPage.objects.filter(
            owner=request.user,
        ).prefetch_related(
            "monitors__monitor",
            "subscribers",
        ).order_by("-created_at")

        queryset   = self._apply_filters(request, queryset)
        paginator  = BeaconPageNumberPagination()
        page       = paginator.paginate_queryset(queryset, request)
        serializer = StatusPageReadSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = StatusPageWriteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        page = serializer.save()
        return Response(
            StatusPageReadSerializer(page).data,
            status=status.HTTP_201_CREATED,
        )


class StatusPageDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_page(self, request, slug):
        try:
            return StatusPage.objects.prefetch_related(
                "monitors__monitor",
                "subscribers",
            ).get(slug=slug, owner=request.user)
        except StatusPage.DoesNotExist:
            return None

    def _not_found(self):
        return Response(
            {
                "error":   "not_found",
                "message": "Status page not found.",
                "fields":  None,
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    def get(self, request, slug):
        page = self._get_page(request, slug)
        if page is None:
            return self._not_found()
        return Response(StatusPageReadSerializer(page).data)

    def patch(self, request, slug):
        page = self._get_page(request, slug)
        if page is None:
            return self._not_found()

        serializer = StatusPageWriteSerializer(
            page,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        page = serializer.save()
        return Response(StatusPageReadSerializer(page).data)

    def delete(self, request, slug):
        page = self._get_page(request, slug)
        if page is None:
            return self._not_found()
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StatusPageMonitorView(APIView):
    """
    POST   /api/v1/status-pages/{slug}/monitors/       add a monitor
    DELETE /api/v1/status-pages/{slug}/monitors/{id}/  remove a monitor
    """

    permission_classes = [IsAuthenticated]

    def _get_page(self, request, slug):
        try:
            return StatusPage.objects.get(slug=slug, owner=request.user)
        except StatusPage.DoesNotExist:
            return None

    def post(self, request, slug):
        page = self._get_page(request, slug)
        if page is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Status page not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = StatusPageMonitorWriteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        monitor = serializer.validated_data["monitor"]

        entry, created = StatusPageMonitor.objects.get_or_create(
            status_page=page,
            monitor=monitor,
            defaults={
                "display_name":        serializer.validated_data.get("display_name", ""),
                "display_order":       serializer.validated_data.get("display_order", 0),
                "show_uptime_history": serializer.validated_data.get("show_uptime_history", True),
            },
        )

        if not created:
            return Response(
                {
                    "error":   "validation",
                    "message": "This monitor is already on the status page.",
                    "fields":  None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Monitor added to status page."},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, slug, entry_id):
        page = self._get_page(request, slug)
        if page is None:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Status page not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            entry = StatusPageMonitor.objects.get(
                id=entry_id,
                status_page=page,
            )
        except StatusPageMonitor.DoesNotExist:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Monitor entry not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicStatusPageView(APIView):
    """
    GET /api/v1/status-pages/{slug}/public/

    Unauthenticated. Returns public-safe status page data.
    Rate limited to 120 requests/minute per IP.
    Returns 404 for pages where is_public=False.
    """

    permission_classes  = [AllowAny]
    authentication_classes = []
    throttle_classes    = [PublicStatusPageThrottle]

    def get(self, request, slug):
        try:
            page = StatusPage.objects.prefetch_related(
                "monitors__monitor",
            ).get(slug=slug, is_public=True)
        except StatusPage.DoesNotExist:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Status page not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PublicStatusPageSerializer(page)
        return Response(serializer.data)


class SubscribeView(APIView):
    """
    POST /api/v1/status-pages/{slug}/subscribe/

    Public endpoint. Allows visitors to subscribe for notifications.
    Requires allow_subscriptions=True on the status page.
    """

    permission_classes     = [AllowAny]
    authentication_classes = []
    throttle_classes       = [PublicStatusPageThrottle]

    def post(self, request, slug):
        try:
            page = StatusPage.objects.get(slug=slug, is_public=True)
        except StatusPage.DoesNotExist:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Status page not found.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not page.allow_subscriptions:
            return Response(
                {
                    "error":   "validation",
                    "message": "This status page does not accept subscriptions.",
                    "fields":  None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SubscriberWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        channel  = serializer.validated_data["notification_channel"]
        chat_id  = serializer.validated_data.get("telegram_chat_id", "")
        email    = serializer.validated_data.get("email", "")

        existing = Subscriber.objects.filter(
            status_page=page,
            notification_channel=channel,
            is_active=True,
            **( {"telegram_chat_id": chat_id} if channel == "telegram" else {"email": email} ),
        ).first()

        if existing:
            return Response(
                {
                    "error":   "validation",
                    "message": "You are already subscribed to this status page.",
                    "fields":  None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        Subscriber.objects.create(
            status_page=page,
            notification_channel=channel,
            telegram_chat_id=chat_id,
            email=email,
        )

        return Response(
            {"detail": "Subscribed successfully. Please confirm your subscription."},
            status=status.HTTP_201_CREATED,
        )


class UnsubscribeView(APIView):
    """
    POST /api/v1/status-pages/{slug}/unsubscribe/{token}/

    Public endpoint. No authentication required.
    The unsubscribe token is the credential.
    """

    permission_classes     = [AllowAny]
    authentication_classes = []

    def post(self, request, slug, token):
        try:
            subscriber = Subscriber.objects.get(
                status_page__slug=slug,
                unsubscribe_token=token,
                is_active=True,
            )
        except Subscriber.DoesNotExist:
            return Response(
                {
                    "error":   "not_found",
                    "message": "Subscription not found or already cancelled.",
                    "fields":  None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        subscriber.unsubscribe()
        return Response(
            {"detail": "Unsubscribed successfully."},
            status=status.HTTP_200_OK,
        )