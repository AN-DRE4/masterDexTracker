from django.contrib import admin
from .models import Pokemon, SquareChoice


@admin.register(Pokemon)
class PokemonAdmin(admin.ModelAdmin):
    list_display = ('dex', 'name', 'generation')
    ordering = ('dex',)


@admin.register(SquareChoice)
class SquareChoiceAdmin(admin.ModelAdmin):
    list_display = ('square_id', 'pokemon_name', 'generation', 'updated_at')
    ordering = ('square_id',)
