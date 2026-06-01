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

from rest_framework.test import APIClient
from rest_framework import status as drf_status


class IncidentAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="incapi", password="pass123"
        )
        self.other_user = User.objects.create_user(
            username="other", password="pass123"
        )
        self.client.force_authenticate(user=self.user)

        self.incident = Incident.objects.create(
            owner=self.user,
            title="API Gateway Down",
            severity=Incident.Severity.CRITICAL,
            status=Incident.IncidentStatus.INVESTIGATING,
            started_at=timezone.now(),
        )

    def test_list_returns_paginated_shape(self):
        response = self.client.get("/api/v1/incidents/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        for key in ["count", "next", "previous", "results"]:
            self.assertIn(key, response.data)

    def test_list_returns_only_own_incidents(self):
        Incident.objects.create(
            owner=self.other_user,
            title="Other Incident",
            severity=Incident.Severity.MINOR,
            started_at=timezone.now(),
        )
        response = self.client.get("/api/v1/incidents/")
        self.assertEqual(response.data["count"], 1)

    def test_create_incident(self):
        response = self.client.post(
            "/api/v1/incidents/",
            {
                "title":      "New Incident",
                "severity":   "major",
                "started_at": timezone.now().isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Incident")

    def test_create_incident_links_monitors(self):
        monitor = Monitor.objects.create(
            owner=self.user,
            name="Test Monitor",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://test.example.com",
        )
        response = self.client.post(
            "/api/v1/incidents/",
            {
                "title":                "Incident With Monitor",
                "severity":             "critical",
                "started_at":           timezone.now().isoformat(),
                "affected_monitor_ids": [str(monitor.id)],
            },
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["affected_monitors"]), 1)

    def test_create_incident_with_other_users_monitor_fails(self):
        monitor = Monitor.objects.create(
            owner=self.other_user,
            name="Not Mine",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://notmine.example.com",
        )
        response = self.client.post(
            "/api/v1/incidents/",
            {
                "title":                "Bad Incident",
                "severity":             "minor",
                "started_at":           timezone.now().isoformat(),
                "affected_monitor_ids": [str(monitor.id)],
            },
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "validation")

    def test_retrieve_own_incident(self):
        response = self.client.get(f"/api/v1/incidents/{self.incident.id}/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "API Gateway Down")

    def test_retrieve_other_users_incident_returns_404(self):
        other = Incident.objects.create(
            owner=self.other_user,
            title="Not Mine",
            severity=Incident.Severity.MINOR,
            started_at=timezone.now(),
        )
        response = self.client.get(f"/api/v1/incidents/{other.id}/")
        self.assertEqual(response.status_code, drf_status.HTTP_404_NOT_FOUND)

    def test_patch_incident_status(self):
        response = self.client.patch(
            f"/api/v1/incidents/{self.incident.id}/",
            {"status": "identified"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "identified")

    def test_patch_status_resolved_sets_resolved_at(self):
        response = self.client.patch(
            f"/api/v1/incidents/{self.incident.id}/",
            {"status": "resolved"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertIsNotNone(response.data["resolved_at"])

    def test_delete_incident(self):
        response = self.client.delete(
            f"/api/v1/incidents/{self.incident.id}/"
        )
        self.assertEqual(response.status_code, drf_status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Incident.objects.filter(id=self.incident.id).exists()
        )

    def test_filter_by_status(self):
        response = self.client.get(
            "/api/v1/incidents/?status=investigating"
        )
        self.assertEqual(response.data["count"], 1)

    def test_filter_by_severity(self):
        response = self.client.get(
            "/api/v1/incidents/?severity=critical"
        )
        self.assertEqual(response.data["count"], 1)

    def test_search_by_title(self):
        response = self.client.get(
            "/api/v1/incidents/?search=API Gateway"
        )
        self.assertEqual(response.data["count"], 1)

    def test_unauthenticated_returns_401_with_correct_error_shape(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/incidents/")
        self.assertEqual(response.status_code, drf_status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"], "auth")


class IncidentUpdateAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="updapi", password="pass123"
        )
        self.client.force_authenticate(user=self.user)
        self.incident = Incident.objects.create(
            owner=self.user,
            title="Test Incident",
            severity=Incident.Severity.MINOR,
            started_at=timezone.now(),
        )

    def test_list_updates_empty(self):
        response = self.client.get(
            f"/api/v1/incidents/{self.incident.id}/updates/"
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_post_update(self):
        response = self.client.post(
            f"/api/v1/incidents/{self.incident.id}/updates/",
            {"message": "We are investigating."},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "We are investigating.")

    def test_post_update_records_current_incident_status(self):
        response = self.client.post(
            f"/api/v1/incidents/{self.incident.id}/updates/",
            {"message": "Looking into it."},
            format="json",
        )
        self.assertEqual(
            response.data["status_at_update"],
            Incident.IncidentStatus.INVESTIGATING,
        )

    def test_post_update_blank_message_fails(self):
        response = self.client.post(
            f"/api/v1/incidents/{self.incident.id}/updates/",
            {"message": "   "},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", response.data["fields"])

    def test_post_update_on_other_users_incident_returns_404(self):
        other_user = User.objects.create_user(
            username="other2", password="pass123"
        )
        other_incident = Incident.objects.create(
            owner=other_user,
            title="Other",
            severity=Incident.Severity.MINOR,
            started_at=timezone.now(),
        )
        response = self.client.post(
            f"/api/v1/incidents/{other_incident.id}/updates/",
            {"message": "Sneaky."},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_404_NOT_FOUND)        