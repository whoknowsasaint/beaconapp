import logging
from django.db import IntegrityError

from apps.status_pages.models import StatusPage, Subscriber
from .models import NotificationLog

logger = logging.getLogger(__name__)


def dispatch(incident, event_type):
    """
    Entry point called by writer.py after every status transition.

    Finds all status pages owned by the incident owner that have
    confirmed active subscribers, then sends notifications via the
    appropriate channel for each subscriber.

    Deduplication is enforced by the NotificationLog unique constraint.
    If a log entry already exists for (incident, subscriber, event_type),
    the notification is silently skipped.
    """

    status_pages = StatusPage.objects.filter(
        owner=incident.owner,
    ).prefetch_related("subscribers")

    for page in status_pages:
        _dispatch_to_page(incident, page, event_type)


def _dispatch_to_page(incident, page, event_type):
    subscribers = page.subscribers.filter(
        is_confirmed=True,
        is_active=True,
    )

    for subscriber in subscribers:
        _dispatch_to_subscriber(incident, page, subscriber, event_type)

    if page.slack_webhook_url:
        _dispatch_slack(incident, page, event_type)


def _dispatch_to_subscriber(incident, page, subscriber, event_type):
    try:
        log = NotificationLog.objects.create(
            incident=incident,
            subscriber=subscriber,
            event_type=event_type,
        )
    except IntegrityError:
        logger.debug(
            "Notification already sent: incident=%s subscriber=%s event=%s",
            incident.id,
            subscriber.id,
            event_type,
        )
        return

    try:
        if subscriber.notification_channel == Subscriber.NotificationChannel.TELEGRAM:
            _send_telegram(subscriber, incident, page, event_type)
        elif subscriber.notification_channel == Subscriber.NotificationChannel.EMAIL:
            _send_email(subscriber, incident, page, event_type)

        log.mark_sent()

    except Exception as exc:
        logger.error(
            "Notification delivery failed: incident=%s subscriber=%s event=%s error=%s",
            incident.id,
            subscriber.id,
            event_type,
            exc,
        )
        log.mark_failed(str(exc))


def _send_telegram(subscriber, incident, page, event_type):
    from .telegram import send_incident_notification
    send_incident_notification(
        chat_id=subscriber.telegram_chat_id,
        incident=incident,
        status_page=page,
        event_type=event_type,
    )


def _send_email(subscriber, incident, page, event_type):
    logger.info(
        "Email notification queued (not yet implemented): %s",
        subscriber.email,
    )


def _dispatch_slack(incident, page, event_type):
    from .slack import send_incident_notification
    try:
        send_incident_notification(
            webhook_url=page.slack_webhook_url,
            incident=incident,
            status_page=page,
            event_type=event_type,
        )
        logger.info(
            "Slack notification sent: incident=%s page=%s event=%s",
            incident.id,
            page.slug,
            event_type,
        )
    except Exception as exc:
        logger.error(
            "Slack notification failed: incident=%s page=%s error=%s",
            incident.id,
            page.slug,
            exc,
        )