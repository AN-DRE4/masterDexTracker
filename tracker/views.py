import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import SquareChoice
from .pokemon_data import get_pokemon_list, get_pokemon_by_dex


@ensure_csrf_cookie
def index(request):
    pokemon_list = get_pokemon_list()
    choices_query = SquareChoice.objects.filter(square_id__in=[p["dex"] for p in pokemon_list])
    choices = {}
    for row in choices_query:
        choices[row.square_id] = {
            "option_1": row.option_1,
            "option_2": row.option_2,
            "option_3": row.option_3,
        }
    return render(request, 'tracker/index.html', {
        'pokemon_list': pokemon_list,
        'choices_json': json.dumps(choices),
    })


@require_http_methods(['POST'])
def save_choice(request):
    try:
        data = json.loads(request.body)
        square_id = int(data.get('square_id'))
        option_1 = bool(data.get('option_1', False))
        option_2 = bool(data.get('option_2', False))
        option_3 = bool(data.get('option_3', False))
    except (json.JSONDecodeError, TypeError, ValueError):
        return JsonResponse({'ok': False, 'error': 'Invalid payload'}, status=400)
    if not 1 <= square_id <= 151:
        return JsonResponse({'ok': False, 'error': 'Invalid dex number'}, status=400)
    name, _ = get_pokemon_by_dex(square_id)
    pokemon_name = name or ""
    SquareChoice.objects.update_or_create(
        square_id=square_id,
        defaults={
            'pokemon_name': pokemon_name,
            'option_1': option_1,
            'option_2': option_2,
            'option_3': option_3,
        },
    )
    return JsonResponse({'ok': True})
