from django.db import models


class SquareChoice(models.Model):
    """
    One row per Pokémon (square_id = National Dex number).
    Stores which of the three options are picked (multiple allowed) and the Pokémon name.
    """

    square_id = models.PositiveIntegerField(unique=True)  # Pokémon dex number
    pokemon_name = models.CharField(max_length=64, blank=True)
    option_1 = models.BooleanField(default=False)
    option_2 = models.BooleanField(default=False)
    option_3 = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['square_id']
