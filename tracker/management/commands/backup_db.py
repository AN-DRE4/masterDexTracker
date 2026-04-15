from django.core.management.base import BaseCommand, CommandError

from tracker.db_snapshots import create_snapshot, list_snapshots, snapshots_dir


class Command(BaseCommand):
    help = "Create a timestamped snapshot of db.sqlite3."

    def add_arguments(self, parser):
        parser.add_argument(
            "--label",
            type=str,
            default="",
            help="Optional label suffix for the snapshot filename.",
        )
        parser.add_argument(
            "--list",
            action="store_true",
            help="List available snapshots instead of creating one.",
        )

    def handle(self, *args, **options):
        if options["list"]:
            items = list_snapshots()
            if not items:
                self.stdout.write("No snapshots found.")
                return
            self.stdout.write(f"Snapshots in: {snapshots_dir()}")
            for s in items:
                self.stdout.write(f"- {s.path.name} ({s.created_at.isoformat(sep=' ', timespec='seconds')})")
            return

        label = options.get("label") or None
        try:
            snapshot = create_snapshot(label=label)
        except FileNotFoundError as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(self.style.SUCCESS(f"Snapshot created: {snapshot}"))
