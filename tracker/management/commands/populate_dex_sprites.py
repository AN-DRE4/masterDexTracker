"""
Populate DexEntry.image_url from Pokémon Database (pokemondb.net) sprites.
Uses Pokémon HOME sprite when it matches the entry; otherwise the most recent
available game (Gen 9 > Gen 8 > …). Handles forms (e.g. Alola, Galar) so the
correct form sprite is used.
"""
from django.core.management.base import BaseCommand
from tracker.models import DexEntry
from tracker.pokemondb_sprites import get_sprite_url, name_to_slug


class Command(BaseCommand):
    help = (
        "Populate DexEntry.image_url from Pokémon Database sprites. "
        "Prefers HOME; falls back to most recent game. Handles forms (Alola, Galar, etc.)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be updated, do not save.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Process at most N entries (0 = all).",
        )
        parser.add_argument(
            "--section",
            type=str,
            default=None,
            help="Only process entries in this section (e.g. living_dex, gender_forms).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["limit"]
        section = options["section"]

        qs = DexEntry.objects.all().order_by("section", "sort_order", "box", "row", "slot")
        if section:
            qs = qs.filter(section=section)
        if limit:
            qs = qs[:limit]

        total = qs.count()
        updated = 0
        failed = []

        for i, entry in enumerate(qs, 1):
            slug = name_to_slug(entry.name)
            url = get_sprite_url(entry.name, prefer_home=True)
            if url:
                if entry.image_url != url:
                    if not dry_run:
                        entry.image_url = url[:512]
                        entry.save(update_fields=["image_url"])
                    updated += 1
                    self.stdout.write(
                        f"  [{i}/{total}] #{entry.national_dex_number} {entry.name} -> {url[:60]}..."
                    )
            else:
                failed.append((entry.name, slug))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Updated {updated} image URL(s)."))
        if failed:
            self.stdout.write(self.style.WARNING(f"Could not resolve sprite for {len(failed)} entries:"))
            for name, slug in failed[:30]:
                self.stdout.write(f"  - {name!r} (slug: {slug or '(empty)'})")
            if len(failed) > 30:
                self.stdout.write(f"  ... and {len(failed) - 30} more.")
        if dry_run and updated:
            self.stdout.write(self.style.NOTICE("(Dry run: no changes saved.)"))
