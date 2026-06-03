from django.db import connection
from django.utils import timezone
from datetime import timedelta


def get_daily_uptime(monitor, days=90):
    """
    Returns a list of daily uptime buckets for the given monitor.

    Each bucket is a dict:
        {
            "date":   "2024-03-15",   -- UTC date string
            "status": "up",           -- dominant status for the day
            "up":     142,            -- count of UP checks
            "total":  144,            -- count of all checks
            "pct":    98.61,          -- percentage of UP checks
        }

    Days with no checks have status "no_data".
    List is ordered oldest to newest (left to right for UptimeBars).
    Total length is always exactly `days` items.
    """

    since = timezone.now() - timedelta(days=days)

    rows = _query_daily_buckets(monitor.id, since)
    by_date = {row["date"]: row for row in rows}

    result = []
    for i in range(days):
        date = (since + timedelta(days=i + 1)).date()
        key  = str(date)

        if key in by_date:
            row = by_date[key]
            result.append({
                "date":   key,
                "status": _dominant_status(row),
                "up":     row["up_count"],
                "total":  row["total_count"],
                "pct":    round((row["up_count"] / row["total_count"]) * 100, 2)
                          if row["total_count"] > 0 else 0.0,
            })
        else:
            result.append({
                "date":   key,
                "status": "no_data",
                "up":     0,
                "total":  0,
                "pct":    None,
            })

    return result


def _query_daily_buckets(monitor_id, since):
    """
    Aggregates MonitorCheck records into daily buckets using a single
    SQL query. Uses the idx_check_monitor_time compound index.
    """

    sql = """
        SELECT
            DATE(checked_at AT TIME ZONE 'UTC') AS date,
            COUNT(*)                             AS total_count,
            COUNT(*) FILTER (WHERE status = 'up') AS up_count,
            COUNT(*) FILTER (WHERE status = 'down')    AS down_count,
            COUNT(*) FILTER (WHERE status = 'timeout') AS timeout_count,
            COUNT(*) FILTER (WHERE status = 'error')   AS error_count
        FROM monitor_checks
        WHERE
            monitor_id = %s
            AND checked_at >= %s
        GROUP BY DATE(checked_at AT TIME ZONE 'UTC')
        ORDER BY date ASC
    """

    with connection.cursor() as cursor:
        cursor.execute(sql, [str(monitor_id), since])
        columns = [col[0] for col in cursor.description]
        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]


def _dominant_status(row):
    """
    Derives a single status label for a day from its check counts.

    Priority: if any checks were errors/down and they exceed 20% of
    total checks, the day is "down". If timeouts exceed 20%, "timeout".
    Otherwise "up".
    """

    total = row["total_count"]
    if total == 0:
        return "no_data"

    down_pct    = (row["down_count"] + row["error_count"]) / total
    timeout_pct = row["timeout_count"] / total

    if down_pct > 0.20:
        return "down"
    if timeout_pct > 0.20:
        return "timeout"
    return "up"