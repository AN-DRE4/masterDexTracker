import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import SquareChoice

GRID_ROWS = 10
GRID_COLS = 10


@ensure_csrf_cookie
def index(request):
    choices = {
        row.square_id: row.option
        for row in SquareChoice.objects.all()
    }
    total = GRID_ROWS * GRID_COLS
    return render(request, 'tracker/index.html', {
        'rows': GRID_ROWS,
        'cols': GRID_COLS,
        'grid_squares': range(total),
        'choices_json': json.dumps(choices),
    })


@require_http_methods(['POST'])
def save_choice(request):
    try:
        data = json.loads(request.body)
        square_id = int(data.get('square_id'))
        option = int(data.get('option'))
    except (json.JSONDecodeError, TypeError, ValueError):
        return JsonResponse({'ok': False, 'error': 'Invalid payload'}, status=400)
    if option not in (1, 2, 3):
        return JsonResponse({'ok': False, 'error': 'Option must be 1, 2, or 3'}, status=400)
    total = GRID_ROWS * GRID_COLS
    if not 0 <= square_id < total:
        return JsonResponse({'ok': False, 'error': 'Invalid square_id'}, status=400)
    obj, _ = SquareChoice.objects.update_or_create(
        square_id=square_id,
        defaults={'option': option},
    )
    return JsonResponse({'ok': True})
