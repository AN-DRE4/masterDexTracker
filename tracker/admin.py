from django.contrib import admin
from .models import DexEntry


@admin.register(DexEntry)
class DexEntryAdmin(admin.ModelAdmin):
    list_display = ('name', 'box', 'row', 'slot', 'section', 'caught', 'national_dex_number')
    list_filter = ('section', 'caught')
    search_fields = ('name', 'notes', 'games')
