import json
import logging
from django.http import JsonResponse

from apps.status_pages.models import StatusPage, Subscriber
from apps.notifications.telegram import _post_to_chat

logger = logging.getLogger(__name__)


def handle_webhook(request):
    """
    Process an incoming Telegram bot update.

    Supported commands:
        /start {slug}  -- subscribe to a status page
        /stop          -- unsubscribe from all pages
        /help          -- show usage instructions

    Always returns HTTP 200 so Telegram does not retry.
    """
    try:
        body    = json.loads(request.body)
        message = body.get("message") or body.get("edited_message") or {}
        chat    = message.get("chat", {})
        chat_id = str(chat.get("id", ""))
        text    = (message.get("text") or "").strip()

        if not chat_id or not text:
            return JsonResponse({"ok": True})

        if text.startswith("/start"):
            _handle_start(chat_id, text)
        elif text.startswith("/stop"):
            _handle_stop(chat_id)
        else:
            _handle_help(chat_id)

    except Exception:
        logger.exception("Error processing Telegram webhook update.")

    return JsonResponse({"ok": True})


def _handle_start(chat_id: str, text: str) -> None:
    parts = text.split(maxsplit=1)
    slug  = parts[1].strip() if len(parts) > 1 else ""

    if not slug:
        _post_to_chat(
            chat_id,
            "👋 <b>Welcome to Beacon Alerts!</b>\n\n"
            "To subscribe to a status page, click the subscribe button "
            "on the status page and follow the link.",
        )
        return

    try:
        page = StatusPage.objects.get(slug=slug, is_public=True)
    except StatusPage.DoesNotExist:
        _post_to_chat(
            chat_id,
            "❌ Status page not found. Please check the link and try again.",
        )
        return

    subscriber, created = Subscriber.objects.get_or_create(
        status_page=page,
        notification_channel=Subscriber.NotificationChannel.TELEGRAM,
        telegram_chat_id=chat_id,
        defaults={
            "is_confirmed": True,
            "is_active":    True,
        },
    )

    if not created:
        if not subscriber.is_active:
            subscriber.is_active    = True
            subscriber.is_confirmed = True
            subscriber.save(update_fields=["is_active", "is_confirmed", "updated_at"])
            action = "re-subscribed"
        elif not subscriber.is_confirmed:
            subscriber.is_confirmed = True
            subscriber.save(update_fields=["is_confirmed", "updated_at"])
            action = "confirmed"
        else:
            action = "already subscribed"
    else:
        action = "subscribed"

    if action == "already subscribed":
        _post_to_chat(
            chat_id,
            f"ℹ️ You are already subscribed to <b>{_esc(page.name)}</b> status updates.",
        )
    else:
        _post_to_chat(
            chat_id,
            f"✅ Successfully {action} to <b>{_esc(page.name)}</b> status updates.\n\n"
            f"You'll receive alerts when incidents are created or resolved.\n\n"
            f"Send /stop to unsubscribe at any time.",
        )


def _handle_stop(chat_id: str) -> None:
    updated = Subscriber.objects.filter(
        telegram_chat_id=chat_id,
        is_active=True,
    ).update(is_active=False)

    if updated:
        _post_to_chat(
            chat_id,
            f"🔕 Unsubscribed from {updated} status page(s). "
            "You won't receive any more alerts.",
        )
    else:
        _post_to_chat(
            chat_id,
            "ℹ️ You don't have any active subscriptions.",
        )


def _handle_help(chat_id: str) -> None:
    _post_to_chat(
        chat_id,
        "📡 <b>Beacon Alerts Bot</b>\n\n"
        "<b>Commands:</b>\n"
        "/start {slug} — Subscribe to a status page\n"
        "/stop — Unsubscribe from all pages\n"
        "/help — Show this message\n\n"
        "To subscribe, click the notification link on a Beacon status page.",
    )


def _esc(text: str) -> str:
    """Escape HTML special characters for Telegram HTML parse mode."""
    return (
        (text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )