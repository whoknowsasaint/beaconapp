import time
import logging
import socket

import httpx

from .models import CheckResult

logger = logging.getLogger(__name__)


def check_monitor(monitor):
    start = time.monotonic()
    if monitor.monitor_type == "http":
        return _check_http(monitor, start)
    elif monitor.monitor_type == "tcp":
        return _check_tcp(monitor, start)
    elif monitor.monitor_type == "ping":
        return _check_ping(monitor, start)
    else:
        return CheckResult(
            status="down",
            response_time_ms=None,
            http_status_code=None,
            error=f"Unknown monitor type: {monitor.monitor_type}",
        )


def _check_http(monitor, start):
    try:
        with httpx.Client(
            timeout=monitor.timeout,
            follow_redirects=True,
            verify=True,
        ) as client:
            response = client.get(monitor.url)

        elapsed_ms = int((time.monotonic() - start) * 1000)

        expected = [
            int(c.strip())
            for c in str(monitor.expected_status_codes).split(",")
            if c.strip().isdigit()
        ]

        if response.status_code in expected:
            return CheckResult(
                status="up",
                response_time_ms=elapsed_ms,
                http_status_code=response.status_code,
                error="",
            )
        else:
            return CheckResult(
                status="down",
                response_time_ms=elapsed_ms,
                http_status_code=response.status_code,
                error=f"Unexpected status code: {response.status_code}",
            )

    except httpx.ConnectError as exc:
        # Covers DNS failures, connection refused, SSL errors in newer httpx
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status="down",
            response_time_ms=elapsed_ms,
            http_status_code=None,
            error=f"Connection error: {exc}",
        )

    except httpx.TimeoutException as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status="down",
            response_time_ms=elapsed_ms,
            http_status_code=None,
            error=f"Timeout: {exc}",
        )

    except httpx.RequestError as exc:
        # Catch-all for any remaining httpx request errors
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status="down",
            response_time_ms=elapsed_ms,
            http_status_code=None,
            error=f"Request error: {exc}",
        )

    except Exception as exc:
        logger.exception(
            "Unhandled error checking monitor %s (%s)",
            monitor.name,
            monitor.id,
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status="down",
            response_time_ms=elapsed_ms,
            http_status_code=None,
            error=f"Unhandled error: {exc}",
        )


def _check_tcp(monitor, start):
    try:
        sock = socket.create_connection(
            (monitor.host, monitor.port),
            timeout=monitor.timeout,
        )
        sock.close()
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status="up",
            response_time_ms=elapsed_ms,
            http_status_code=None,
            error="",
        )
    except (socket.timeout, ConnectionRefusedError, OSError) as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status="down",
            response_time_ms=elapsed_ms,
            http_status_code=None,
            error=str(exc),
        )


def _check_ping(monitor, start):
    import subprocess
    import platform

    flag = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        result = subprocess.run(
            ["ping", flag, "1", monitor.host],
            capture_output=True,
            timeout=monitor.timeout,
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        if result.returncode == 0:
            return CheckResult(
                status="up",
                response_time_ms=elapsed_ms,
                http_status_code=None,
                error="",
            )
        else:
            return CheckResult(
                status="down",
                response_time_ms=elapsed_ms,
                http_status_code=None,
                error="Ping failed",
            )
    except subprocess.TimeoutExpired:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return CheckResult(
            status="down",
            response_time_ms=elapsed_ms,
            http_status_code=None,
            error="Ping timeout",
        )