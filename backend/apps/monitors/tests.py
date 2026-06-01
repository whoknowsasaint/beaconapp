# ──────────────────────────────────────────────
# Beacon — Monitor Model Tests
# Basic unit tests validating model behaviour,
# field constraints, and helper methods.
# Run with: python manage.py test apps.monitors
# ──────────────────────────────────────────────

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Monitor, MonitorCheck


class MonitorModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123",
        )
        self.monitor = Monitor.objects.create(
            owner=self.user,
            name="Test API",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://api.example.com/health",
            interval=60,
        )

    def test_monitor_str(self):
        self.assertEqual(
            str(self.monitor),
            "Test API (HTTP / HTTPS)",
        )

    def test_monitor_default_status_is_pending(self):
        self.assertEqual(self.monitor.status, Monitor.MonitorStatus.PENDING)

    def test_monitor_default_is_active(self):
        self.assertTrue(self.monitor.is_active)

    def test_get_expected_status_codes_single(self):
        self.monitor.expected_status_codes = "200"
        self.assertEqual(self.monitor.get_expected_status_codes(), [200])

    def test_get_expected_status_codes_multiple(self):
        self.monitor.expected_status_codes = "200,201,204"
        self.assertEqual(
            self.monitor.get_expected_status_codes(),
            [200, 201, 204],
        )

    def test_get_expected_status_codes_with_spaces(self):
        self.monitor.expected_status_codes = "200, 201, 204"
        self.assertEqual(
            self.monitor.get_expected_status_codes(),
            [200, 201, 204],
        )

    def test_monitor_uuid_primary_key(self):
        import uuid
        self.assertIsInstance(self.monitor.id, uuid.UUID)


class MonitorCheckModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="checkuser",
            password="checkpass123",
        )
        self.monitor = Monitor.objects.create(
            owner=self.user,
            name="Check Target",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://example.com",
        )
        self.check = MonitorCheck.objects.create(
            monitor=self.monitor,
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=142,
            http_status_code=200,
            checked_at=timezone.now(),
        )

    def test_check_str_contains_monitor_name(self):
        self.assertIn("Check Target", str(self.check))

    def test_check_str_contains_status(self):
        self.assertIn("Up", str(self.check))

    def test_is_up_true_when_status_up(self):
        self.assertTrue(self.check.is_up)

    def test_is_up_false_when_status_down(self):
        self.check.status = MonitorCheck.CheckStatus.DOWN
        self.assertFalse(self.check.is_up)

    def test_check_uuid_primary_key(self):
        import uuid
        self.assertIsInstance(self.check.id, uuid.UUID)

    def test_check_cascades_on_monitor_delete(self):
        monitor_id = self.monitor.id
        self.monitor.delete()
        self.assertEqual(
            MonitorCheck.objects.filter(monitor_id=monitor_id).count(),
            0,
        )