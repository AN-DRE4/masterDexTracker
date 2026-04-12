from django.db import migrations


def populate_bulbapedia_urls(apps, schema_editor):
    from tracker.bulbapedia_urls import bulbapedia_species_url

    DexEntry = apps.get_model('tracker', 'DexEntry')
    batch = []
    for entry in DexEntry.objects.iterator():
        url = bulbapedia_species_url(entry.name or '')[:512]
        if entry.bulbapedia_url != url:
            entry.bulbapedia_url = url
            batch.append(entry)
        if len(batch) >= 400:
            DexEntry.objects.bulk_update(batch, ['bulbapedia_url'])
            batch = []
    if batch:
        DexEntry.objects.bulk_update(batch, ['bulbapedia_url'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0002_dexentry_bulbapedia_url'),
    ]

    operations = [
        migrations.RunPython(populate_bulbapedia_urls, noop),
    ]
