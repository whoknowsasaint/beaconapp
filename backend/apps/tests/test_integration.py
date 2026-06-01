from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

from apps.monitors.models import Monitor, MonitorCheck
from apps.incidents.models import Incident, IncidentUpdate, IncidentMonitor
from apps.status_pages.models import StatusPage, StatusPageMonitor, Subscriber
from apps.api_keys.models import APIKey


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def make_user(username, password="pass123"):
    return User.objects.create_user(username=username, password=password)


def make_monitor(user, name="API Gateway", url="https://api.example.com"):
    return Monitor.objects.create(
        owner=user,
        name=name,
        monitor_type=Monitor.MonitorType.HTTP,
        url=url,
    )


def make_incident(user, title="Test Incident", severity="minor"):
    return Incident.objects.create(
        owner=user,
        title=title,
        severity=severity,
        started_at=timezone.now(),
    )


def make_status_page(user, name="Status", slug="status"):
    return StatusPage.objects.create(
        owner=user,
        name=name,
        slug=slug,
    )


# ---------------------------------------------------------------------------
# Auth flow
# ---------------------------------------------------------------------------

class AuthFlowTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user   = make_user("authflow")

    def test_full_login_logout_cycle(self):
        login = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authflow", "password": "pass123"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data["username"], "authflow")

        me = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me.status_code, status.HTTP_200_OK)

        logout = self.client.post("/api/v1/auth/logout/", {}, format="json")
        self.assertEqual(logout.status_code, status.HTTP_200_OK)

        me_after = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_after.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_correct_error_shape_when_unauthenticated(self):
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"],  "auth")
        self.assertIsNone(response.data["fields"])
        self.assertIn("message", response.data)

    def test_login_wrong_password_returns_correct_error_shape(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authflow", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"],  "auth")
        self.assertIsNone(response.data["fields"])

    def test_login_missing_password_returns_validation_shape(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authflow"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "validation")
        self.assertIn("password", response.data["fields"])

    def test_csrf_endpoint_sets_cookie_detail(self):
        response = self.client.get("/api/v1/auth/csrf/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)


# ---------------------------------------------------------------------------
# API Key auth
# ---------------------------------------------------------------------------

class APIKeyAuthTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user   = make_user("keyauth")

    def test_api_key_authenticates_protected_endpoint(self):
        _, raw = APIKey.generate(self.user, "Test Key")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "keyauth")

    def test_revoked_key_returns_401(self):
        key, raw = APIKey.generate(self.user, "Revoke Me")
        key.revoke()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"], "auth")

    def test_expired_key_returns_401(self):
        past = timezone.now() - timedelta(hours=1)
        _, raw = APIKey.generate(self.user, "Expired", expires_at=past)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_api_key_create_and_list(self):
        self.client.force_authenticate(user=self.user)

        create = self.client.post(
            "/api/v1/api-keys/",
            {"name": "CI Pipeline"},
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        self.assertIn("raw_key", create.data)
        self.assertTrue(create.data["raw_key"].startswith("bk_live_"))

        list_r = self.client.get("/api/v1/api-keys/")
        self.assertEqual(list_r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_r.data), 1)
        self.assertNotIn("raw_key", list_r.data[0])
        self.assertNotIn("key_hash", list_r.data[0])

    def test_api_key_revoke_via_delete(self):
        self.client.force_authenticate(user=self.user)
        key, _ = APIKey.generate(self.user, "Revokable")

        response = self.client.delete(f"/api/v1/api-keys/{key.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        key.refresh_from_db()
        self.assertFalse(key.is_active)

    def test_revoking_already_revoked_key_returns_400(self):
        self.client.force_authenticate(user=self.user)
        key, _ = APIKey.generate(self.user, "Already Gone")
        key.revoke()

        response = self.client.delete(f"/api/v1/api-keys/{key.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "validation")

    def test_cannot_access_other_users_api_key(self):
        other = make_user("otherkey")
        key, _ = APIKey.generate(other, "Not Yours")
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/v1/api-keys/{key.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# Ownership isolation -- cross-resource
# ---------------------------------------------------------------------------

class OwnershipIsolationTest(TestCase):
    """
    Verifies that user A can never read, modify, or delete
    resources belonging to user B across all resource types.
    """

    def setUp(self):
        self.client  = APIClient()
        self.user_a  = make_user("user_a")
        self.user_b  = make_user("user_b")

        self.monitor_b      = make_monitor(self.user_b, name="B Monitor")
        self.incident_b     = make_incident(self.user_b, title="B Incident")
        self.status_page_b  = make_status_page(self.user_b, slug="user-b-page")

        self.client.force_authenticate(user=self.user_a)

    def test_cannot_read_other_users_monitor(self):
        r = self.client.get(f"/api/v1/monitors/{self.monitor_b.id}/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_patch_other_users_monitor(self):
        r = self.client.patch(
            f"/api/v1/monitors/{self.monitor_b.id}/",
            {"name": "Hacked"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_other_users_monitor(self):
        r = self.client.delete(f"/api/v1/monitors/{self.monitor_b.id}/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_read_other_users_incident(self):
        r = self.client.get(f"/api/v1/incidents/{self.incident_b.id}/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_post_update_to_other_users_incident(self):
        r = self.client.post(
            f"/api/v1/incidents/{self.incident_b.id}/updates/",
            {"message": "Sneaky update"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_read_other_users_status_page(self):
        r = self.client.get(f"/api/v1/status-pages/user-b-page/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_other_users_status_page(self):
        r = self.client.delete(f"/api/v1/status-pages/user-b-page/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_endpoints_never_return_other_users_resources(self):
        r_monitors = self.client.get("/api/v1/monitors/")
        self.assertEqual(r_monitors.data["count"], 0)

        r_incidents = self.client.get("/api/v1/incidents/")
        self.assertEqual(r_incidents.data["count"], 0)

        r_pages = self.client.get("/api/v1/status-pages/")
        self.assertEqual(r_pages.data["count"], 0)


# ---------------------------------------------------------------------------
# Pagination contract
# ---------------------------------------------------------------------------

class PaginationContractTest(TestCase):
    """
    Every list endpoint must return {count, next, previous, results}.
    """

    def setUp(self):
        self.client = APIClient()
        self.user   = make_user("paguser")
        self.client.force_authenticate(user=self.user)

    def _assert_paginated(self, url):
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ["count", "next", "previous", "results"]:
            self.assertIn(
                key,
                response.data,
                msg=f"Key '{key}' missing from {url} response",
            )
        self.assertIsInstance(response.data["results"], list)

    def test_monitors_list_is_paginated(self):
        self._assert_paginated("/api/v1/monitors/")

    def test_incidents_list_is_paginated(self):
        self._assert_paginated("/api/v1/incidents/")

    def test_status_pages_list_is_paginated(self):
        self._assert_paginated("/api/v1/status-pages/")

    def test_monitor_checks_list_is_paginated(self):
        monitor = make_monitor(self.user)
        self._assert_paginated(f"/api/v1/monitors/{monitor.id}/checks/")

    def test_incident_updates_list_is_paginated(self):
        incident = make_incident(self.user)
        self._assert_paginated(f"/api/v1/incidents/{incident.id}/updates/")

    def test_page_size_param_is_respected(self):
        for i in range(5):
            make_monitor(self.user, name=f"Monitor {i}", url=f"https://m{i}.example.com")

        response = self.client.get("/api/v1/monitors/?page_size=2")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertEqual(response.data["count"], 5)
        self.assertIsNotNone(response.data["next"])

    def test_page_2_returns_correct_slice(self):
        for i in range(5):
            make_monitor(self.user, name=f"Monitor {i}", url=f"https://m{i}.example.com")

        response = self.client.get("/api/v1/monitors/?page_size=3&page=2")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIsNone(response.data["next"])
        self.assertIsNotNone(response.data["previous"])


# ---------------------------------------------------------------------------
# Error format contract
# ---------------------------------------------------------------------------

class ErrorFormatContractTest(TestCase):
    """
    Every error response must have {error, message, fields}.
    Verified across all four error types.
    """

    def setUp(self):
        self.client = APIClient()
        self.user   = make_user("erruser")

    def _assert_error_shape(self, response, expected_error_type):
        self.assertIn("error",   response.data, msg="Missing 'error' key")
        self.assertIn("message", response.data, msg="Missing 'message' key")
        self.assertIn("fields",  response.data, msg="Missing 'fields' key")
        self.assertEqual(
            response.data["error"],
            expected_error_type,
            msg=f"Expected error type '{expected_error_type}', got '{response.data['error']}'",
        )

    def test_401_has_correct_shape(self):
        r = self.client.get("/api/v1/monitors/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        self._assert_error_shape(r, "auth")

    def test_404_has_correct_shape(self):
        self.client.force_authenticate(user=self.user)
        import uuid
        r = self.client.get(f"/api/v1/monitors/{uuid.uuid4()}/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)
        self._assert_error_shape(r, "not_found")

    def test_400_validation_has_correct_shape_with_fields(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post(
            "/api/v1/monitors/",
            {"name": "Bad Monitor", "monitor_type": "http"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self._assert_error_shape(r, "validation")
        self.assertIsInstance(r.data["fields"], dict)
        self.assertIn("url", r.data["fields"])

    def test_400_fields_contains_list_of_strings(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post(
            "/api/v1/monitors/",
            {"monitor_type": "http"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        for field_errors in r.data["fields"].values():
            self.assertIsInstance(field_errors, list)
            for err in field_errors:
                self.assertIsInstance(err, str)

    def test_non_validation_errors_have_null_fields(self):
        r = self.client.get("/api/v1/monitors/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIsNone(r.data["fields"])


# ---------------------------------------------------------------------------
# Cross-resource workflows
# ---------------------------------------------------------------------------

class CrossResourceWorkflowTest(TestCase):
    """
    Tests that span multiple resource types to verify
    the system works as a connected whole.
    """

    def setUp(self):
        self.client = APIClient()
        self.user   = make_user("workflow")
        self.client.force_authenticate(user=self.user)

    def test_full_incident_lifecycle(self):
        monitor = make_monitor(self.user)

        create = self.client.post(
            "/api/v1/incidents/",
            {
                "title":                "Full Lifecycle Test",
                "severity":             "critical",
                "started_at":           timezone.now().isoformat(),
                "affected_monitor_ids": [str(monitor.id)],
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        incident_id = create.data["id"]
        self.assertEqual(len(create.data["affected_monitors"]), 1)

        update = self.client.post(
            f"/api/v1/incidents/{incident_id}/updates/",
            {"message": "We are investigating elevated error rates."},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            update.data["status_at_update"],
            Incident.IncidentStatus.INVESTIGATING,
        )

        advance = self.client.patch(
            f"/api/v1/incidents/{incident_id}/",
            {"status": "identified"},
            format="json",
        )
        self.assertEqual(advance.status_code, status.HTTP_200_OK)

        update2 = self.client.post(
            f"/api/v1/incidents/{incident_id}/updates/",
            {"message": "Root cause identified. Deploying fix."},
            format="json",
        )
        self.assertEqual(update2.data["status_at_update"], "identified")

        resolve = self.client.patch(
            f"/api/v1/incidents/{incident_id}/",
            {"status": "resolved"},
            format="json",
        )
        self.assertEqual(resolve.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(resolve.data["resolved_at"])
        self.assertTrue(resolve.data["is_resolved"])
        self.assertFalse(resolve.data["is_active"])

    def test_full_status_page_setup(self):
        m1 = make_monitor(self.user, name="API",  url="https://api.example.com")
        m2 = make_monitor(self.user, name="CDN",  url="https://cdn.example.com")

        create_page = self.client.post(
            "/api/v1/status-pages/",
            {"name": "Acme Status", "slug": "acme-status"},
            format="json",
        )
        self.assertEqual(create_page.status_code, status.HTTP_201_CREATED)
        slug = create_page.data["slug"]

        self.client.post(
            f"/api/v1/status-pages/{slug}/monitors/",
            {"monitor": str(m1.id), "display_name": "API", "display_order": 0},
            format="json",
        )
        self.client.post(
            f"/api/v1/status-pages/{slug}/monitors/",
            {"monitor": str(m2.id), "display_name": "CDN", "display_order": 1},
            format="json",
        )

        detail = self.client.get(f"/api/v1/status-pages/{slug}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail.data["monitors"]), 2)

        self.client.force_authenticate(user=None)
        public = self.client.get(f"/api/v1/status-pages/{slug}/public/")
        self.assertEqual(public.status_code, status.HTTP_200_OK)
        self.assertEqual(len(public.data["monitors"]), 2)
        self.assertEqual(public.data["monitors"][0]["name"], "API")
        self.assertEqual(public.data["monitors"][1]["name"], "CDN")
        self.assertNotIn("subscriber_count", public.data)
        self.assertIn("overall_status", public.data)

    def test_monitor_check_history_visible_to_owner_only(self):
        monitor = make_monitor(self.user)
        MonitorCheck.objects.create(
            monitor=monitor,
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=88,
            http_status_code=200,
            checked_at=timezone.now(),
        )

        r = self.client.get(f"/api/v1/monitors/{monitor.id}/checks/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["count"], 1)

        other = make_user("othercheck")
        self.client.force_authenticate(user=other)
        r2 = self.client.get(f"/api/v1/monitors/{monitor.id}/checks/")
        self.assertEqual(r2.status_code, status.HTTP_404_NOT_FOUND)

    def test_api_key_scoped_to_owner(self):
        _, raw = APIKey.generate(self.user, "Workflow Key")

        other   = make_user("otherworkflow")
        monitor = make_monitor(other, name="Other Monitor")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")

        r = self.client.get(f"/api/v1/monitors/{monitor.id}/")
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

        r2 = self.client.get("/api/v1/monitors/")
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertEqual(r2.data["count"], 0)

    def test_subscribe_and_unsubscribe_flow(self):
        page = make_status_page(self.user, slug="sub-flow")
        self.client.force_authenticate(user=None)

        sub = self.client.post(
            "/api/v1/status-pages/sub-flow/subscribe/",
            {"notification_channel": "email", "email": "test@example.com"},
            format="json",
        )
        self.assertEqual(sub.status_code, status.HTTP_201_CREATED)

        subscriber = Subscriber.objects.get(
            status_page=page,
            email="test@example.com",
        )

        unsub = self.client.post(
            f"/api/v1/status-pages/sub-flow/unsubscribe/{subscriber.unsubscribe_token}/",
        )
        self.assertEqual(unsub.status_code, status.HTTP_200_OK)

        subscriber.refresh_from_db()
        self.assertFalse(subscriber.is_active)


# ---------------------------------------------------------------------------
# Rate limiting class assignment
# ---------------------------------------------------------------------------

class ThrottleClassAssignmentTest(TestCase):
    """
    Verifies throttle classes are assigned to the correct views.
    Does not test actual rate limiting (requires cache backend) --
    tests that the correct classes are on the correct views.
    """

    def test_login_view_has_login_throttle(self):
        from apps.api_keys.views import LoginView
        from core.throttling import LoginRateThrottle
        self.assertIn(LoginRateThrottle, LoginView.throttle_classes)

    def test_public_status_page_view_has_public_throttle(self):
        from apps.status_pages.views import PublicStatusPageView
        from core.throttling import PublicStatusPageThrottle
        self.assertIn(PublicStatusPageThrottle, PublicStatusPageView.throttle_classes)

    def test_subscribe_view_has_public_throttle(self):
        from apps.status_pages.views import SubscribeView
        from core.throttling import PublicStatusPageThrottle
        self.assertIn(PublicStatusPageThrottle, SubscribeView.throttle_classes)

    def test_public_status_page_view_allows_any(self):
        from apps.status_pages.views import PublicStatusPageView
        from rest_framework.permissions import AllowAny
        self.assertIn(AllowAny, PublicStatusPageView.permission_classes)

    def test_public_status_page_view_has_no_auth_classes(self):
        from apps.status_pages.views import PublicStatusPageView
        self.assertEqual(PublicStatusPageView.authentication_classes, [])