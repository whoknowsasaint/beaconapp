import socket
import subprocess
import time
from dataclasses import dataclass
from typing import Optional

import httpx


@dataclass
class CheckResult:
    status: str
    response_time_ms: Optional[int]
    http_status_code: Optional[int]
    error: str


def check_monitor(monitor):
    from apps.monitors.models import Monitor

    start = time.monotonic()

    if monitor.monitor_type == Monitor.MonitorType.HTTP:
        return _check_http(monitor, start)

    if monitor.monitor_type == Monitor.MonitorType.TCP:
        return _check_tcp(monitor, start)

    if monitor.monitor_type == Monitor.MonitorType.PING:
        return _check_ping(monitor, start)

    return CheckResult(
        status="error",
        response_time_ms=None,
        http_status_code=None,
        error=f"Unknown monitor type: {monitor.monitor_type}",
    )


def _check_http(monitor, start):
    from apps.monitors.models import MonitorCheck

    try:
        with httpx.Client(
            timeout=monitor.timeout,
            follow_redirects=True,
            verify=True,
        ) as client:
            response = client.get(monitor.url)

        elapsed = int((time.monotonic() - start) * 1000)
        expected = monitor.get_expected_status_codes()
        is_up = response.status_code in expected

        return CheckResult(
            status=MonitorCheck.CheckStatus.UP if is_up else MonitorCheck.CheckStatus.DOWN,
            response_time_ms=elapsed,
            http_status_code=response.status_code,
            error="" if is_up else (
                f"Unexpected status {response.status_code}. "
                f"Expected: {', '.join(str(c) for c in expected)}."
            ),
        )

    except httpx.TimeoutException:
        elapsed = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status=MonitorCheck.CheckStatus.TIMEOUT,
            response_time_ms=elapsed,
            http_status_code=None,
            error=f"Request timed out after {monitor.timeout}s.",
        )

    except httpx.SSLError as exc:
        return CheckResult(
            status=MonitorCheck.CheckStatus.ERROR,
            response_time_ms=None,
            http_status_code=None,
            error=f"SSL error: {exc}",
        )

    except httpx.RequestError as exc:
        return CheckResult(
            status=MonitorCheck.CheckStatus.ERROR,
            response_time_ms=None,
            http_status_code=None,
            error=f"Request error: {exc}",
        )


def _check_tcp(monitor, start):
    from apps.monitors.models import MonitorCheck

    try:
        with socket.create_connection(
            (monitor.host, monitor.port),
            timeout=monitor.timeout,
        ):
            pass

        elapsed = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status=MonitorCheck.CheckStatus.UP,
            response_time_ms=elapsed,
            http_status_code=None,
            error="",
        )

    except socket.timeout:
        elapsed = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status=MonitorCheck.CheckStatus.TIMEOUT,
            response_time_ms=elapsed,
            http_status_code=None,
            error=f"TCP connection timed out after {monitor.timeout}s.",
        )

    except (socket.error, OSError) as exc:
        return CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=None,
            http_status_code=None,
            error=f"TCP connection failed: {exc}",
        )


def _check_ping(monitor, start):
    from apps.monitors.models import MonitorCheck
    import platform

    flag = "-n" if platform.system().lower() == "windows" else "-c"

    try:
        result = subprocess.run(
            ["ping", flag, "1", "-w", str(monitor.timeout), monitor.host],
            capture_output=True,
            timeout=monitor.timeout + 2,
        )
        elapsed = int((time.monotonic() - start) * 1000)

        if result.returncode == 0:
            return CheckResult(
                status=MonitorCheck.CheckStatus.UP,
                response_time_ms=elapsed,
                http_status_code=None,
                error="",
            )

        return CheckResult(
            status=MonitorCheck.CheckStatus.DOWN,
            response_time_ms=elapsed,
            http_status_code=None,
            error=f"Ping failed: {result.stderr.decode(errors='replace').strip()}",
        )

    except subprocess.TimeoutExpired:
        return CheckResult(
            status=MonitorCheck.CheckStatus.TIMEOUT,
            response_time_ms=None,
            http_status_code=None,
            error=f"Ping timed out after {monitor.timeout}s.",
        )

    except Exception as exc:
        return CheckResult(
            status=MonitorCheck.CheckStatus.ERROR,
            response_time_ms=None,
            http_status_code=None,
            error=f"Ping error: {exc}",
        )