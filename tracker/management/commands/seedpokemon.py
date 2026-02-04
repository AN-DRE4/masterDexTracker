from django.core.management.base import BaseCommand
from tracker.models import Pokemon
from tracker.pokemon_data import POKEMON_GEN1


class Command(BaseCommand):
    help = "Seed Pokemon table from Gen 1 data."

    def handle(self, *args, **options):
        for dex, name, slug in POKEMON_GEN1:
            Pokemon.objects.get_or_create(dex=dex, defaults={"name": name, "slug": slug, "generation": 1})
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(POKEMON_GEN1)} Pokemon."))
