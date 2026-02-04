# Migration: Pokemon model, SquareChoice available_options + generation

from django.db import migrations, models


def migrate_options_to_json(apps, schema_editor):
    SquareChoice = apps.get_model('tracker', 'SquareChoice')
    for row in SquareChoice.objects.all():
        opts = []
        if getattr(row, 'option_1', False):
            opts.append({'option_1': 'Option 1'})
        if getattr(row, 'option_2', False):
            opts.append({'option_2': 'Option 2'})
        if getattr(row, 'option_3', False):
            opts.append({'option_3': 'Option 3'})
        row.available_options = opts
        row.generation = 1
        row.save(update_fields=['available_options', 'generation'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0002_squarechoice_options_and_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pokemon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dex', models.PositiveIntegerField(unique=True)),
                ('name', models.CharField(max_length=64)),
                ('slug', models.CharField(max_length=64)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
            ],
            options={
                'ordering': ['dex'],
            },
        ),
        migrations.AddField(
            model_name='squarechoice',
            name='available_options',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='squarechoice',
            name='generation',
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.RunPython(migrate_options_to_json, noop),
        migrations.RemoveField(model_name='squarechoice', name='option_1'),
        migrations.RemoveField(model_name='squarechoice', name='option_2'),
        migrations.RemoveField(model_name='squarechoice', name='option_3'),
    ]
