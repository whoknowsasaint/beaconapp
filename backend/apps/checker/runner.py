import logging
import threading
import time

from django.utils import timezone

logger = logging.getLogger(__name__)

_stop_event = threading.Event()


def run_checker(interval_floor=10):
    """
    Main scheduler loop.

    Iterates all active monitors every `interval_floor` seconds.
    Monitors whose interval has elapsed since last_checked_at are checked.
    Each check runs in its own thread so slow monitors do not block others.
    """
    logger.info("Beacon checker worker started.")

    while not _stop_event.is_set():
        _tick()
        _stop_event.wait(timeout=interval_floor)

    logger.info("Beacon checker worker stopped.")


def stop_checker():
    _stop_event.set()


def _tick():
    from apps.monitors.models import Monitor

    now      = timezone.now()
    monitors = Monitor.objects.filter(is_active=True).select_related("owner")

    due = [m for m in monitors if _is_due(m, now)]

    if not due:
        return

    logger.debug("Tick: %d monitors due for check.", len(due))

    threads = []
    for monitor in due:
        t = threading.Thread(
            target=_run_single_check,
            args=(monitor,),
            daemon=True,
            name=f"check-{monitor.id}",
        )
        t.start()
        threads.append(t)

    for t in threads:
        t.join(timeout=60)


def _is_due(monitor, now):
    if monitor.last_checked_at is None:
        return True

    elapsed = (now - monitor.last_checked_at).total_seconds()
    return elapsed >= monitor.interval


def _run_single_check(monitor):
    from .engine import check_monitor
    from .writer import save_check_result

    try:
        result = check_monitor(monitor)
        save_check_result(monitor, result)
    except Exception:
        logger.exception(
            "Unhandled error checking monitor %s (%s)",
            monitor.name,
            monitor.id,
        )