# ──────────────────────────────────────────────
# Beacon — Status Pages Model Tests
# Run with: python manage.py test apps.status_pages
# ──────────────────────────────────────────────

import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from apps.monitors.models import Monitor
from .models import StatusPage, StatusPageMonitor, Subscriber


def make_user(username):
    return User.objects.create_user(username=username, password="pass123")


def make_monitor(user, name="API Gateway"):
    return Monitor.objects.create(
        owner=user,
        name=name,
        monitor_type=Monitor.MonitorType.HTTP,
        url="https://api.example.com",
    )


def make_status_page(user, name="Acme Status", slug="acme"):
    return StatusPage.objects.create(
        owner=user,
        name=name,
        slug=slug,
    )


class StatusPageModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="pageuser",
            password="pass123",
        )
        self.page = make_status_page(self.user)

    def test_status_page_str(self):
        self.assertEqual(str(self.page), "Acme Status (/acme/)")

    def test_status_page_uuid_primary_key(self):
        self.assertIsInstance(self.page.id, uuid.UUID)

    def test_public_url_property(self):
        self.assertEqual(self.page.public_url, "/status/acme/")

    def test_default_is_public_true(self):
        self.assertTrue(self.page.is_public)

    def test_default_allow_subscriptions_true(self):
        self.assertTrue(self.page.allow_subscriptions)

    def test_default_show_beacon_branding_true(self):
        self.assertTrue(self.page.show_beacon_branding)

    def test_slug_must_be_unique(self):
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            make_status_page(self.user, name="Other Page", slug="acme")

    def test_overall_status_operational_with_no_monitors(self):
        self.assertEqual(self.page.overall_status, "operational")

    def test_overall_status_operational_with_healthy_monitor(self):
        monitor = make_monitor(self.user)
        monitor.status = Monitor.MonitorStatus.OPERATIONAL
        monitor.save()
        StatusPageMonitor.objects.create(
            status_page=self.page,
            monitor=monitor,
            display_order=0,
        )
        self.assertEqual(self.page.overall_status, "operational")

    def test_overall_status_outage_when_any_monitor_down(self):
        monitor = make_monitor(self.user)
        monitor.status = Monitor.MonitorStatus.OUTAGE
        monitor.save()
        StatusPageMonitor.objects.create(
            status_page=self.page,
            monitor=monitor,
            display_order=0,
        )
        self.assertEqual(self.page.overall_status, "outage")

    def test_overall_status_degraded_when_any_monitor_degraded(self):
        monitor = make_monitor(self.user)
        monitor.status = Monitor.MonitorStatus.DEGRADED
        monitor.save()
        StatusPageMonitor.objects.create(
            status_page=self.page,
            monitor=monitor,
            display_order=0,
        )
        self.assertEqual(self.page.overall_status, "degraded")

    def test_overall_status_outage_takes_priority_over_degraded(self):
        m1 = make_monitor(self.user, name="M1")
        m1.status = Monitor.MonitorStatus.DEGRADED
        m1.save()

        m2 = make_monitor(self.user, name="M2")
        m2.status = Monitor.MonitorStatus.OUTAGE
        m2.save()

        StatusPageMonitor.objects.create(
            status_page=self.page, monitor=m1, display_order=0
        )
        StatusPageMonitor.objects.create(
            status_page=self.page, monitor=m2, display_order=1
        )

        self.assertEqual(self.page.overall_status, "outage")


class StatusPageMonitorModelTest(TestCase):

    def setUp(self):
        self.user = make_user("spmuser")
        self.page    = make_status_page(self.user)
        self.monitor = make_monitor(self.user)
        self.spm = StatusPageMonitor.objects.create(
            status_page=self.page,
            monitor=self.monitor,
            display_name="API",
            display_order=0,
        )

    def test_str(self):
        self.assertEqual(
            str(self.spm),
            "Acme Status → API",
        )

    def test_public_name_uses_display_name_when_set(self):
        self.assertEqual(self.spm.public_name, "API")

    def test_public_name_falls_back_to_monitor_name(self):
        self.spm.display_name = ""
        self.assertEqual(self.spm.public_name, "API Gateway")

    def test_duplicate_monitor_on_same_page_raises_error(self):
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            StatusPageMonitor.objects.create(
                status_page=self.page,
                monitor=self.monitor,
                display_order=1,
            )

    def test_uuid_primary_key(self):
        self.assertIsInstance(self.spm.id, uuid.UUID)

    def test_default_show_uptime_history_true(self):
        self.assertTrue(self.spm.show_uptime_history)


class SubscriberModelTest(TestCase):

    def setUp(self):
        self.user = make_user("subuser")
        self.page = make_status_page(self.user)

    def test_telegram_subscriber_str(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.TELEGRAM,
            telegram_chat_id="123456789",
        )
        self.assertIn("123456789", str(sub))
        self.assertIn("Acme Status", str(sub))

    def test_email_subscriber_str(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="user@example.com",
        )
        self.assertIn("user@example.com", str(sub))

    def test_uuid_primary_key(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="a@example.com",
        )
        self.assertIsInstance(sub.id, uuid.UUID)

    def test_unsubscribe_token_is_uuid(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="b@example.com",
        )
        self.assertIsInstance(sub.unsubscribe_token, uuid.UUID)

    def test_default_is_confirmed_false(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="c@example.com",
        )
        self.assertFalse(sub.is_confirmed)

    def test_default_is_active_true(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="d@example.com",
        )
        self.assertTrue(sub.is_active)

    def test_unsubscribe_sets_is_active_false(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="e@example.com",
        )
        sub.unsubscribe()
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)

    def test_unsubscribe_soft_deletes_preserves_record(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="f@example.com",
        )
        sub_id = sub.id
        sub.unsubscribe()
        self.assertTrue(Subscriber.objects.filter(id=sub_id).exists())

    def test_cascades_on_status_page_delete(self):
        Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="g@example.com",
        )
        page_id = self.page.id
        self.page.delete()
        self.assertEqual(
            Subscriber.objects.filter(status_page_id=page_id).count(),
            0,
        )

from rest_framework.test import APIClient
from rest_framework import status as drf_status
from apps.monitors.models import Monitor


class StatusPageAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="spapi", password="pass123"
        )
        self.other_user = User.objects.create_user(
            username="other", password="pass123"
        )
        self.client.force_authenticate(user=self.user)

        self.page = StatusPage.objects.create(
            owner=self.user,
            name="Acme Status",
            slug="acme",
        )

    def test_list_returns_paginated_shape(self):
        response = self.client.get("/api/v1/status-pages/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        for key in ["count", "next", "previous", "results"]:
            self.assertIn(key, response.data)

    def test_list_returns_only_own_pages(self):
        StatusPage.objects.create(
            owner=self.other_user,
            name="Other",
            slug="other",
        )
        response = self.client.get("/api/v1/status-pages/")
        self.assertEqual(response.data["count"], 1)

    def test_create_status_page(self):
        response = self.client.post(
            "/api/v1/status-pages/",
            {"name": "New Page", "slug": "new-page"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "new-page")

    def test_create_duplicate_slug_fails(self):
        response = self.client.post(
            "/api/v1/status-pages/",
            {"name": "Dupe", "slug": "acme"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)
        self.assertIn("slug", response.data["fields"])

    def test_create_invalid_brand_color_fails(self):
        response = self.client.post(
            "/api/v1/status-pages/",
            {"name": "Color Test", "slug": "color-test", "brand_color": "ZZZZZZ"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)
        self.assertIn("brand_color", response.data["fields"])

    def test_retrieve_own_page(self):
        response = self.client.get("/api/v1/status-pages/acme/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Acme Status")

    def test_retrieve_other_users_page_returns_404(self):
        StatusPage.objects.create(
            owner=self.other_user,
            name="Other",
            slug="other-page",
        )
        response = self.client.get("/api/v1/status-pages/other-page/")
        self.assertEqual(response.status_code, drf_status.HTTP_404_NOT_FOUND)

    def test_patch_name(self):
        response = self.client.patch(
            "/api/v1/status-pages/acme/",
            {"name": "Updated Name"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Name")

    def test_patch_slug_is_ignored(self):
        response = self.client.patch(
            "/api/v1/status-pages/acme/",
            {"slug": "new-slug"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], "acme")

    def test_delete_page(self):
        response = self.client.delete("/api/v1/status-pages/acme/")
        self.assertEqual(response.status_code, drf_status.HTTP_204_NO_CONTENT)
        self.assertFalse(StatusPage.objects.filter(slug="acme").exists())

    def test_add_monitor_to_page(self):
        monitor = Monitor.objects.create(
            owner=self.user,
            name="API",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://api.example.com",
        )
        response = self.client.post(
            "/api/v1/status-pages/acme/monitors/",
            {"monitor": str(monitor.id), "display_order": 0},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)

    def test_add_other_users_monitor_to_page_fails(self):
        monitor = Monitor.objects.create(
            owner=self.other_user,
            name="Not Mine",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://notmine.example.com",
        )
        response = self.client.post(
            "/api/v1/status-pages/acme/monitors/",
            {"monitor": str(monitor.id)},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/status-pages/")
        self.assertEqual(response.status_code, drf_status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"], "auth")


class PublicStatusPageAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="pubuser", password="pass123"
        )
        self.page = StatusPage.objects.create(
            owner=self.user,
            name="Public Page",
            slug="public",
            is_public=True,
        )
        self.private_page = StatusPage.objects.create(
            owner=self.user,
            name="Private Page",
            slug="private",
            is_public=False,
        )

    def test_public_page_accessible_without_auth(self):
        response = self.client.get("/api/v1/status-pages/public/public/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)

    def test_public_page_returns_safe_fields_only(self):
        response = self.client.get("/api/v1/status-pages/public/public/")
        self.assertNotIn("owner", response.data)
        self.assertNotIn("subscriber_count", response.data)
        self.assertIn("overall_status", response.data)
        self.assertIn("monitors", response.data)
        self.assertIn("active_incidents", response.data)

    def test_private_page_returns_404_publicly(self):
        response = self.client.get("/api/v1/status-pages/private/public/")
        self.assertEqual(response.status_code, drf_status.HTTP_404_NOT_FOUND)

    def test_nonexistent_page_returns_404(self):
        response = self.client.get("/api/v1/status-pages/doesnotexist/public/")
        self.assertEqual(response.status_code, drf_status.HTTP_404_NOT_FOUND)


class SubscriberAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="subapi", password="pass123"
        )
        self.page = StatusPage.objects.create(
            owner=self.user,
            name="Sub Page",
            slug="sub-page",
            is_public=True,
            allow_subscriptions=True,
        )

    def test_subscribe_via_email(self):
        response = self.client.post(
            "/api/v1/status-pages/sub-page/subscribe/",
            {
                "notification_channel": "email",
                "email":                "user@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)

    def test_subscribe_telegram(self):
        response = self.client.post(
            "/api/v1/status-pages/sub-page/subscribe/",
            {
                "notification_channel": "telegram",
                "telegram_chat_id":     "123456789",
            },
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)

    def test_subscribe_email_without_email_fails(self):
        response = self.client.post(
            "/api/v1/status-pages/sub-page/subscribe/",
            {"notification_channel": "email"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data["fields"])

    def test_duplicate_subscription_fails(self):
        self.client.post(
            "/api/v1/status-pages/sub-page/subscribe/",
            {"notification_channel": "email", "email": "dup@example.com"},
            format="json",
        )
        response = self.client.post(
            "/api/v1/status-pages/sub-page/subscribe/",
            {"notification_channel": "email", "email": "dup@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)

    def test_unsubscribe_with_valid_token(self):
        sub = Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.EMAIL,
            email="unsub@example.com",
        )
        response = self.client.post(
            f"/api/v1/status-pages/sub-page/unsubscribe/{sub.unsubscribe_token}/",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)

    def test_unsubscribe_invalid_token_returns_404(self):
        import uuid
        response = self.client.post(
            f"/api/v1/status-pages/sub-page/unsubscribe/{uuid.uuid4()}/",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_404_NOT_FOUND)

    def test_subscribe_to_page_with_subscriptions_disabled_fails(self):
        self.page.allow_subscriptions = False
        self.page.save()
        response = self.client.post(
            "/api/v1/status-pages/sub-page/subscribe/",
            {"notification_channel": "email", "email": "x@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)        