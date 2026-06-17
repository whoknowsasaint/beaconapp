import uuid
from datetime import timedelta
from django.utils import timezone
from django.db.models import Min, Max
from apps.monitors.models import MonitorCheck


def get_daily_uptime(monitor_or_id, days=90):
    since = timezone.now() - timedelta(days=days)

    if isinstance(monitor_or_id, uuid.UUID):
        monitor_id = monitor_or_id
    elif hasattr(monitor_or_id, "id"):
        monitor_id = monitor_or_id.id
    else:
        monitor_id = uuid.UUID(str(monitor_or_id))

    rows = _query_daily_buckets(monitor_id, since)
    return _build_buckets(rows, days)


def _query_daily_buckets(monitor_id, since):
    checks = (
        MonitorCheck.objects
        .filter(monitor_id=monitor_id, checked_at__gte=since)
        .extra(select={"day": "date(checked_at)"})
        .values("day", "status")
        .order_by("day")
    )

    buckets = {}
    for row in checks:
        day = str(row["day"])
        if day not in buckets:
            buckets[day] = {"up": 0, "down": 0}
        if row["status"] == "up":
            buckets[day]["up"] += 1
        else:
            buckets[day]["down"] += 1

    return buckets


def _build_buckets(rows, days):
    today   = timezone.now().date()
    result  = []

    for i in range(days - 1, -1, -1):
        day     = today - timedelta(days=i)
        day_str = str(day)
        counts  = rows.get(day_str)

        if counts is None:
            result.append({"date": day_str, "status": "no_data", "up": 0, "down": 0})
        elif counts["down"] == 0:
            result.append({"date": day_str, "status": "up",   "up": counts["up"],   "down": 0})
        elif counts["up"] == 0:
            result.append({"date": day_str, "status": "down", "up": 0, "down": counts["down"]})
        else:
            result.append({"date": day_str, "status": "degraded", "up": counts["up"], "down": counts["down"]})

    return result