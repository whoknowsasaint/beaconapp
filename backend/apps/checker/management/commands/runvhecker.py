import signal
import sys
import logging

from django.core.management.base import BaseCommand

from apps.checker.runner import run_checker, stop_checker

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Start the Beacon monitor checker worker."

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=int,
            default=10,
            help="Scheduler tick interval in seconds (default: 10).",
        )

    def handle(self, *args, **options):
        interval = options["interval"]

        self.stdout.write(
            self.style.SUCCESS(
                f"Starting Beacon checker (tick every {interval}s). "
                "Press Ctrl+C to stop."
            )
        )

        def _shutdown(signum, frame):
            self.stdout.write("\nShutting down checker...")
            stop_checker()
            sys.exit(0)

        signal.signal(signal.SIGINT,  _shutdown)
        signal.signal(signal.SIGTERM, _shutdown)

        run_checker(interval_floor=interval)