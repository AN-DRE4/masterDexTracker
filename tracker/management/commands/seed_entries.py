"""Create sample DexEntry rows for testing when Excel import is not available."""
from django.core.management.base import BaseCommand
from tracker.models import DexEntry
from tracker.bulbapedia_urls import bulbapedia_species_url


class Command(BaseCommand):
    help = 'Create sample dex entries for testing'

    def handle(self, *args, **options):
        samples = [
            {'box': 1, 'row': 1, 'slot': 1, 'national_dex_number': 1, 'name': 'Bulbasaur', 'section': 'living_dex',
             'image_url': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png', 'games': 'Red, Blue', 'notes': 'Starter.', 'sort_order': 1},
            {'box': 1, 'row': 1, 'slot': 2, 'national_dex_number': 2, 'name': 'Ivysaur', 'section': 'living_dex',
             'image_url': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png', 'games': 'Red, Blue', 'notes': '', 'sort_order': 2},
            {'box': 1, 'row': 1, 'slot': 3, 'national_dex_number': 3, 'name': 'Venusaur', 'section': 'living_dex',
             'image_url': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png', 'games': 'Red, Blue', 'notes': '', 'sort_order': 3},
        ]
        for i, d in enumerate(samples):
            defaults = {**d, 'caught': False, 'bulbapedia_url': (bulbapedia_species_url(d['name']) or '')[:512]}
            _, created = DexEntry.objects.get_or_create(
                box=d['box'], row=d['row'], slot=d['slot'], section=d['section'],
                defaults=defaults,
            )
            if created:
                self.stdout.write(f"Created {d['name']}")
        self.stdout.write(self.style.SUCCESS('Seed done.'))
