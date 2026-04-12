from rest_framework import serializers
from .models import DexEntry


class DexEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DexEntry
        fields = [
            'id', 'box', 'row', 'slot', 'national_dex_number', 'name',
            'bulbapedia_url', 'image_url', 'games', 'notes', 'caught', 'section',
            'sort_order', 'star_difficulty',
        ]
        read_only_fields = ['id']
