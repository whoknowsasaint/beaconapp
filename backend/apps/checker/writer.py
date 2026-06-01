import logging
from django.utils import timezone
from django.db import transaction

logger = logging.getLogger(__name__)


def save_check_result(monitor, result, region="local"):
    from apps.monitors.models import Monitor, MonitorCheck
    from apps.incidents.models import Incident, IncidentUpdate, IncidentMonitor

    checked_at = timezone.now()

    with transaction.atomic():
        MonitorCheck.objects.create(
            monitor=monitor,
            status=result.status,
            response_time_ms=result.response_time_ms,
            http_status_code=result.http_status_code,
            error=result.error,
            region=region,
            checked_at=checked_at,
        )

        previous_status = monitor.status
        new_status      = _derive_monitor_status(result.status)

        Monitor.objects.filter(pk=monitor.pk).update(
            status=new_status,
            last_checked_at=checked_at,
            updated_at=timezone.now(),
        )
        monitor.status         = new_status
        monitor.last_checked_at = checked_at

        if _is_new_outage(previous_status, new_status):
            _open_incident(monitor, result, checked_at)

        elif _is_recovery(previous_status, new_status):
            _resolve_incidents(monitor, checked_at)

    logger.debug(
        "Monitor %s checked: %s -> %s (%sms)",
        monitor.name,
        previous_status,
        new_status,
        result.response_time_ms,
    )


def _derive_monitor_status(check_status):
    from apps.monitors.models import Monitor, MonitorCheck

    mapping = {
        MonitorCheck.CheckStatus.UP:      Monitor.MonitorStatus.OPERATIONAL,
        MonitorCheck.CheckStatus.DOWN:    Monitor.MonitorStatus.OUTAGE,
        MonitorCheck.CheckStatus.TIMEOUT: Monitor.MonitorStatus.DEGRADED,
        MonitorCheck.CheckStatus.ERROR:   Monitor.MonitorStatus.OUTAGE,
    }
    return mapping.get(check_status, Monitor.MonitorStatus.OUTAGE)


def _is_new_outage(previous, current):
    from apps.monitors.models import Monitor

    was_healthy = previous in (
        Monitor.MonitorStatus.OPERATIONAL,
        Monitor.MonitorStatus.PENDING,
    )
    is_unhealthy = current in (
        Monitor.MonitorStatus.OUTAGE,
        Monitor.MonitorStatus.DEGRADED,
    )
    return was_healthy and is_unhealthy


def _is_recovery(previous, current):
    from apps.monitors.models import Monitor

    was_unhealthy = previous in (
        Monitor.MonitorStatus.OUTAGE,
        Monitor.MonitorStatus.DEGRADED,
    )
    return was_unhealthy and current == Monitor.MonitorStatus.OPERATIONAL


def _open_incident(monitor, result, started_at):
    from apps.incidents.models import Incident, IncidentUpdate, IncidentMonitor

    existing = Incident.objects.filter(
        owner=monitor.owner,
        auto_created=True,
        status__in=[
            Incident.IncidentStatus.INVESTIGATING,
            Incident.IncidentStatus.IDENTIFIED,
            Incident.IncidentStatus.MONITORING,
        ],
        affected_monitors__monitor=monitor,
    ).first()

    if existing:
        return

    incident = Incident.objects.create(
        owner=monitor.owner,
        title=f"{monitor.name} -- service disruption detected",
        severity=Incident.Severity.MAJOR,
        status=Incident.IncidentStatus.INVESTIGATING,
        summary=(
            f"Automated monitoring detected a disruption on {monitor.name}. "
            f"Error: {result.error or 'No response received.'}"
        ),
        is_public=True,
        auto_created=True,
        started_at=started_at,
    )

    IncidentMonitor.objects.create(
        incident=incident,
        monitor=monitor,
        monitor_status_snapshot=monitor.status,
    )

    IncidentUpdate.objects.create(
        incident=incident,
        posted_by=None,
        status_at_update=Incident.IncidentStatus.INVESTIGATING,
        message=(
            f"Automated check failed for {monitor.name}. "
            f"Details: {result.error or 'No response received.'}"
        ),
        is_public=True,
    )

    logger.warning(
        "Incident opened for monitor %s: %s",
        monitor.name,
        result.error,
    )


def _resolve_incidents(monitor, resolved_at):
    from apps.incidents.models import Incident, IncidentUpdate, IncidentMonitor

    open_incidents = Incident.objects.filter(
        auto_created=True,
        status__in=[
            Incident.IncidentStatus.INVESTIGATING,
            Incident.IncidentStatus.IDENTIFIED,
            Incident.IncidentStatus.MONITORING,
        ],
        affected_monitors__monitor=monitor,
    )

    for incident in open_incidents:
        IncidentUpdate.objects.create(
            incident=incident,
            posted_by=None,
            status_at_update=Incident.IncidentStatus.RESOLVED,
            message=f"{monitor.name} has recovered. Automated check passed.",
            is_public=True,
        )

        IncidentMonitor.objects.filter(
            incident=incident,
            monitor=monitor,
        ).update(recovered_at=resolved_at)

        incident.resolve(resolved_at=resolved_at)

        logger.info(
            "Incident resolved for monitor %s",
            monitor.name,
        )