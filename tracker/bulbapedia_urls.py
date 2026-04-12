"""Build Bulbapedia species article URLs from display names (base form for regional variants)."""
import re
from urllib.parse import quote

BULBAPEDIA_WIKI_BASE = 'https://bulbapedia.bulbagarden.net/wiki'


def original_species_name_for_bulbapedia(display_name: str) -> str:
    """
    Map a dex display name to the base species for the main Bulbapedia article,
    e.g. 'Galarian Meowth' -> 'Meowth', 'Alolan Vulpix' -> 'Vulpix'.
    """
    s = (display_name or '').strip()
    if not s:
        return s

    s = re.sub(r'\s*\([^)]*\)\s*$', '', s).strip()

    s = re.sub(r'^(Galarian|Alolan|Hisuian|Paldean)\s+', '', s, flags=re.IGNORECASE).strip()

    if re.match(r'^Mega\s+', s, re.IGNORECASE):
        s = re.sub(r'^Mega\s+', '', s, flags=re.IGNORECASE).strip()
        s = re.sub(r'\s+(X|Y)$', '', s, flags=re.IGNORECASE).strip()

    s = re.sub(r'^Primal\s+', '', s, flags=re.IGNORECASE).strip()

    return s or (display_name or '').strip()


def bulbapedia_species_url(display_name: str) -> str:
    """Full URL for {Species}_(Pokémon) article."""
    base = original_species_name_for_bulbapedia(display_name)
    if not base:
        return ''
    wiki_title = re.sub(r'\s+', '_', base.strip()) + '_(Pokémon)'
    return f'{BULBAPEDIA_WIKI_BASE}/{quote(wiki_title, safe="")}'
