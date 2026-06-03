from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from unittest.mock import patch, MagicMock

from apps.monitors.models import Monitor
from apps.incidents.models import Incident
from apps.status_pages.models import StatusPage, Subscriber
from apps.notifications.models import NotificationLog
from apps.notifications.telegram import _build_message, _escape


def make_user(username):
    return User.objects.create_user(username=username, password="pass")


def make_incident(user, title="Test Incident", status="investigating"):
    return Incident.objects.create(
        owner=user,
        title=title,
        severity=Incident.Severity.CRITICAL,
        status=status,
        started_at=timezone.now(),
    )


def make_status_page(user, slug="test-page"):
    return StatusPage.objects.create(
        owner=user,
        name="Test Page",
        slug=slug,
    )


def make_subscriber(page, channel="telegram", chat_id="123456"):
    return Subscriber.objects.create(
        status_page=page,
        notification_channel=channel,
        telegram_chat_id=chat_id if channel == "telegram" else "",
        email="test@example.com" if channel == "email" else "",
        is_confirmed=True,
        is_active=True,
    )


class NotificationLogModelTest(TestCase):

    def setUp(self):
        self.user       = make_user("loguser")
        self.incident   = make_incident(self.user)
        self.page       = make_status_page(self.user)
        self.subscriber = make_subscriber(self.page)

    def test_str_contains_event_and_status(self):
        log = NotificationLog.objects.create(
            incident=self.incident,
            subscriber=self.subscriber,
            event_type=NotificationLog.EventType.INCIDENT_CREATED,
        )
        self.assertIn("incident_created", str(log))
        self.assertIn("pending", str(log))

    def test_mark_sent_updates_status_and_timestamp(self):
        log = NotificationLog.objects.create(
            incident=self.incident,
            subscriber=self.subscriber,
            event_type=NotificationLog.EventType.INCIDENT_CREATED,
        )
        log.mark_sent()
        log.refresh_from_db()
        self.assertEqual(log.delivery_status, NotificationLog.DeliveryStatus.SENT)
        self.assertIsNotNone(log.sent_at)

    def test_mark_failed_updates_status_and_error(self):
        log = NotificationLog.objects.create(
            incident=self.incident,
            subscriber=self.subscriber,
            event_type=NotificationLog.EventType.INCIDENT_CREATED,
        )
        log.mark_failed("Connection refused")
        log.refresh_from_db()
        self.assertEqual(log.delivery_status, NotificationLog.DeliveryStatus.FAILED)
        self.assertEqual(log.error, "Connection refused")
        self.assertEqual(log.retry_count, 1)

    def test_duplicate_log_raises_integrity_error(self):
        from django.db import IntegrityError
        NotificationLog.objects.create(
            incident=self.incident,
            subscriber=self.subscriber,
            event_type=NotificationLog.EventType.INCIDENT_CREATED,
        )
        with self.assertRaises(IntegrityError):
            NotificationLog.objects.create(
                incident=self.incident,
                subscriber=self.subscriber,
                event_type=NotificationLog.EventType.INCIDENT_CREATED,
            )

    def test_same_incident_different_event_type_is_allowed(self):
        NotificationLog.objects.create(
            incident=self.incident,
            subscriber=self.subscriber,
            event_type=NotificationLog.EventType.INCIDENT_CREATED,
        )
        log2 = NotificationLog.objects.create(
            incident=self.incident,
            subscriber=self.subscriber,
            event_type=NotificationLog.EventType.INCIDENT_RESOLVED,
        )
        self.assertIsNotNone(log2.pk)


class TelegramMessageBuildTest(TestCase):

    def setUp(self):
        self.user     = make_user("tguser")
        self.incident = make_incident(self.user)
        self.page     = make_status_page(self.user)

    def test_created_message_contains_title(self):
        msg = _build_message(self.incident, self.page, "incident_created")
        self.assertIn("Test Incident", msg)

    def test_created_message_contains_severity(self):
        msg = _build_message(self.incident, self.page, "incident_created")
        self.assertIn("CRITICAL", msg)

    def test_resolved_message_has_green_emoji(self):
        self.incident.status = "resolved"
        msg = _build_message(self.incident, self.page, "incident_resolved")
        self.assertIn("🟢", msg)

    def test_message_contains_status_page_link(self):
        msg = _build_message(self.incident, self.page, "incident_created")
        self.assertIn("test-page", msg)

    def test_escape_handles_html_chars(self):
        self.assertEqual(_escape("<b>Test & 'x'</b>"), "&lt;b&gt;Test &amp; 'x'&lt;/b&gt;")

    def test_escape_handles_empty_string(self):
        self.assertEqual(_escape(""), "")

    def test_escape_handles_none(self):
        self.assertEqual(_escape(None), "")

    @patch("apps.notifications.telegram.httpx.post")
    def test_send_message_calls_telegram_api(self, mock_post):
        mock_response        = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        from apps.notifications.telegram import _send_message
        _send_message("fake_token", "123456", "Hello")

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args
        self.assertIn("fake_token", call_kwargs[0][0])

    @patch("apps.notifications.telegram.httpx.post")
    def test_send_message_raises_on_http_error(self, mock_post):
        import httpx
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_post.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=mock_response
        )

        from apps.notifications.telegram import _send_message
        with self.assertRaises(RuntimeError):
            _send_message("fake_token", "123456", "Hello")

from apps.notifications.dispatcher import dispatch
from apps.notifications.slack import _build_blocks


class DispatcherTest(TestCase):

    def setUp(self):
        self.user       = make_user("dispuser")
        self.incident   = make_incident(self.user)
        self.page       = make_status_page(self.user, slug="disp-page")
        self.subscriber = make_subscriber(self.page)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_dispatch_creates_log_and_calls_telegram(self, mock_send):
        dispatch(self.incident, "incident_created")

        self.assertEqual(
            NotificationLog.objects.filter(
                incident=self.incident,
                event_type="incident_created",
            ).count(),
            1,
        )
        mock_send.assert_called_once()

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_dispatch_is_idempotent(self, mock_send):
        dispatch(self.incident, "incident_created")
        dispatch(self.incident, "incident_created")

        self.assertEqual(
            NotificationLog.objects.filter(
                incident=self.incident,
                event_type="incident_created",
            ).count(),
            1,
        )
        mock_send.assert_called_once()

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_dispatch_marks_log_sent_on_success(self, mock_send):
        dispatch(self.incident, "incident_created")
        log = NotificationLog.objects.get(
            incident=self.incident,
            event_type="incident_created",
        )
        self.assertEqual(log.delivery_status, NotificationLog.DeliveryStatus.SENT)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_dispatch_marks_log_failed_on_error(self, mock_send):
        mock_send.side_effect = RuntimeError("Connection refused")
        dispatch(self.incident, "incident_created")
        log = NotificationLog.objects.get(
            incident=self.incident,
            event_type="incident_created",
        )
        self.assertEqual(log.delivery_status, NotificationLog.DeliveryStatus.FAILED)
        self.assertIn("Connection refused", log.error)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_unconfirmed_subscriber_skipped(self, mock_send):
        self.subscriber.is_confirmed = False
        self.subscriber.save()
        dispatch(self.incident, "incident_created")
        mock_send.assert_not_called()

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_inactive_subscriber_skipped(self, mock_send):
        self.subscriber.is_active = False
        self.subscriber.save()
        dispatch(self.incident, "incident_created")
        mock_send.assert_not_called()

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_dispatch_fires_for_each_confirmed_subscriber(self, mock_send):
        make_subscriber(self.page, chat_id="999999")
        dispatch(self.incident, "incident_created")
        self.assertEqual(mock_send.call_count, 2)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_no_status_pages_means_no_notifications(self, mock_send):
        other_user     = make_user("nopage")
        other_incident = make_incident(other_user, title="Other")
        dispatch(other_incident, "incident_created")
        mock_send.assert_not_called()

    @patch("apps.notifications.slack._post_webhook")
    def test_slack_dispatched_when_webhook_configured(self, mock_post):
        self.page.slack_webhook_url = "https://hooks.slack.com/test"
        self.page.save()

        with patch("apps.notifications.dispatcher._send_telegram"):
            dispatch(self.incident, "incident_created")

        mock_post.assert_called_once()

    @patch("apps.notifications.slack._post_webhook")
    def test_slack_not_dispatched_when_no_webhook(self, mock_post):
        self.page.slack_webhook_url = ""
        self.page.save()

        with patch("apps.notifications.dispatcher._send_telegram"):
            dispatch(self.incident, "incident_created")

        mock_post.assert_not_called()


class SlackMessageBuildTest(TestCase):

    def setUp(self):
        self.user     = make_user("slackuser")
        self.incident = make_incident(self.user)
        self.page     = make_status_page(self.user, slug="slack-page")

    def test_blocks_contains_incident_title(self):
        blocks = _build_blocks(self.incident, self.page, "incident_created")
        all_text = str(blocks)
        self.assertIn("Test Incident", all_text)

    def test_created_event_header_text(self):
        blocks = _build_blocks(self.incident, self.page, "incident_created")
        header = blocks[0]
        self.assertIn("detected", header["text"]["text"])

    def test_resolved_event_header_text(self):
        self.incident.status = "resolved"
        blocks = _build_blocks(self.incident, self.page, "incident_resolved")
        header = blocks[0]
        self.assertIn("resolved", header["text"]["text"])

    def test_blocks_contains_status_page_link(self):
        blocks = _build_blocks(self.incident, self.page, "incident_created")
        all_text = str(blocks)
        self.assertIn("slack-page", all_text)

    def test_blocks_contains_severity_field(self):
        blocks = _build_blocks(self.incident, self.page, "incident_created")
        fields_block = blocks[2]
        fields_text  = str(fields_block["fields"])
        self.assertIn("Severity", fields_text)

    @patch("apps.notifications.slack.httpx.post")
    def test_post_webhook_calls_correct_url(self, mock_post):
        mock_response                    = MagicMock()
        mock_response.raise_for_status  = MagicMock()
        mock_post.return_value           = mock_response

        from apps.notifications.slack import _post_webhook
        _post_webhook("https://hooks.slack.com/test", {"text": "hi"})

        mock_post.assert_called_once()
        self.assertEqual(
            mock_post.call_args[0][0],
            "https://hooks.slack.com/test",
        )

    @patch("apps.notifications.slack.httpx.post")
    def test_post_webhook_raises_on_http_error(self, mock_post):
        import httpx
        mock_response         = MagicMock()
        mock_response.status_code = 400
        mock_response.text    = "invalid_token"
        mock_post.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=mock_response
        )

        from apps.notifications.slack import _post_webhook
        with self.assertRaises(RuntimeError):
            _post_webhook("https://hooks.slack.com/test", {})


class WriterDispatchIntegrationTest(TestCase):
    """
    Verifies that writer.py calls dispatcher on status transitions.
    """

    def setUp(self):
        self.user = make_user("writerdisp")
        self.page = make_status_page(self.user, slug="writer-page")

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_incident_created_notification_fires_on_outage(self, mock_send):
        from apps.monitors.models import Monitor
        from apps.checker.engine import CheckResult
        from apps.checker.writer import save_check_result

        sub = make_subscriber(self.page, chat_id="777777")

        monitor = Monitor.objects.create(
            owner=self.user,
            name="Notif Test Monitor",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://example.com",
            status=Monitor.MonitorStatus.OPERATIONAL,
        )

        result = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Connection refused",
        )
        save_check_result(monitor, result)

        self.assertEqual(mock_send.call_count, 1)
        log = NotificationLog.objects.filter(event_type="incident_created").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.delivery_status, NotificationLog.DeliveryStatus.SENT)

    @patch("apps.notifications.dispatcher._send_telegram")
    def test_incident_resolved_notification_fires_on_recovery(self, mock_send):
        from apps.monitors.models import Monitor
        from apps.checker.engine import CheckResult
        from apps.checker.writer import save_check_result

        sub = make_subscriber(self.page, chat_id="888888")

        monitor = Monitor.objects.create(
            owner=self.user,
            name="Recovery Test Monitor",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://example.com",
            status=Monitor.MonitorStatus.OPERATIONAL,
        )

        down = CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )
        save_check_result(monitor, down)
        monitor.refresh_from_db()

        up = CheckResult(
            status="up",
            response_time_ms=100,
            http_status_code=200,
            error="",
        )
        save_check_result(monitor, up)

        self.assertEqual(mock_send.call_count, 2)

        created_log  = NotificationLog.objects.get(event_type="incident_created")
        resolved_log = NotificationLog.objects.get(event_type="incident_resolved")

        self.assertEqual(created_log.delivery_status,  NotificationLog.DeliveryStatus.SENT)
        self.assertEqual(resolved_log.delivery_status, NotificationLog.DeliveryStatus.SENT)            