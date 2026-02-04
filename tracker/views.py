import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import SquareChoice, Pokemon
from .pokemon_data import get_pokemon_list, get_pokemon_by_dex, SPRITE_BASE_URL


def get_pokemon_list_for_view():
    """Return list of dicts from DB (dex, name, slug, sprite_url, generation); fallback to pokemon_data if empty."""
    qs = Pokemon.objects.all().order_by('dex')
    if qs.exists():
        return [
            {
                "dex": p.dex,
                "name": p.name,
                "slug": p.slug,
                "sprite_url": f"{SPRITE_BASE_URL}/{p.slug}.jpg",
                "generation": p.generation,
            }
            for p in qs
        ]
    # Fallback when Pokemon table not yet seeded
    return [
        {"dex": d["dex"], "name": d["name"], "slug": d["slug"], "sprite_url": d["sprite_url"], "generation": 1}
        for d in get_pokemon_list()
    ]


@ensure_csrf_cookie
def index(request):
    pokemon_list = get_pokemon_list_for_view()
    dex_list = [p["dex"] for p in pokemon_list]
    choices_query = SquareChoice.objects.filter(square_id__in=dex_list)
    choices = {}
    for row in choices_query:
        opts = row.available_options if isinstance(row.available_options, list) else []
        defs = getattr(row, 'option_definitions', None) or []
        if not isinstance(defs, list):
            defs = []
        # Backward compat: if no definitions, derive from old available_options format
        if not defs and opts and isinstance(opts[0], dict):
            defs = []
            ids = []
            for item in opts:
                if isinstance(item, dict):
                    for k, v in item.items():
                        defs.append({"id": k, "label": v if isinstance(v, str) else k})
                        ids.append(k)
                        break
            opts = ids
        if opts and isinstance(opts[0], str):
            selected_ids = opts
        elif defs:
            selected_ids = [d["id"] for d in defs if isinstance(d, dict) and d.get("id")]
        else:
            selected_ids = []
        choices[row.square_id] = {
            "option_definitions": defs,
            "available_options": selected_ids,
        }
    generations = sorted(set(p.get("generation", 1) for p in pokemon_list))
    if not generations:
        generations = [1]
    return render(request, 'tracker/index.html', {
        'pokemon_list': pokemon_list,
        'pokemon_list_json': json.dumps(pokemon_list),
        'choices_json': json.dumps(choices),
        'generations': generations,
    })


def _normalize_available_options(available_options):
    """Accept list of ids (strings) or legacy list of {key: label}; return list of ids."""
    if not available_options or not isinstance(available_options, list):
        return []
    first = available_options[0]
    if isinstance(first, str):
        return [x for x in available_options if isinstance(x, str)]
    if isinstance(first, dict):
        ids = []
        for item in available_options:
            if isinstance(item, dict):
                for k in item:
                    ids.append(k)
                    break
        return ids
    return []


@require_http_methods(['POST'])
def save_choice(request):
    try:
        data = json.loads(request.body)
        square_id = int(data.get('square_id'))
        available_options = data.get('available_options', [])
        option_definitions = data.get('option_definitions')
        generation = int(data.get('generation', 1))
    except (json.JSONDecodeError, TypeError, ValueError):
        return JsonResponse({'ok': False, 'error': 'Invalid payload'}, status=400)
    if not isinstance(available_options, list):
        return JsonResponse({'ok': False, 'error': 'available_options must be a list'}, status=400)
    ids = _normalize_available_options(available_options)
    defs = option_definitions if isinstance(option_definitions, list) else None
    try:
        p = Pokemon.objects.get(dex=square_id)
        pokemon_name = p.name
        generation = p.generation
    except Pokemon.DoesNotExist:
        name, _ = get_pokemon_by_dex(square_id)
        pokemon_name = name or ""
    defaults = {
        'pokemon_name': pokemon_name,
        'generation': generation,
        'available_options': ids,
    }
    if defs is not None:
        defaults['option_definitions'] = [
            x for x in defs
            if isinstance(x, dict) and isinstance(x.get('id'), str) and isinstance(x.get('label'), str)
        ]
    SquareChoice.objects.update_or_create(square_id=square_id, defaults=defaults)
    return JsonResponse({'ok': True})


@require_http_methods(['POST'])
def add_pokemon(request):
    """Create a new Pokemon (and optional SquareChoice) from the frontend. All columns required."""
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({'ok': False, 'error': 'Invalid JSON'}, status=400)

    dex_raw = data.get('dex')
    name = (data.get('name') or '').strip()
    slug = (data.get('slug') or '').strip()
    generation_raw = data.get('generation')
    available_options = data.get('available_options', [])

    errors = []
    if dex_raw is None or dex_raw == '':
        errors.append('dex is required')
    else:
        try:
            dex = int(dex_raw)
            if dex < 1:
                errors.append('dex must be a positive integer')
        except (TypeError, ValueError):
            errors.append('dex must be a number')

    if not name:
        errors.append('name is required')
    if not slug:
        errors.append('slug is required')
    if generation_raw is None or generation_raw == '':
        errors.append('generation is required')
    else:
        try:
            generation = int(generation_raw)
            if generation < 1 or generation > 9:
                errors.append('generation must be between 1 and 9')
        except (TypeError, ValueError):
            errors.append('generation must be a number')

    if errors:
        return JsonResponse({'ok': False, 'error': '; '.join(errors)}, status=400)

    dex = int(dex_raw)
    generation = int(generation_raw)
    if not isinstance(available_options, list):
        available_options = []
    option_definitions = data.get('option_definitions')
    if isinstance(option_definitions, list) and option_definitions:
        defs = [
            x for x in option_definitions
            if isinstance(x, dict) and isinstance(x.get('id'), str) and isinstance(x.get('label'), str)
        ]
        ids = _normalize_available_options(available_options)
    else:
        defs = []
        ids = _normalize_available_options(available_options)
        if not ids and available_options and isinstance(available_options[0], dict):
            for item in available_options:
                if isinstance(item, dict):
                    for k, v in item.items():
                        defs.append({'id': k, 'label': v if isinstance(v, str) else k})
                        ids.append(k)
                        break

    if Pokemon.objects.filter(dex=dex).exists():
        return JsonResponse({'ok': False, 'error': f'A Pokémon with dex #{dex} already exists'}, status=400)

    Pokemon.objects.create(dex=dex, name=name, slug=slug, generation=generation)
    SquareChoice.objects.update_or_create(
        square_id=dex,
        defaults={
            'pokemon_name': name,
            'generation': generation,
            'option_definitions': defs,
            'available_options': ids,
        },
    )
    return JsonResponse({
        'ok': True,
        'pokemon': {'dex': dex, 'name': name, 'slug': slug, 'generation': generation},
    }, status=201)
