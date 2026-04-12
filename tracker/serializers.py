from rest_framework import serializers
from .models import DexEntry


class DexEntrySerializer(serializers.ModelSerializer):
    """Create: only box, row, slot, name, and section are required; other fields have defaults."""

    national_dex_number = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = DexEntry
        fields = [
            'id', 'box', 'row', 'slot', 'national_dex_number', 'name',
            'bulbapedia_url', 'image_url', 'games', 'notes', 'caught', 'section',
            'sort_order', 'star_difficulty',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'bulbapedia_url': {'required': False, 'allow_blank': True},
            'image_url': {'required': False, 'allow_blank': True},
            'games': {'required': False, 'allow_blank': True},
            'notes': {'required': False, 'allow_blank': True},
            'caught': {'required': False},
            'sort_order': {'required': False},
            'star_difficulty': {'required': False, 'allow_null': True, 'allow_blank': True},
        }
