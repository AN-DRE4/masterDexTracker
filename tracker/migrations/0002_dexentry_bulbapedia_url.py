from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dexentry',
            name='bulbapedia_url',
            field=models.URLField(blank=True, max_length=512),
        ),
    ]
