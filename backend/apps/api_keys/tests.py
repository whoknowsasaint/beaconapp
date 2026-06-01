# ──────────────────────────────────────────────
# Beacon — API Key + Auth Tests
# Run with: python manage.py test apps.api_keys
# ──────────────────────────────────────────────

import hashlib
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import APIKey


class APIKeyModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="keyuser", password="pass123"
        )

    def test_generate_returns_instance_and_raw_key(self):
        api_key, raw_key = APIKey.generate(self.user, "Test Key")
        self.assertIsNotNone(api_key.pk)
        self.assertTrue(raw_key.startswith("bk_live_"))

    def test_raw_key_is_not_stored(self):
        api_key, raw_key = APIKey.generate(self.user, "Test Key")
        self.assertNotEqual(api_key.key_hash, raw_key)

    def test_key_hash_is_sha256(self):
        api_key, raw_key = APIKey.generate(self.user, "Test Key")
        expected = hashlib.sha256(raw_key.encode()).hexdigest()
        self.assertEqual(api_key.key_hash, expected)

    def test_prefix_is_first_12_chars(self):
        api_key, raw_key = APIKey.generate(self.user, "Test Key")
        self.assertEqual(api_key.prefix, raw_key[:12])

    def test_authenticate_valid_key(self):
        api_key, raw_key = APIKey.generate(self.user, "Test Key")
        result = APIKey.authenticate(raw_key)
        self.assertIsNotNone(result)
        self.assertEqual(result.pk, api_key.pk)

    def test_authenticate_invalid_key_returns_none(self):
        result = APIKey.authenticate("bk_live_invalid000000000000000000")
        self.assertIsNone(result)

    def test_authenticate_wrong_prefix_returns_none(self):
        result = APIKey.authenticate("wrongprefix_abc123")
        self.assertIsNone(result)

    def test_authenticate_revoked_key_returns_none(self):
        api_key, raw_key = APIKey.generate(self.user, "Test Key")
        api_key.revoke()
        result = APIKey.authenticate(raw_key)
        self.assertIsNone(result)

    def test_authenticate_expired_key_returns_none(self):
        past = timezone.now() - timedelta(hours=1)
        api_key, raw_key = APIKey.generate(
            self.user, "Expired Key", expires_at=past
        )
        result = APIKey.authenticate(raw_key)
        self.assertIsNone(result)

    def test_revoke_sets_is_active_false(self):
        api_key, _ = APIKey.generate(self.user, "Test Key")
        api_key.revoke()
        api_key.refresh_from_db()
        self.assertFalse(api_key.is_active)

    def test_revoke_sets_revoked_at(self):
        api_key, _ = APIKey.generate(self.user, "Test Key")
        api_key.revoke()
        api_key.refresh_from_db()
        self.assertIsNotNone(api_key.revoked_at)

    def test_is_expired_false_when_no_expiry(self):
        api_key, _ = APIKey.generate(self.user, "Test Key")
        self.assertFalse(api_key.is_expired)

    def test_is_valid_true_for_fresh_key(self):
        api_key, _ = APIKey.generate(self.user, "Test Key")
        self.assertTrue(api_key.is_valid)

    def test_is_valid_false_after_revoke(self):
        api_key, _ = APIKey.generate(self.user, "Test Key")
        api_key.revoke()
        self.assertFalse(api_key.is_valid)


class AuthEndpointTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="authuser", password="pass123"
        )

    def test_csrf_endpoint_returns_200(self):
        response = self.client.get("/api/v1/auth/csrf/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

    def test_login_success(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "pass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "authuser")

    def test_login_wrong_password(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"], "auth")

    def test_login_missing_fields(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": "authuser"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "validation")

    def test_me_requires_auth(self):
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_user_after_login(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "authuser")

    def test_logout_ends_session(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/v1/auth/logout/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_api_key_auth_works(self):
        _, raw_key = APIKey.generate(self.user, "Test")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw_key}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_revoked_api_key_rejected(self):
        api_key, raw_key = APIKey.generate(self.user, "Test")
        api_key.revoke()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw_key}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)