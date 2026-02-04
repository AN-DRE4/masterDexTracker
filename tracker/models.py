from django.db import models


class Pokemon(models.Model):
    """Pokémon catalog: dex number, name, slug for sprites, generation."""

    dex = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=64)
    slug = models.CharField(max_length=64)
    generation = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ['dex']

    def __str__(self):
        return f"#{self.dex} {self.name}"


class SquareChoice(models.Model):
    """
    One row per Pokémon (square_id = National Dex number).
    option_definitions: list of {"id": str, "label": str} for all options this Pokémon can have.
    available_options: list of option ids that are selected/picked, e.g. ["option_1", "option_3"].
    """

    square_id = models.PositiveIntegerField(unique=True)  # Pokémon dex number
    pokemon_name = models.CharField(max_length=64, blank=True)
    generation = models.PositiveSmallIntegerField(default=1)
    option_definitions = models.JSONField(default=list)  # [{"id": "option_1", "label": "Shiny"}, ...]
    available_options = models.JSONField(default=list)  # ["option_1", "option_3"] selected ids
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['square_id']
