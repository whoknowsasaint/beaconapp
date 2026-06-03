import logging
import httpx

logger = logging.getLogger(__name__)

SEVERITY_COLOR = {
    "critical": "#EF4444",
    "major":    "#F59E0B",
    "minor":    "#3B82F6",
    "notice":   "#6B7280",
}

STATUS_EMOJI = {
    "investigating": ":red_circle:",
    "identified":    ":large_orange_circle:",
    "monitoring":    ":large_yellow_circle:",
    "resolved":      ":large_green_circle:",
}


def send_incident_notification(webhook_url, incident, status_page, event_type):
    blocks  = _build_blocks(incident, status_page, event_type)
    color   = SEVERITY_COLOR.get(incident.severity, "#6B7280")
    payload = {
        "attachments": [
            {
                "color":  color,
                "blocks": blocks,
            }
        ]
    }
    _post_webhook(webhook_url, payload)


def _build_blocks(incident, status_page, event_type):
    from django.conf import settings

    status_emoji = STATUS_EMOJI.get(incident.status, ":white_circle:")
    page_url     = (
        f"{getattr(settings, 'NEXT_PUBLIC_APP_URL', '')}"
        f"/status/{status_page.slug}/"
    )

    if event_type == "incident_created":
        header_text = f"{status_emoji} Incident detected"
    elif event_type == "incident_resolved":
        header_text = ":large_green_circle: Incident resolved"
    else:
        header_text = f"{status_emoji} Incident update"

    blocks = [
        {
            "type": "header",
            "text": {
                "type":  "plain_text",
                "text":  header_text,
                "emoji": True,
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*{incident.title}*",
            },
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Status*\n{incident.get_status_display()}",
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Severity*\n{incident.get_severity_display()}",
                },
            ],
        },
    ]

    if incident.summary:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": incident.summary,
            },
        })

    blocks.append({
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": f"<{page_url}|View status page> · {status_page.name}",
            }
        ],
    })

    return blocks


def _post_webhook(webhook_url, payload):
    try:
        response = httpx.post(webhook_url, json=payload, timeout=10)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"Slack webhook error {exc.response.status_code}: "
            f"{exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(f"Slack request failed: {exc}") from exc