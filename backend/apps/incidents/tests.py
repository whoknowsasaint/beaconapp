# ──────────────────────────────────────────────
# Beacon — Incident Model Tests
# Run with: python manage.py test apps.incidents
# ──────────────────────────────────────────────

import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from apps.monitors.models import Monitor
from .models import Incident, IncidentUpdate, IncidentMonitor


class IncidentModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="incidentuser",
            password="pass123",
        )
        self.incident = Incident.objects.create(
            owner=self.user,
            title="API Gateway — Elevated Error Rate",
            severity=Incident.Severity.CRITICAL,
            status=Incident.IncidentStatus.INVESTIGATING,
            started_at=timezone.now(),
        )

    def test_incident_str(self):
        self.assertIn("API Gateway", str(self.incident))
        self.assertIn("Critical", str(self.incident))
        self.assertIn("Investigating", str(self.incident))

    def test_incident_uuid_primary_key(self):
        self.assertIsInstance(self.incident.id, uuid.UUID)

    def test_default_status_is_investigating(self):
        self.assertEqual(
            self.incident.status,
            Incident.IncidentStatus.INVESTIGATING,
        )

    def test_is_active_true_when_not_resolved(self):
        self.assertTrue(self.incident.is_active)

    def test_is_resolved_false_when_not_resolved(self):
        self.assertFalse(self.incident.is_resolved)

    def test_resolve_sets_status_and_timestamp(self):
        self.incident.resolve()
        self.assertEqual(
            self.incident.status,
            Incident.IncidentStatus.RESOLVED,
        )
        self.assertIsNotNone(self.incident.resolved_at)

    def test_resolve_with_explicit_timestamp(self):
        ts = timezone.now() - timedelta(minutes=10)
        self.incident.resolve(resolved_at=ts)
        self.assertEqual(self.incident.resolved_at, ts)

    def test_is_active_false_after_resolve(self):
        self.incident.resolve()
        self.assertFalse(self.incident.is_active)

    def test_is_resolved_true_after_resolve(self):
        self.incident.resolve()
        self.assertTrue(self.incident.is_resolved)

    def test_duration_seconds_returns_positive_integer(self):
        duration = self.incident.duration_seconds
        self.assertIsNotNone(duration)
        self.assertGreaterEqual(duration, 0)

    def test_duration_seconds_uses_resolved_at_when_resolved(self):
        start = timezone.now() - timedelta(minutes=30)
        end   = timezone.now() - timedelta(minutes=5)
        self.incident.started_at  = start
        self.incident.resolved_at = end
        self.incident.status      = Incident.IncidentStatus.RESOLVED
        # 25 minutes = 1500 seconds (±1 for rounding)
        self.assertAlmostEqual(
            self.incident.duration_seconds,
            1500,
            delta=2,
        )

    def test_default_is_public_true(self):
        self.assertTrue(self.incident.is_public)


class IncidentUpdateModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="updateuser",
            password="pass123",
        )
        self.incident = Incident.objects.create(
            owner=self.user,
            title="Test Incident",
            severity=Incident.Severity.MINOR,
            started_at=timezone.now(),
        )
        self.update = IncidentUpdate.objects.create(
            incident=self.incident,
            posted_by=self.user,
            status_at_update=Incident.IncidentStatus.INVESTIGATING,
            message="We are investigating elevated error rates.",
        )

    def test_update_str_contains_incident_title(self):
        self.assertIn("Test Incident", str(self.update))

    def test_update_str_contains_poster_username(self):
        self.assertIn("updateuser", str(self.update))

    def test_update_uuid_primary_key(self):
        self.assertIsInstance(self.update.id, uuid.UUID)

    def test_update_cascades_on_incident_delete(self):
        incident_id = self.incident.id
        self.incident.delete()
        self.assertEqual(
            IncidentUpdate.objects.filter(incident_id=incident_id).count(),
            0,
        )

    def test_update_default_is_public_true(self):
        self.assertTrue(self.update.is_public)


class IncidentMonitorModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="linkuser",
            password="pass123",
        )
        self.monitor = Monitor.objects.create(
            owner=self.user,
            name="API Gateway",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://api.example.com",
        )
        self.incident = Incident.objects.create(
            owner=self.user,
            title="Gateway Incident",
            severity=Incident.Severity.MAJOR,
            started_at=timezone.now(),
        )
        self.link = IncidentMonitor.objects.create(
            incident=self.incident,
            monitor=self.monitor,
            monitor_status_snapshot=Monitor.MonitorStatus.OUTAGE,
        )

    def test_link_str(self):
        self.assertIn("Gateway Incident", str(self.link))
        self.assertIn("API Gateway", str(self.link))

    def test_link_uuid_primary_key(self):
        self.assertIsInstance(self.link.id, uuid.UUID)

    def test_duplicate_link_raises_error(self):
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            IncidentMonitor.objects.create(
                incident=self.incident,
                monitor=self.monitor,
                monitor_status_snapshot=Monitor.MonitorStatus.OUTAGE,
            )

    def test_link_cascades_on_incident_delete(self):
        incident_id = self.incident.id
        self.incident.delete()
        self.assertEqual(
            IncidentMonitor.objects.filter(incident_id=incident_id).count(),
            0,
        )

    def test_link_cascades_on_monitor_delete(self):
        monitor_id = self.monitor.id
        self.monitor.delete()
        self.assertEqual(
            IncidentMonitor.objects.filter(monitor_id=monitor_id).count(),
            0,
        )