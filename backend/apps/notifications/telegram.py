import logging
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

TELEGRAM_API_BASE = "https://api.telegram.org/bot"

STATUS_EMOJI = {
    "investigating": "🔴",
    "identified":    "🟠",
    "monitoring":    "🟡",
    "resolved":      "🟢",
}

SEVERITY_LABEL = {
    "critical": "CRITICAL",
    "major":    "MAJOR",
    "minor":    "MINOR",
    "notice":   "NOTICE",
}


def get_bot_token():
    return getattr(settings, "TELEGRAM_BOT_TOKEN", None)


def send_incident_notification(chat_id, incident, status_page, event_type):
    token = get_bot_token()
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN is not configured.")

    text = _build_message(incident, status_page, event_type)
    _send_message(token, chat_id, text)


def _build_message(incident, status_page, event_type):
    emoji    = STATUS_EMOJI.get(incident.status, "⚪")
    severity = SEVERITY_LABEL.get(incident.severity, incident.severity.upper())
    page_url = (
        f"{getattr(settings, 'NEXT_PUBLIC_APP_URL', '')}"
        f"/status/{status_page.slug}/"
    )

    if event_type == "incident_created":
        header = f"{emoji} <b>Incident detected</b>"
    elif event_type == "incident_resolved":
        header = f"🟢 <b>Incident resolved</b>"
    else:
        header = f"{emoji} <b>Incident update</b>"

    lines = [
        header,
        "",
        f"<b>{_escape(incident.title)}</b>",
        f"Severity: {severity}",
        f"Status: {incident.get_status_display()}",
    ]

    if incident.summary:
        lines += ["", _escape(incident.summary)]

    lines += [
        "",
        f'<a href="{page_url}">View status page</a>',
    ]

    return "\n".join(lines)


def _send_message(token, chat_id, text):
    url = f"{TELEGRAM_API_BASE}{token}/sendMessage"

    payload = {
        "chat_id":    chat_id,
        "text":       text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    try:
        response = httpx.post(url, json=payload, timeout=10)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"Telegram API error {exc.response.status_code}: "
            f"{exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(f"Telegram request failed: {exc}") from exc


def _escape(text):
    if not text:
        return ""
    return (
        text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )