from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import timedelta

from apps.monitors.models import Monitor, MonitorCheck
from apps.incidents.models import Incident
from apps.checker.engine import CheckResult
from apps.checker.writer import (
    save_check_result,
    _derive_monitor_status,
    _is_new_outage,
    _is_recovery,
)


def make_user(username="checker_user"):
    return User.objects.create_user(username=username, password="pass")


def make_monitor(user, name="Test Monitor"):
    return Monitor.objects.create(
        owner=user,
        name=name,
        monitor_type=Monitor.MonitorType.HTTP,
        url="https://example.com",
        interval=60,
    )


class DeriveStatusTest(TestCase):

    def test_up_maps_to_operational(self):
        result = _derive_monitor_status(MonitorCheck.CheckStatus.UP)
        self.assertEqual(result, Monitor.MonitorStatus.OPERATIONAL)

    def test_down_maps_to_outage(self):
        result = _derive_monitor_status(MonitorCheck.CheckStatus.DOWN)
        self.assertEqual(result, Monitor.MonitorStatus.OUTAGE)

    def test_timeout_maps_to_degraded(self):
        result = _derive_monitor_status(MonitorCheck.CheckStatus.TIMEOUT)
        self.assertEqual(result, Monitor.MonitorStatus.DEGRADED)

    def test_error_maps_to_outage(self):
        result = _derive_monitor_status(MonitorCheck.CheckStatus.ERROR)
        self.assertEqual(result, Monitor.MonitorStatus.OUTAGE)


class OutageDetectionTest(TestCase):

    def test_pending_to_outage_is_new_outage(self):
        self.assertTrue(
            _is_new_outage(
                Monitor.MonitorStatus.PENDING,
                Monitor.MonitorStatus.OUTAGE,
            )
        )

    def test_operational_to_outage_is_new_outage(self):
        self.assertTrue(
            _is_new_outage(
                Monitor.MonitorStatus.OPERATIONAL,
                Monitor.MonitorStatus.OUTAGE,
            )
        )

    def test_operational_to_degraded_is_new_outage(self):
        self.assertTrue(
            _is_new_outage(
                Monitor.MonitorStatus.OPERATIONAL,
                Monitor.MonitorStatus.DEGRADED,
            )
        )

    def test_outage_to_outage_is_not_new_outage(self):
        self.assertFalse(
            _is_new_outage(
                Monitor.MonitorStatus.OUTAGE,
                Monitor.MonitorStatus.OUTAGE,
            )
        )

    def test_outage_to_operational_is_recovery(self):
        self.assertTrue(
            _is_recovery(
                Monitor.MonitorStatus.OUTAGE,
                Monitor.MonitorStatus.OPERATIONAL,
            )
        )

    def test_degraded_to_operational_is_recovery(self):
        self.assertTrue(
            _is_recovery(
                Monitor.MonitorStatus.DEGRADED,
                Monitor.MonitorStatus.OPERATIONAL,
            )
        )

    def test_operational_to_operational_is_not_recovery(self):
        self.assertFalse(
            _is_recovery(
                Monitor.MonitorStatus.OPERATIONAL,
                Monitor.MonitorStatus.OPERATIONAL,
            )
        )


class SaveCheckResultTest(TestCase):

    def setUp(self):
        self.user    = make_user()
        self.monitor = make_monitor(self.user)

    def test_creates_monitor_check_record(self):
        result = CheckResult(
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=120,
            http_status_code=200,
            error="",
        )
        save_check_result(self.monitor, result)
        self.assertEqual(MonitorCheck.objects.filter(monitor=self.monitor).count(), 1)

    def test_updates_monitor_status(self):
        result = CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=500,
            error="Server error",
        )
        save_check_result(self.monitor, result)
        self.monitor.refresh_from_db()
        self.assertEqual(self.monitor.status, Monitor.MonitorStatus.OUTAGE)

    def test_updates_last_checked_at(self):
        result = CheckResult(
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=88,
            http_status_code=200,
            error="",
        )
        save_check_result(self.monitor, result)
        self.monitor.refresh_from_db()
        self.assertIsNotNone(self.monitor.last_checked_at)

    def test_opens_incident_on_first_outage(self):
        self.monitor.status = Monitor.MonitorStatus.OPERATIONAL
        self.monitor.save()

        result = CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=None,
            error="Connection refused",
        )
        save_check_result(self.monitor, result)

        self.assertEqual(
            Incident.objects.filter(
                owner=self.user,
                auto_created=True,
            ).count(),
            1,
        )

    def test_does_not_open_duplicate_incident(self):
        self.monitor.status = Monitor.MonitorStatus.OPERATIONAL
        self.monitor.save()

        result = CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=None,
            error="Connection refused",
        )
        save_check_result(self.monitor, result)

        self.monitor.refresh_from_db()
        save_check_result(self.monitor, result)

        self.assertEqual(
            Incident.objects.filter(auto_created=True).count(),
            1,
        )

    def test_resolves_incident_on_recovery(self):
        self.monitor.status = Monitor.MonitorStatus.OPERATIONAL
        self.monitor.save()

        down_result = CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )
        save_check_result(self.monitor, down_result)

        self.monitor.refresh_from_db()

        up_result = CheckResult(
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=100,
            http_status_code=200,
            error="",
        )
        save_check_result(self.monitor, up_result)

        incident = Incident.objects.get(auto_created=True)
        self.assertEqual(incident.status, Incident.IncidentStatus.RESOLVED)
        self.assertIsNotNone(incident.resolved_at)


class CheckerEngineTest(TestCase):

    def setUp(self):
        self.user    = make_user("engine_user")
        self.monitor = make_monitor(self.user)

    @patch("apps.checker.engine.httpx.Client")
    def test_http_check_up_on_200(self, mock_client_class):
        mock_response           = MagicMock()
        mock_response.status_code = 200
        mock_client             = MagicMock()
        mock_client.__enter__   = MagicMock(return_value=mock_client)
        mock_client.__exit__    = MagicMock(return_value=False)
        mock_client.get         = MagicMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        from apps.checker.engine import check_monitor
        result = check_monitor(self.monitor)

        self.assertEqual(result.status, MonitorCheck.CheckStatus.UP)
        self.assertEqual(result.http_status_code, 200)

    @patch("apps.checker.engine.httpx.Client")
    def test_http_check_down_on_unexpected_status(self, mock_client_class):
        mock_response             = MagicMock()
        mock_response.status_code = 500
        mock_client               = MagicMock()
        mock_client.__enter__     = MagicMock(return_value=mock_client)
        mock_client.__exit__      = MagicMock(return_value=False)
        mock_client.get           = MagicMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        from apps.checker.engine import check_monitor
        result = check_monitor(self.monitor)

        self.assertEqual(result.status, MonitorCheck.CheckStatus.DOWN)
        self.assertIn("500", result.error)

    @patch("apps.checker.engine.httpx.Client")
    def test_http_check_timeout(self, mock_client_class):
        import httpx
        mock_client           = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__  = MagicMock(return_value=False)
        mock_client.get       = MagicMock(side_effect=httpx.TimeoutException("timed out"))
        mock_client_class.return_value = mock_client

        from apps.checker.engine import check_monitor
        result = check_monitor(self.monitor)

        self.assertEqual(result.status, MonitorCheck.CheckStatus.TIMEOUT)

    def test_runner_is_due_when_never_checked(self):
        from apps.checker.runner import _is_due
        self.assertTrue(_is_due(self.monitor, timezone.now()))

    def test_runner_is_not_due_when_recently_checked(self):
        from apps.checker.runner import _is_due
        self.monitor.last_checked_at = timezone.now() - timedelta(seconds=10)
        self.assertFalse(_is_due(self.monitor, timezone.now()))

    def test_runner_is_due_when_interval_elapsed(self):
        from apps.checker.runner import _is_due
        self.monitor.last_checked_at = timezone.now() - timedelta(seconds=61)
        self.assertTrue(_is_due(self.monitor, timezone.now()))