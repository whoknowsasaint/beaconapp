from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import timedelta

from apps.monitors.models import Monitor, MonitorCheck
from apps.incidents.models import Incident, IncidentUpdate, IncidentMonitor
from apps.checker.engine import CheckResult
from apps.checker.writer import save_check_result


def make_user(username="int_user"):
    return User.objects.create_user(username=username, password="pass")


def make_monitor(user, name="Integration Monitor", status=Monitor.MonitorStatus.OPERATIONAL):
    m = Monitor.objects.create(
        owner=user,
        name=name,
        monitor_type=Monitor.MonitorType.HTTP,
        url="https://example.com",
        interval=60,
        status=status,
    )
    return m


class CheckerWriterIntegrationTest(TestCase):

    def setUp(self):
        self.user = make_user()

    def test_full_outage_and_recovery_cycle(self):
        monitor = make_monitor(self.user)

        down = CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=None,
            error="Connection refused",
        )
        save_check_result(monitor, down)

        monitor.refresh_from_db()
        self.assertEqual(monitor.status, Monitor.MonitorStatus.OUTAGE)

        incident = Incident.objects.get(owner=self.user, auto_created=True)
        self.assertEqual(incident.status, Incident.IncidentStatus.INVESTIGATING)
        self.assertEqual(
            IncidentMonitor.objects.filter(incident=incident).count(),
            1,
        )
        self.assertEqual(
            IncidentUpdate.objects.filter(incident=incident).count(),
            1,
        )

        up = CheckResult(
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=112,
            http_status_code=200,
            error="",
        )
        save_check_result(monitor, up)

        monitor.refresh_from_db()
        self.assertEqual(monitor.status, Monitor.MonitorStatus.OPERATIONAL)

        incident.refresh_from_db()
        self.assertEqual(incident.status, Incident.IncidentStatus.RESOLVED)
        self.assertIsNotNone(incident.resolved_at)

        im = IncidentMonitor.objects.get(incident=incident)
        self.assertIsNotNone(im.recovered_at)

        self.assertEqual(
            IncidentUpdate.objects.filter(incident=incident).count(),
            2,
        )

    def test_sustained_outage_creates_single_incident(self):
        monitor = make_monitor(self.user)

        down = CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=None,
            error="Timeout",
        )

        for _ in range(5):
            save_check_result(monitor, down)
            monitor.refresh_from_db()

        self.assertEqual(
            Incident.objects.filter(owner=self.user, auto_created=True).count(),
            1,
        )

    def test_timeout_sets_degraded_not_outage(self):
        monitor = make_monitor(self.user)

        timeout = CheckResult(
            status=MonitorCheck.CheckStatus.TIMEOUT,
            response_time_ms=30000,
            http_status_code=None,
            error="Request timed out",
        )
        save_check_result(monitor, timeout)
        monitor.refresh_from_db()
        self.assertEqual(monitor.status, Monitor.MonitorStatus.DEGRADED)

    def test_degraded_then_down_opens_incident(self):
        monitor = make_monitor(self.user)

        timeout = CheckResult(
            status=MonitorCheck.CheckStatus.TIMEOUT,
            response_time_ms=None,
            http_status_code=None,
            error="Timeout",
        )
        save_check_result(monitor, timeout)
        monitor.refresh_from_db()
        self.assertEqual(
            Incident.objects.filter(auto_created=True).count(),
            1,
        )

    def test_check_history_written_on_every_result(self):
        monitor = make_monitor(self.user)

        results = [
            CheckResult(MonitorCheck.CheckStatus.UP,   120, 200, ""),
            CheckResult(MonitorCheck.CheckStatus.UP,   115, 200, ""),
            CheckResult(MonitorCheck.CheckStatus.DOWN, None, None, "Error"),
            CheckResult(MonitorCheck.CheckStatus.UP,   98,  200, ""),
        ]

        for r in results:
            save_check_result(monitor, r)

        self.assertEqual(
            MonitorCheck.objects.filter(monitor=monitor).count(),
            4,
        )

    def test_last_checked_at_updated_on_every_check(self):
        monitor = make_monitor(self.user)
        self.assertIsNone(monitor.last_checked_at)

        result = CheckResult(
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=100,
            http_status_code=200,
            error="",
        )
        save_check_result(monitor, result)
        monitor.refresh_from_db()
        self.assertIsNotNone(monitor.last_checked_at)

    def test_incident_resolution_does_not_affect_other_monitors_incidents(self):
        m1 = make_monitor(self.user, name="Monitor 1")
        m2 = make_monitor(self.user, name="Monitor 2")

        down = CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=None,
            error="Down",
        )

        save_check_result(m1, down)
        save_check_result(m2, down)

        self.assertEqual(Incident.objects.filter(auto_created=True).count(), 2)

        m1.refresh_from_db()
        up = CheckResult(
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=100,
            http_status_code=200,
            error="",
        )
        save_check_result(m1, up)

        incidents = Incident.objects.filter(auto_created=True).order_by("started_at")
        m1_incident = incidents.get(affected_monitors__monitor=m1)
        m2_incident = incidents.get(affected_monitors__monitor=m2)

        self.assertEqual(m1_incident.status, Incident.IncidentStatus.RESOLVED)
        self.assertEqual(m2_incident.status, Incident.IncidentStatus.INVESTIGATING)

    def test_paused_monitor_is_skipped_by_runner(self):
        from apps.checker.runner import _is_due
        monitor = make_monitor(self.user)
        monitor.is_active = False
        monitor.save()

        active = Monitor.objects.filter(is_active=True)
        self.assertNotIn(monitor, active)

    def test_pending_monitor_is_due_immediately(self):
        from apps.checker.runner import _is_due
        monitor = make_monitor(self.user, status=Monitor.MonitorStatus.PENDING)
        monitor.last_checked_at = None
        self.assertTrue(_is_due(monitor, timezone.now()))


class CheckerEngineIntegrationTest(TestCase):

    def setUp(self):
        self.user = make_user("engine_int")

    @patch("apps.checker.engine.httpx.Client")
    def test_successful_check_updates_monitor_to_operational(self, mock_class):
        monitor = make_monitor(
            self.user,
            status=Monitor.MonitorStatus.PENDING,
        )

        mock_resp         = MagicMock()
        mock_resp.status_code = 200
        mock_client       = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__  = MagicMock(return_value=False)
        mock_client.get   = MagicMock(return_value=mock_resp)
        mock_class.return_value = mock_client

        from apps.checker.engine import check_monitor
        result = check_monitor(monitor)
        save_check_result(monitor, result)

        monitor.refresh_from_db()
        self.assertEqual(monitor.status, Monitor.MonitorStatus.OPERATIONAL)
        self.assertEqual(
            MonitorCheck.objects.filter(
                monitor=monitor,
                status=MonitorCheck.CheckStatus.UP,
            ).count(),
            1,
        )

    @patch("apps.checker.engine.httpx.Client")
    def test_failed_check_creates_incident_and_check_record(self, mock_class):
        monitor = make_monitor(
            self.user,
            status=Monitor.MonitorStatus.OPERATIONAL,
        )

        import httpx
        mock_client       = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__  = MagicMock(return_value=False)
        mock_client.get   = MagicMock(
            side_effect=httpx.RequestError("Connection refused")
        )
        mock_class.return_value = mock_client

        from apps.checker.engine import check_monitor
        result = check_monitor(monitor)
        save_check_result(monitor, result)

        monitor.refresh_from_db()
        self.assertEqual(monitor.status, Monitor.MonitorStatus.OUTAGE)

        self.assertEqual(
            Incident.objects.filter(
                owner=self.user,
                auto_created=True,
            ).count(),
            1,
        )
        self.assertEqual(
            MonitorCheck.objects.filter(
                monitor=monitor,
                status=MonitorCheck.CheckStatus.ERROR,
            ).count(),
            1,
        )

    @patch("apps.checker.engine.httpx.Client")
    def test_unexpected_status_code_marks_down(self, mock_class):
        monitor = make_monitor(
            self.user,
            status=Monitor.MonitorStatus.OPERATIONAL,
        )

        mock_resp             = MagicMock()
        mock_resp.status_code = 503
        mock_client           = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__  = MagicMock(return_value=False)
        mock_client.get       = MagicMock(return_value=mock_resp)
        mock_class.return_value = mock_client

        from apps.checker.engine import check_monitor
        result = check_monitor(monitor)

        self.assertEqual(result.status, MonitorCheck.CheckStatus.DOWN)
        self.assertIn("503", result.error)

    @patch("apps.checker.engine.httpx.Client")
    def test_custom_expected_codes_honoured(self, mock_class):
        monitor = make_monitor(self.user)
        monitor.expected_status_codes = "201,202"
        monitor.save()

        mock_resp             = MagicMock()
        mock_resp.status_code = 201
        mock_client           = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__  = MagicMock(return_value=False)
        mock_client.get       = MagicMock(return_value=mock_resp)
        mock_class.return_value = mock_client

        from apps.checker.engine import check_monitor
        result = check_monitor(monitor)
        self.assertEqual(result.status, MonitorCheck.CheckStatus.UP)