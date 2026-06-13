import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


def _send_email(subscriber, incident, status_page, event_type):
    """
    Send an HTML incident notification email to a subscriber.
    Falls back gracefully when email is not configured.
    """
    if not subscriber.email:
        logger.warning(
            "Email subscriber %s has no email address -- skipping.",
            subscriber.pk,
        )
        return

    app_url = getattr(settings, "APP_URL", "http://localhost:3000")

    context = {
        "incident":        incident,
        "status_page":     status_page,
        "event_type":      event_type,
        "status_page_url": f"{app_url}/status/{status_page.slug}/",
        "unsubscribe_url": (
            f"{app_url}/api/v1/status-pages/{status_page.slug}"
            f"/unsubscribe/{subscriber.unsubscribe_token}/"
        ),
    }

    if event_type == "incident_created":
        subject      = f"🔴 [{status_page.name}] Incident: {incident.title}"
        html_template = "notifications/incident_created.html"
        plain_text    = (
            f"Incident opened: {incident.title}\n"
            f"Severity: {incident.get_severity_display()}\n"
            f"Status: {incident.get_status_display()}\n\n"
            f"View status page: {context['status_page_url']}\n\n"
            f"Unsubscribe: {context['unsubscribe_url']}"
        )
    else:
        subject      = f"✅ [{status_page.name}] Resolved: {incident.title}"
        html_template = "notifications/incident_resolved.html"
        plain_text    = (
            f"Incident resolved: {incident.title}\n\n"
            f"View status page: {context['status_page_url']}\n\n"
            f"Unsubscribe: {context['unsubscribe_url']}"
        )

    html_message = render_to_string(html_template, context)

    send_mail(
        subject       = subject,
        message       = plain_text,
        from_email    = settings.DEFAULT_FROM_EMAIL,
        recipient_list = [subscriber.email],
        html_message  = html_message,
        fail_silently = False,
    )

    logger.info(
        "Email sent: %s -> %s (event=%s)",
        status_page.slug,
        subscriber.email,
        event_type,
    )