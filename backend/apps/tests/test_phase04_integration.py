from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from unittest.mock import patch
from datetime import timedelta

from rest_framework.test import APIClient
from rest_framework import status

from apps.monitors.models import Monitor, MonitorCheck
from apps.incidents.models import Incident
from apps.status_pages.models import StatusPage, Subscriber
from apps.notifications.models import NotificationLog
from apps.checker.engine import CheckResult
from apps.checker.writer import save_check_result


def make_user(username):
    return User.objects.create_user(username=username, password="pass")


def make_monitor(user, name="Test Monitor", mon_status=Monitor.MonitorStatus.OPERATIONAL):
    return Monitor.objects.create(
        owner=user,
        name=name,
        monitor_type=Monitor.MonitorType.HTTP,
        url="https://example.com",
        interval=60,
        status=mon_status,
    )


def make_page(user, slug="test"):
    return StatusPage.objects.create(
        owner=user,
        name="Test Page",
        slug=slug,
        is_public=True,
    )


def make_subscriber(page, chat_id="123"):
    return Subscriber.objects.create(
        status_page=page,
        notification_channel=Subscriber.NotificationChannel.TELEGRAM,
        telegram_chat_id=chat_id,
        is_confirmed=True,
        is_active=True,
    )


def make_check(monitor, check_status, days_ago=0):
    return MonitorCheck.objects.create(
        monitor=monitor,
        status=check_status,
        response_time_ms=100 if check_status == "up" else None,
        http_status_code=200 if check_status == "up" else None,
        checked_at=timezone.now() - timedelta(days=days_ago, hours=1),
    )


class NotificationDeliveryIntegrationTest(TestCase):

    def setUp(self):
        self.user       = make_user("notifint")
        self.page       = make_page(self.user, slug="notif-page")
        self.subscriber = make_subscriber(self.page)
        self.monitor    = make_monitor(self.user)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_full_outage_cycle_sends_created_and_resolved(self, mock_tg):
        down = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Connection refused",
        )
        save_check_result(self.monitor, down)

        self.monitor.refresh_from_db()

        up = CheckResult(
            status="up",
            response_time_ms=88,
            http_status_code=200,
            error="",
        )
        save_check_result(self.monitor, up)

        self.assertEqual(mock_tg.call_count, 2)

        logs = NotificationLog.objects.filter(
            subscriber=self.subscriber,
        ).order_by("created_at")

        self.assertEqual(logs.count(), 2)
        self.assertEqual(logs[0].event_type, NotificationLog.EventType.INCIDENT_CREATED)
        self.assertEqual(logs[1].event_type, NotificationLog.EventType.INCIDENT_RESOLVED)
        self.assertTrue(all(
            l.delivery_status == NotificationLog.DeliveryStatus.SENT
            for l in logs
        ))

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_multiple_subscribers_all_notified(self, mock_tg):
        make_subscriber(self.page, chat_id="456")
        make_subscriber(self.page, chat_id="789")

        down = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )
        save_check_result(self.monitor, down)

        self.assertEqual(mock_tg.call_count, 3)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_delivery_failure_captured_in_log(self, mock_tg):
        mock_tg.side_effect = RuntimeError("Telegram API error")

        down = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )
        save_check_result(self.monitor, down)

        log = NotificationLog.objects.filter(
            event_type="incident_created"
        ).first()

        self.assertIsNotNone(log)
        self.assertEqual(log.delivery_status, NotificationLog.DeliveryStatus.FAILED)
        self.assertIn("Telegram API error", log.error)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_notification_failure_does_not_crash_checker(self, mock_tg):
        mock_tg.side_effect = RuntimeError("Network error")

        down = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )

        try:
            save_check_result(self.monitor, down)
        except Exception as exc:
            self.fail(f"save_check_result raised an exception: {exc}")

        self.monitor.refresh_from_db()
        self.assertEqual(self.monitor.status, Monitor.MonitorStatus.OUTAGE)


class UptimeAPIIntegrationTest(TestCase):

    def setUp(self):
        self.client  = APIClient()
        self.user    = make_user("uptimeapi")
        self.monitor = make_monitor(self.user)
        self.client.force_authenticate(user=self.user)

    def test_uptime_with_real_check_data(self):
        for _ in range(10):
            make_check(self.monitor, "up", days_ago=0)
        for _ in range(2):
            make_check(self.monitor, "down", days_ago=1)
        for _ in range(8):
            make_check(self.monitor, "up", days_ago=1)

        response = self.client.get(
            f"/api/v1/monitors/{self.monitor.id}/uptime/?days=7"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["buckets"]), 7)

        today     = response.data["buckets"][-1]
        yesterday = response.data["buckets"][-2]

        self.assertEqual(today["status"],     "up")
        self.assertEqual(today["total"],      10)
        self.assertEqual(yesterday["total"],  10)
        self.assertIsNotNone(yesterday["pct"])

    def test_uptime_empty_days_are_no_data(self):
        response = self.client.get(
            f"/api/v1/monitors/{self.monitor.id}/uptime/?days=7"
        )
        for bucket in response.data["buckets"]:
            self.assertEqual(bucket["status"], "no_data")

    def test_uptime_endpoint_requires_auth(self):
        unauthed = APIClient()
        response = unauthed.get(
            f"/api/v1/monitors/{self.monitor.id}/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"], "auth")

    def test_uptime_not_visible_to_other_users(self):
        other = make_user("otheruptime")
        self.client.force_authenticate(user=other)
        response = self.client.get(
            f"/api/v1/monitors/{self.monitor.id}/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_uptime_days_default_is_90(self):
        response = self.client.get(
            f"/api/v1/monitors/{self.monitor.id}/uptime/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["days"], 90)
        self.assertEqual(len(response.data["buckets"]), 90)

    def test_uptime_invalid_days_param_falls_back_to_default(self):
        response = self.client.get(
            f"/api/v1/monitors/{self.monitor.id}/uptime/?days=notanumber"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["days"], 90)


class SlackWebhookIntegrationTest(TestCase):

    def setUp(self):
        self.client  = APIClient()
        self.user    = make_user("slackint")
        self.page    = make_page(self.user, slug="slack-int")
        self.monitor = make_monitor(self.user)
        self.client.force_authenticate(user=self.user)

    def test_slack_webhook_url_persists_on_status_page(self):
        response = self.client.patch(
            f"/api/v1/status-pages/slack-int/",
            {"slack_webhook_url": "https://hooks.slack.com/test"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.page.refresh_from_db()
        self.assertEqual(
            self.page.slack_webhook_url,
            "https://hooks.slack.com/test",
        )

    @patch("apps.notifications.slack._post_webhook")
    @patch("apps.notifications.dispatcher._send_telegram")
    def test_slack_fires_on_incident_when_webhook_configured(
        self, mock_tg, mock_slack
    ):
        self.page.slack_webhook_url = "https://hooks.slack.com/test"
        self.page.save()

        down = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )
        save_check_result(self.monitor, down)

        mock_slack.assert_called_once()

    @patch("apps.notifications.slack._post_webhook")
    @patch("apps.notifications.dispatcher._send_telegram")
    def test_slack_not_fired_when_no_webhook(self, mock_tg, mock_slack):
        self.page.slack_webhook_url = ""
        self.page.save()

        down = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )
        save_check_result(self.monitor, down)

        mock_slack.assert_not_called()


class DashboardStatsTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user   = make_user("dashstats")
        self.client.force_authenticate(user=self.user)

    def test_monitors_list_returns_all_statuses(self):
        statuses = [
            Monitor.MonitorStatus.OPERATIONAL,
            Monitor.MonitorStatus.DEGRADED,
            Monitor.MonitorStatus.OUTAGE,
            Monitor.MonitorStatus.PENDING,
        ]
        for i, s in enumerate(statuses):
            make_monitor(self.user, name=f"Monitor {i}", mon_status=s)

        response = self.client.get("/api/v1/monitors/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 4)

        status_set = {m["status"] for m in response.data["results"]}
        self.assertIn("operational", status_set)
        self.assertIn("degraded",    status_set)
        self.assertIn("outage",      status_set)

    def test_incidents_list_filter_by_active(self):
        Incident.objects.create(
            owner=self.user,
            title="Active",
            severity="minor",
            status="investigating",
            started_at=timezone.now(),
        )
        Incident.objects.create(
            owner=self.user,
            title="Resolved",
            severity="minor",
            status="resolved",
            started_at=timezone.now() - timedelta(hours=2),
            resolved_at=timezone.now() - timedelta(hours=1),
        )

        response = self.client.get("/api/v1/incidents/?status=investigating")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Active")

    def test_status_page_slack_webhook_field_in_response(self):
        page = make_page(self.user, slug="dash-slack")
        response = self.client.get(f"/api/v1/status-pages/dash-slack/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_status_page_does_not_expose_slack_webhook(self):
        make_page(self.user, slug="pub-check")
        response = self.client.get("/api/v1/status-pages/pub-check/public/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("slack_webhook_url", response.data)