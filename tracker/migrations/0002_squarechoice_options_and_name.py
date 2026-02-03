# Generated manually for option -> option_1/2/3 + pokemon_name

from django.db import migrations, models


def migrate_old_option(apps, schema_editor):
    SquareChoice = apps.get_model('tracker', 'SquareChoice')
    for row in SquareChoice.objects.all():
        if row.option == 1:
            row.option_1 = True
        elif row.option == 2:
            row.option_2 = True
        elif row.option == 3:
            row.option_3 = True
        row.save(update_fields=['option_1', 'option_2', 'option_3'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='squarechoice',
            name='option_1',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='squarechoice',
            name='option_2',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='squarechoice',
            name='option_3',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='squarechoice',
            name='pokemon_name',
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.RunPython(migrate_old_option, noop),
        migrations.RemoveField(
            model_name='squarechoice',
            name='option',
        ),
    ]
