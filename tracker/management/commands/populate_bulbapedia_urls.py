"""Fill or refresh DexEntry.bulbapedia_url from each entry's name."""
from django.core.management.base import BaseCommand
from tracker.models import DexEntry
from tracker.bulbapedia_urls import bulbapedia_species_url


class Command(BaseCommand):
    help = 'Set bulbapedia_url on all dex entries from the entry name (base species URL).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite existing non-empty bulbapedia_url values.',
        )

    def handle(self, *args, **options):
        force = options['force']
        qs = DexEntry.objects.all()
        if not force:
            qs = qs.filter(bulbapedia_url='')

        updated = 0
        batch = []
        for entry in qs.iterator():
            url = bulbapedia_species_url(entry.name or '')[:512]
            if not url:
                continue
            if not force and entry.bulbapedia_url:
                continue
            entry.bulbapedia_url = url
            batch.append(entry)
            if len(batch) >= 400:
                DexEntry.objects.bulk_update(batch, ['bulbapedia_url'])
                updated += len(batch)
                batch = []
        if batch:
            DexEntry.objects.bulk_update(batch, ['bulbapedia_url'])
            updated += len(batch)

        self.stdout.write(self.style.SUCCESS(f'Updated {updated} entries.'))
