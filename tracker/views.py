from django.db.models import Q
from rest_framework import generics
from .insert_shift import shift_entries_for_insert
from .models import DexEntry
from .serializers import DexEntrySerializer


class DexEntryListCreateView(generics.ListCreateAPIView):
    queryset = DexEntry.objects.all()
    serializer_class = DexEntrySerializer

    def perform_create(self, serializer):
        vd = serializer.validated_data
        shift_entries_for_insert(
            vd["section"],
            vd["box"],
            vd["row"],
            vd["slot"],
            vd.get("star_difficulty"),
        )
        serializer.save()

    def get_queryset(self):
        qs = DexEntry.objects.all()
        section = self.request.query_params.get('section')
        if section:
            qs = qs.filter(section=section)
        caught = self.request.query_params.get('caught')
        if caught is not None:
            qs = qs.filter(caught=caught.lower() == 'true')
        game = self.request.query_params.get('game')
        if game:
            qs = qs.filter(games__icontains=game)
        search = self.request.query_params.get('search')
        if search:
            search_q = Q(name__icontains=search)
            try:
                search_q |= Q(national_dex_number=int(search))
            except ValueError:
                pass
            qs = qs.filter(search_q)
        box = self.request.query_params.get('box')
        if box is not None:
            qs = qs.filter(box=int(box))
        return qs.order_by('box', 'row', 'slot')


class DexEntryDetailView(generics.RetrieveUpdateAPIView):
    queryset = DexEntry.objects.all()
    serializer_class = DexEntrySerializer
    http_method_names = ['get', 'patch', 'head', 'options']
