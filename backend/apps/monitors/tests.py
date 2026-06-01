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

# ---- API Tests (append below existing model tests) ----

from rest_framework.test import APIClient
from rest_framework import status as drf_status
from django.utils import timezone


class MonitorAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="apiuser", password="pass123"
        )
        self.other_user = User.objects.create_user(
            username="other", password="pass123"
        )
        self.client.force_authenticate(user=self.user)

        self.monitor = Monitor.objects.create(
            owner=self.user,
            name="My API",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://api.example.com",
        )

    def test_list_returns_only_own_monitors(self):
        Monitor.objects.create(
            owner=self.other_user,
            name="Other Monitor",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://other.example.com",
        )
        response = self.client.get("/api/v1/monitors/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "My API")

    def test_list_returns_paginated_shape(self):
        response = self.client.get("/api/v1/monitors/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        for key in ["count", "next", "previous", "results"]:
            self.assertIn(key, response.data)

    def test_create_http_monitor(self):
        response = self.client.post(
            "/api/v1/monitors/",
            {
                "name":         "New Monitor",
                "monitor_type": "http",
                "url":          "https://newsite.example.com",
                "interval":     60,
            },
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Monitor")
        self.assertEqual(response.data["status"], "pending")

    def test_create_http_monitor_without_url_fails(self):
        response = self.client.post(
            "/api/v1/monitors/",
            {"name": "Bad Monitor", "monitor_type": "http"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "validation")
        self.assertIn("url", response.data["fields"])

    def test_create_tcp_monitor_without_port_fails(self):
        response = self.client.post(
            "/api/v1/monitors/",
            {
                "name":         "TCP Monitor",
                "monitor_type": "tcp",
                "host":         "db.example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_400_BAD_REQUEST)
        self.assertIn("port", response.data["fields"])

    def test_retrieve_own_monitor(self):
        response = self.client.get(f"/api/v1/monitors/{self.monitor.id}/")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "My API")

    def test_retrieve_other_users_monitor_returns_404(self):
        other_monitor = Monitor.objects.create(
            owner=self.other_user,
            name="Not Mine",
            monitor_type=Monitor.MonitorType.HTTP,
            url="https://notmine.example.com",
        )
        response = self.client.get(f"/api/v1/monitors/{other_monitor.id}/")
        self.assertEqual(response.status_code, drf_status.HTTP_404_NOT_FOUND)

    def test_patch_monitor_name(self):
        response = self.client.patch(
            f"/api/v1/monitors/{self.monitor.id}/",
            {"name": "Updated Name"},
            format="json",
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Name")

    def test_delete_monitor(self):
        response = self.client.delete(f"/api/v1/monitors/{self.monitor.id}/")
        self.assertEqual(response.status_code, drf_status.HTTP_204_NO_CONTENT)
        self.assertFalse(Monitor.objects.filter(id=self.monitor.id).exists())

    def test_filter_by_status(self):
        self.monitor.status = Monitor.MonitorStatus.OPERATIONAL
        self.monitor.save()
        response = self.client.get("/api/v1/monitors/?status=operational")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_filter_by_is_active_false(self):
        self.monitor.is_active = False
        self.monitor.save()
        response = self.client.get("/api/v1/monitors/?is_active=false")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_search_by_name(self):
        response = self.client.get("/api/v1/monitors/?search=My API")
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_check_history_returns_paginated_shape(self):
        MonitorCheck.objects.create(
            monitor=self.monitor,
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=120,
            http_status_code=200,
            checked_at=timezone.now(),
        )
        response = self.client.get(
            f"/api/v1/monitors/{self.monitor.id}/checks/"
        )
        self.assertEqual(response.status_code, drf_status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 1)

    def test_unauthenticated_request_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/monitors/")
        self.assertEqual(response.status_code, drf_status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"], "auth")        