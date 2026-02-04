# Migration: add option_definitions; available_options becomes list of selected ids

from django.db import migrations, models


def migrate_to_definitions_and_ids(apps, schema_editor):
    SquareChoice = apps.get_model('tracker', 'SquareChoice')
    for row in SquareChoice.objects.all():
        opts = getattr(row, 'available_options', None) or []
        definitions = []
        ids = []
        if opts and isinstance(opts, list):
            first = opts[0] if opts else None
            if isinstance(first, dict):
                for item in opts:
                    if item and isinstance(item, dict):
                        for k, v in item.items():
                            definitions.append({'id': k, 'label': v if isinstance(v, str) else k})
                            ids.append(k)
                            break
            elif isinstance(first, str):
                ids = [x for x in opts if isinstance(x, str)]
                definitions = [{'id': x, 'label': x} for x in ids]
        row.option_definitions = definitions
        row.available_options = ids
        row.save(update_fields=['option_definitions', 'available_options'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0003_pokemon_and_squarechoice_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='squarechoice',
            name='option_definitions',
            field=models.JSONField(default=list),
        ),
        migrations.RunPython(migrate_to_definitions_and_ids, noop),
    ]
