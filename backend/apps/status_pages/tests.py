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