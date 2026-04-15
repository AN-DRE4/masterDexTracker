from django.core.management.base import BaseCommand, CommandError

from tracker.db_snapshots import resolve_snapshot, restore_snapshot


class Command(BaseCommand):
    help = "Restore db.sqlite3 from an existing snapshot."

    def add_arguments(self, parser):
        parser.add_argument(
            "snapshot",
            nargs="?",
            default="latest",
            help="Snapshot filename to restore (default: latest).",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip confirmation prompt.",
        )

    def handle(self, *args, **options):
        identifier = options["snapshot"]
        try:
            snapshot_path = resolve_snapshot(identifier)
        except FileNotFoundError as exc:
            raise CommandError(str(exc)) from exc

        if not options["yes"]:
            self.stdout.write(
                f"You are about to restore DB from: {snapshot_path.name}\n"
                "This will replace current db.sqlite3."
            )
            response = input("Type 'yes' to continue: ").strip().lower()
            if response != "yes":
                self.stdout.write("Restore cancelled.")
                return

        try:
            safety_backup, db_path = restore_snapshot(snapshot_path)
        except FileNotFoundError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(self.style.SUCCESS(f"Restore complete: {db_path}"))
        self.stdout.write(self.style.WARNING(f"Safety backup created: {safety_backup}"))
