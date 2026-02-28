"""
Resolve Pokémon Database (pokemondb.net) sprite URLs for DexEntry names.
Prefers Pokémon HOME sprites when available; falls back to most recent games (Gen 9 > Gen 8 > …).
See: https://pokemondb.net/sprites
"""
import re
import urllib.request
import urllib.error

# Sprite source priority: HOME first, then most recent game (Gen 9 → Gen 8 → …).
# Each entry: (folder, subpath) → URL is https://img.pokemondb.net/sprites/{folder}/{subpath}/{slug}.png
SPRITE_SOURCES = [
    ("home", "normal/2x"),
    ("scarlet-violet", "normal"),
    ("scarlet-violet", "icon"),
    ("sword-shield", "normal"),
    ("sword-shield", "icon"),
    ("lets-go-pikachu-lets-go-eevee", "normal"),
    ("sun-moon", "normal"),
    ("omega-ruby-alpha-sapphire", "normal"),
    ("x-y", "normal"),
    ("black-white", "animated"),
    ("black-white", "normal"),
    ("heartgold-soulsilver", "normal"),
    ("platinum", "normal"),
    ("diamond-pearl", "normal"),
]

BASE_URL = "https://img.pokemondb.net/sprites"

# Form name in entry → suffix for slug (as used on Pokémon DB sprite pages)
FORM_SUFFIXES = [
    (r"\s*\(alola\)\s*$", "-alola"),
    (r"\s*\(galar\)\s*$", "-galar"),
    (r"\s*\(hisui\)\s*$", "-hisui"),
    (r"\s*\(paldea\)\s*$", ""),  # default form often no suffix
    (r"\s*\(alola cap\)\s*$", "-alola-cap"),
    (r"\s*\(original cap\)\s*$", "-original-cap"),
    (r"\s*\(partner cap\)\s*$", "-partner-cap"),
    (r"\s*\(world cap\)\s*$", "-world-cap"),
    (r"\s*\(female\)\s*$", "-female"),
    (r"\s*\(male\)\s*$", "-male"),
    (r"^alolan\s+", ""),  # "Alolan Vulpix" → base "vulpix" + we add -alola
    (r"^galarian\s+", ""),
    (r"^hisuian\s+", ""),
]

# Display name → exact slug on Pokémon DB (for special characters / apostrophes)
NAME_TO_SLUG_OVERRIDES = {
    "farfetch'd": "farfetchd",
    "sirfetch'd": "sirfetchd",
    "mr. mime": "mr-mime",
    "mr. rime": "mr-rime",
    "mime jr.": "mime-jr",
    "mime jr": "mime-jr",
    "ho-oh": "ho-oh",
    "ho oh": "ho-oh",
    "porygon-z": "porygon-z",
    "porygon z": "porygon-z",
    "nidoran♀": "nidoran-f",
    "nidoran♂": "nidoran-m",
    "type: null": "type-null",
    "type null": "type-null",
    "flabébé": "flabebe",
    "flabebe": "flabebe",
    "jangmo-o": "jangmo-o",
    "hakamo-o": "hakamo-o",
    "kommo-o": "kommo-o",
    "tapu koko": "tapu-koko",
    "tapu lele": "tapu-lele",
    "tapu bulu": "tapu-bulu",
    "tapu fini": "tapu-fini",
    "great tusk": "great-tusk",
    "scream tail": "scream-tail",
    "brute bonnet": "brute-bonnet",
    "flutter mane": "flutter-mane",
    "slither wing": "slither-wing",
    "sandy shocks": "sandy-shocks",
    "iron treads": "iron-treads",
    "iron bundle": "iron-bundle",
    "iron hands": "iron-hands",
    "iron jugulis": "iron-jugulis",
    "iron moth": "iron-moth",
    "iron thorns": "iron-thorns",
    "iron valiant": "iron-valiant",
    "iron leaves": "iron-leaves",
    "iron boulder": "iron-boulder",
    "iron crown": "iron-crown",
    "roaring moon": "roaring-moon",
    "walking wake": "walking-wake",
    "wo-chien": "wo-chien",
    "chien-pao": "chien-pao",
    "ting-lu": "ting-lu",
    "chi-yu": "chi-yu",
    "gouging fire": "gouging-fire",
    "raging bolt": "raging-bolt",
}


def _normalize_for_slug(s: str) -> str:
    """Lowercase, collapse spaces, remove apostrophes/dots for slug matching."""
    if not s:
        return ""
    s = s.lower().strip()
    s = s.replace("'", "").replace(".", "").replace(":", " ")
    s = re.sub(r"\s+", " ", s)
    return s


def name_to_slug(entry_name: str) -> str:
    """
    Convert a DexEntry name (e.g. 'Vulpix (Alola)', 'Mr. Mime') to the slug used
    on Pokémon Database sprite URLs (e.g. 'vulpix-alola', 'mr-mime').
    """
    if not entry_name or not entry_name.strip():
        return ""
    raw = entry_name.strip()
    normalized = _normalize_for_slug(raw)

    # Check overrides first (e.g. "Mr. Mime" -> "mr-mime")
    if normalized in NAME_TO_SLUG_OVERRIDES:
        return NAME_TO_SLUG_OVERRIDES[normalized]

    form_suffix = ""
    base = normalized

    # Strip form in parentheses and map to suffix
    for pattern, suffix in FORM_SUFFIXES:
        m = re.search(pattern, base, re.IGNORECASE)
        if m:
            base = base[: m.start()].strip()
            if suffix:
                form_suffix = suffix
            break

    # Regional prefix: "alolan vulpix" -> base "vulpix", suffix "-alola"
    if re.match(r"^alolan\s+", base):
        base = re.sub(r"^alolan\s+", "", base, flags=re.I)
        form_suffix = form_suffix or "-alola"
    if re.match(r"^galarian\s+", base):
        base = re.sub(r"^galarian\s+", "", base, flags=re.I)
        form_suffix = form_suffix or "-galar"
    if re.match(r"^hisuian\s+", base):
        base = re.sub(r"^hisuian\s+", "", base, flags=re.I)
        form_suffix = form_suffix or "-hisui"

    # Base slug: spaces and specials to hyphen
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    if not base:
        return ""
    slug = base + form_suffix
    return slug


def _url_exists(url: str, timeout: int = 8) -> bool:
    """Return True if the URL returns 200 (HEAD or GET)."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "MasterDexTracker/1.0 (Sprite populator)")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status == 200
    except (urllib.error.HTTPError, urllib.error.URLError, OSError):
        try:
            req = urllib.request.Request(url)
            req.add_header("User-Agent", "MasterDexTracker/1.0 (Sprite populator)")
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status == 200
        except (urllib.error.HTTPError, urllib.error.URLError, OSError):
            return False


def get_sprite_url(entry_name: str, prefer_home: bool = True) -> str:
    """
    Resolve the best sprite URL for a DexEntry name from Pokémon Database.
    Prefers Pokémon HOME when it matches the entry; otherwise uses the most
    recent available source (Gen 9 > Gen 8 > …). Returns empty string if none found.
    """
    slug = name_to_slug(entry_name)
    if not slug:
        return ""

    sources = list(SPRITE_SOURCES)
    if not prefer_home:
        sources = [s for s in sources if s[0] != "home"] + [("home", "normal/2x")]

    # HOME and some others use .jpg; others may use .png
    for folder, subpath in sources:
        for ext in ("jpg", "png"):
            url = f"{BASE_URL}/{folder}/{subpath}/{slug}.{ext}"
            if _url_exists(url):
                return url

    return ""
