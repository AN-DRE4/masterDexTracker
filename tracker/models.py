from django.db import models


class DexEntry(models.Model):
    """A single slot in the Master Dex challenge tracker (box/row/slot in Pokemon Home)."""

    SECTION_CHOICES = [
        ('living_dex', 'Living Dex'),
        ('gender_forms', 'Gender Variants & Forms'),
        ('stars', 'Stars'),
        ('shiny_living_dex', 'Shiny Living Dex'),
        ('shiny_gender_forms', 'Shiny Gender Variants & Forms'),
    ]

    box = models.IntegerField()
    row = models.IntegerField()  # 1-6
    slot = models.IntegerField()  # 1-5
    national_dex_number = models.IntegerField()
    name = models.CharField(max_length=128)
    image_url = models.URLField(max_length=512, blank=True)
    games = models.CharField(max_length=256, blank=True)
    notes = models.TextField(blank=True)
    caught = models.BooleanField(default=False)
    section = models.CharField(max_length=32, choices=SECTION_CHOICES)
    sort_order = models.IntegerField(default=0)
    star_difficulty = models.CharField(max_length=64, blank=True, null=True)  # for section=stars

    class Meta:
        ordering = ['section', 'sort_order', 'box', 'row', 'slot']
        verbose_name_plural = 'Dex entries'

    def __str__(self):
        return f"{self.name} (Box {self.box} R{self.row}S{self.slot})"
