from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.utils import timezone
from unittest.mock import patch, MagicMock
import json

from rest_framework.test import APIClient
from rest_framework import status

from apps.monitors.models import Monitor, MonitorCheck
from apps.incidents.models import Incident
from apps.status_pages.models import StatusPage, Subscriber
from apps.notifications.models import NotificationLog


def make_user(username):
    return User.objects.create_user(username=username, password="pass")


def make_monitor(user, name="API"):
    return Monitor.objects.create(
        owner=user,
        name=name,
        monitor_type=Monitor.MonitorType.HTTP,
        url="https://api.example.com",
        status=Monitor.MonitorStatus.OPERATIONAL,
    )


def make_page(user, slug="test"):
    return StatusPage.objects.create(
        owner=user,
        name="Test Page",
        slug=slug,
        is_public=True,
    )


def make_subscriber(page, email="test@example.com", confirmed=True):
    return Subscriber.objects.create(
        status_page=page,
        notification_channel=Subscriber.NotificationChannel.EMAIL,
        email=email,
        is_confirmed=confirmed,
        is_active=True,
    )


def make_check(monitor, check_status="up", days_ago=0):
    from datetime import timedelta
    return MonitorCheck.objects.create(
        monitor=monitor,
        status=check_status,
        response_time_ms=100 if check_status == "up" else None,
        http_status_code=200 if check_status == "up" else None,
        checked_at=timezone.now() - timedelta(days=days_ago, hours=1),
    )


# ---------------------------------------------------------------------------
# Email delivery
# ---------------------------------------------------------------------------

class EmailDeliveryTest(TestCase):

    def setUp(self):
        self.user       = make_user("emailtest")
        self.page       = make_page(self.user, slug="email-page")
        self.subscriber = make_subscriber(self.page)
        self.incident   = Incident.objects.create(
            owner=self.user,
            title="API Outage",
            severity="critical",
            status="investigating",
            started_at=timezone.now(),
        )

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_incident_created_email_sends(self):
        from django.core import mail
        from apps.notifications.email import _send_email

        _send_email(self.subscriber, self.incident, self.page, "incident_created")

        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]
        self.assertIn("API Outage", msg.subject)
        self.assertIn("🔴", msg.subject)
        self.assertEqual(msg.to, [self.subscriber.email])

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_incident_resolved_email_sends(self):
        from django.core import mail
        from apps.notifications.email import _send_email

        _send_email(self.subscriber, self.incident, self.page, "incident_resolved")

        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]
        self.assertIn("✅", msg.subject)
        self.assertIn("Resolved", msg.subject)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_contains_unsubscribe_link(self):
        from django.core import mail
        from apps.notifications.email import _send_email

        _send_email(self.subscriber, self.incident, self.page, "incident_created")

        msg = mail.outbox[0]
        self.assertIn(str(self.subscriber.unsubscribe_token), msg.body)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_contains_status_page_url(self):
        from django.core import mail
        from apps.notifications.email import _send_email

        _send_email(self.subscriber, self.incident, self.page, "incident_created")

        msg = mail.outbox[0]
        self.assertIn("email-page", msg.body)

    def test_email_skips_when_no_email_address(self):
        self.subscriber.email = ""
        self.subscriber.save()
        from apps.notifications.email import _send_email

        # Should not raise
        _send_email(self.subscriber, self.incident, self.page, "incident_created")

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_dispatcher_routes_email_channel(self):
        from django.core import mail
        from apps.notifications.dispatcher import dispatch

        dispatch(self.incident, "incident_created")

        self.assertEqual(len(mail.outbox), 1)


# ---------------------------------------------------------------------------
# Telegram bot webhook
# ---------------------------------------------------------------------------

class TelegramBotWebhookTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user   = make_user("bottest")
        self.page   = make_page(self.user, slug="bot-page")

    def _post_update(self, text, chat_id="12345"):
        payload = {
            "message": {
                "chat": {"id": chat_id},
                "text": text,
            }
        }
        return self.client.post(
            "/api/v1/telegram/webhook/",
            data=json.dumps(payload),
            content_type="application/json",
        )

    @patch("apps.notifications.telegram_bot._post_to_chat")
    def test_start_with_valid_slug_creates_subscriber(self, mock_chat):
        response = self._post_update(f"/start bot-page")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"ok": True})

        sub = Subscriber.objects.filter(
            status_page=self.page,
            telegram_chat_id="12345",
        ).first()

        self.assertIsNotNone(sub)
        self.assertTrue(sub.is_confirmed)
        self.assertTrue(sub.is_active)

    @patch("apps.notifications.telegram_bot._post_to_chat")
    def test_start_with_invalid_slug_sends_error(self, mock_chat):
        self._post_update("/start nonexistent-slug")

        mock_chat.assert_called_once()
        call_text = mock_chat.call_args[0][1]
        self.assertIn("not found", call_text.lower())

    @patch("apps.notifications.telegram_bot._post_to_chat")
    def test_start_twice_with_same_chat_id_does_not_duplicate(self, mock_chat):
        self._post_update("/start bot-page")
        self._post_update("/start bot-page")

        self.assertEqual(
            Subscriber.objects.filter(
                status_page=self.page,
                telegram_chat_id="12345",
            ).count(),
            1,
        )

    @patch("apps.notifications.telegram_bot._post_to_chat")
    def test_stop_deactivates_all_subscriptions(self, mock_chat):
        Subscriber.objects.create(
            status_page=self.page,
            notification_channel=Subscriber.NotificationChannel.TELEGRAM,
            telegram_chat_id="99999",
            is_confirmed=True,
            is_active=True,
        )

        response = self._post_update("/stop", chat_id="99999")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub = Subscriber.objects.get(telegram_chat_id="99999")
        self.assertFalse(sub.is_active)

    @patch("apps.notifications.telegram_bot._post_to_chat")
    def test_stop_with_no_subscriptions_sends_message(self, mock_chat):
        self._post_update("/stop", chat_id="77777")
        mock_chat.assert_called_once()

    @patch("apps.notifications.telegram_bot._post_to_chat")
    def test_webhook_always_returns_200(self, mock_chat):
        # Malformed JSON body
        response = self.client.post(
            "/api/v1/telegram/webhook/",
            data="not-json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_webhook_is_csrf_exempt(self):
        # APIClient without CSRF enforcement confirms the view is exempt
        payload = {"message": {"chat": {"id": "1"}, "text": "/help"}}
        response = self.client.post(
            "/api/v1/telegram/webhook/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertNotEqual(response.status_code, 403)


# ---------------------------------------------------------------------------
# Public uptime endpoint
# ---------------------------------------------------------------------------

class PublicStatusPageUptimeTest(TestCase):

    def setUp(self):
        self.client  = APIClient()
        self.user    = make_user("uptimepub")
        self.page    = make_page(self.user, slug="uptime-pub")
        self.monitor = make_monitor(self.user)
        from apps.status_pages.models import StatusPageMonitor
        StatusPageMonitor.objects.create(
            status_page=self.page,
            monitor=self.monitor,
            display_order=0,
            show_uptime_history=True,
        )

    def test_public_uptime_accessible_without_auth(self):
        response = self.client.get(
            "/api/v1/status-pages/uptime-pub/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_uptime_returns_correct_shape(self):
        response = self.client.get(
            "/api/v1/status-pages/uptime-pub/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], "uptime-pub")
        self.assertEqual(response.data["days"], 90)
        self.assertIn("monitors", response.data)
        self.assertEqual(len(response.data["monitors"]), 1)

    def test_public_uptime_monitor_has_buckets(self):
        for i in range(5):
            make_check(self.monitor, "up", days_ago=i)

        response = self.client.get(
            "/api/v1/status-pages/uptime-pub/uptime/?days=7"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mon = response.data["monitors"][0]
        self.assertIn("buckets", mon)
        self.assertEqual(len(mon["buckets"]), 7)

    def test_public_uptime_private_page_returns_404(self):
        self.page.is_public = False
        self.page.save()

        response = self.client.get(
            "/api/v1/status-pages/uptime-pub/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_uptime_nonexistent_page_returns_404(self):
        response = self.client.get(
            "/api/v1/status-pages/doesnotexist/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_uptime_days_param_respected(self):
        response = self.client.get(
            "/api/v1/status-pages/uptime-pub/uptime/?days=30"
        )
        self.assertEqual(response.data["days"], 30)
        self.assertEqual(len(response.data["monitors"][0]["buckets"]), 30)

    def test_public_uptime_invalid_days_defaults_to_90(self):
        response = self.client.get(
            "/api/v1/status-pages/uptime-pub/uptime/?days=invalid"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["days"], 90)

    def test_public_uptime_returns_monitor_status(self):
        response = self.client.get(
            "/api/v1/status-pages/uptime-pub/uptime/"
        )
        mon = response.data["monitors"][0]
        self.assertIn("status", mon)
        self.assertEqual(mon["status"], "operational")

    def test_public_uptime_does_not_require_authentication(self):
        # Explicitly unauthenticated
        client = APIClient()
        response = client.get(
            "/api/v1/status-pages/uptime-pub/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# One-click unsubscribe endpoint
# ---------------------------------------------------------------------------

class PublicUnsubscribeTest(TestCase):

    def setUp(self):
        self.client     = APIClient()
        self.user       = make_user("unsub5")
        self.page       = make_page(self.user, slug="unsub-page")
        self.subscriber = make_subscriber(self.page, email="unsub@example.com")

    def test_unsubscribe_with_valid_token(self):
        response = self.client.get(
            f"/api/v1/status-pages/unsub-page/unsubscribe/"
            f"?token={self.subscriber.unsubscribe_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.subscriber.refresh_from_db()
        self.assertFalse(self.subscriber.is_active)

    def test_unsubscribe_with_invalid_token_returns_404(self):
        import uuid
        response = self.client.get(
            f"/api/v1/status-pages/unsub-page/unsubscribe/"
            f"?token={uuid.uuid4()}"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unsubscribe_without_token_returns_400(self):
        response = self.client.get(
            "/api/v1/status-pages/unsub-page/unsubscribe/"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unsubscribe_does_not_require_authentication(self):
        client = APIClient()
        response = client.get(
            f"/api/v1/status-pages/unsub-page/unsubscribe/"
            f"?token={self.subscriber.unsubscribe_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)