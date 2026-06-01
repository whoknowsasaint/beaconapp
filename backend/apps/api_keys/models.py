# ──────────────────────────────────────────────
# Beacon — APIKey Model
#
# Security design:
#   - Raw key generated once, shown once, never stored.
#   - Only the SHA-256 hash is persisted.
#   - The first 8 chars (prefix) are stored plaintext
#     so users can identify keys in the dashboard
#     (e.g. "bk_live_xK9m...").
#   - Key format: bk_live_{32 random hex chars}
#     Total length: 40 chars. Prefix stored: "bk_live_xK9m"
#     (first 12 chars of the full key including "bk_live_").
#
# Lifecycle:
#   - is_active=True   — key works
#   - revoked_at set   — key is revoked (is_active=False)
#   - expires_at past  — key is expired (checked in auth backend)
#   - last_used_at     — updated on every successful auth
# ──────────────────────────────────────────────

import uuid
import hashlib
import secrets
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class APIKey(models.Model):

    # ─── Key Format Constants ─────────────────
    KEY_PREFIX   = "bk_live_"
    KEY_LENGTH   = 32  # random hex chars after prefix

    # ─── Fields ───────────────────────────────

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="api_keys",
        help_text="The user this key authenticates as.",
    )

    name = models.CharField(
        max_length=100,
        help_text="Human-readable name. e.g. 'CI/CD Pipeline' or 'Zapier Integration'.",
    )

    # Stored display prefix — first 12 chars of the raw key.
    # e.g. "bk_live_xK9m" — enough to identify the key visually
    # without any security risk.
    prefix = models.CharField(
        max_length=12,
        editable=False,
        help_text="First 12 characters of the key for display. Not secret.",
    )

    # SHA-256 hash of the full raw key.
    # This is the only value used for authentication.
    key_hash = models.CharField(
        max_length=64,
        unique=True,
        editable=False,
        help_text="SHA-256 hash of the full key. Never the raw key.",
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="When False, this key is rejected on authentication.",
    )

    # Set when the key is explicitly revoked by the user.
    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this key was revoked. Null if still active.",
    )

    # Optional expiry. Null = never expires.
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this key expires. Null = never expires.",
    )

    # Updated every time this key successfully authenticates a request.
    # Used for security auditing and idle key detection.
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last successful authentication timestamp.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "api_keys"
        ordering = ["-created_at"]
        verbose_name = "API Key"
        verbose_name_plural = "API Keys"
        indexes = [
            # Auth backend lookup: active keys by hash
            models.Index(
                fields=["key_hash", "is_active"],
                name="idx_apikey_hash_active",
            ),
            # Dashboard: all keys for a user
            models.Index(
                fields=["owner", "-created_at"],
                name="idx_apikey_owner_created",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.prefix}...) — {'active' if self.is_active else 'revoked'}"

    # ─── Class Methods ────────────────────────

    @classmethod
    def generate(cls, owner, name, expires_at=None):
        """
        Generate a new API key.

        Returns a tuple: (APIKey instance, raw_key string)
        The raw_key is shown to the user exactly once.
        It is NOT stored — only its hash is persisted.

        Usage:
            api_key, raw_key = APIKey.generate(owner=user, name="CI Pipeline")
            # Return raw_key to the user immediately.
            # Do not store it anywhere.
        """
        # Generate the raw key
        random_part = secrets.token_hex(cls.KEY_LENGTH // 2)
        raw_key     = f"{cls.KEY_PREFIX}{random_part}"

        # Hash it
        key_hash = cls._hash_key(raw_key)

        # Store the first 12 chars as the display prefix
        prefix = raw_key[:12]

        instance = cls.objects.create(
            owner=owner,
            name=name,
            prefix=prefix,
            key_hash=key_hash,
            expires_at=expires_at,
        )
        return instance, raw_key

    @classmethod
    def authenticate(cls, raw_key):
        """
        Authenticate a raw API key string.

        Returns the APIKey instance if valid, None otherwise.
        Updates last_used_at on success.

        Failure reasons (all return None silently to prevent enumeration):
            - Key not found
            - Key is not active (revoked)
            - Key has expired
        """
        if not raw_key or not raw_key.startswith(cls.KEY_PREFIX):
            return None

        key_hash = cls._hash_key(raw_key)

        try:
            api_key = cls.objects.select_related("owner").get(
                key_hash=key_hash,
                is_active=True,
            )
        except cls.DoesNotExist:
            return None

        # Check expiry
        if api_key.expires_at and api_key.expires_at < timezone.now():
            return None

        # Update last_used_at asynchronously-friendly:
        # use update() to avoid race conditions and skip
        # the full model save overhead.
        cls.objects.filter(pk=api_key.pk).update(
            last_used_at=timezone.now()
        )
        api_key.last_used_at = timezone.now()

        return api_key

    def revoke(self):
        """
        Revoke this key immediately.
        Sets is_active=False and records the revocation timestamp.
        The associated user session is not affected.
        """
        self.is_active  = False
        self.revoked_at = timezone.now()
        self.save(update_fields=["is_active", "revoked_at", "updated_at"])

    @property
    def is_expired(self):
        """True if the key has passed its expiry date."""
        if not self.expires_at:
            return False
        return self.expires_at < timezone.now()

    @property
    def is_valid(self):
        """True if the key is active and not expired."""
        return self.is_active and not self.is_expired

    # ─── Private Helpers ─────────────────────

    @staticmethod
    def _hash_key(raw_key):
        """SHA-256 hash of a raw key string. Returns hex digest."""
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()