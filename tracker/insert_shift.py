"""Insert-at-position: shift DexEntry coordinates before creating a new row."""

from __future__ import annotations

from django.db import transaction

from .models import DexEntry

# Pokémon Home–style box: 6 rows × 5 slots (30 cells per box)
MAX_ROW = 5
MAX_SLOT = 6


def normalize_star_difficulty(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def advance_coordinates(box: int, row: int, slot: int) -> tuple[int, int, int]:
    """One step to the next cell: slot → … → next row → next box (row 1, slot 1 on new box)."""
    slot += 1
    if slot > MAX_SLOT:
        slot = 1
        row += 1
        if row > MAX_ROW:
            row = 1
            box += 1
    return box, row, slot


def _pos(entry: DexEntry) -> tuple[int, int, int]:
    return (entry.box, entry.row, entry.slot)


def _lex_ge(a: tuple[int, int, int], b: tuple[int, int, int]) -> bool:
    return a >= b


def _occupant_at(
    entries: list[DexEntry],
    cell: tuple[int, int, int],
    *,
    exclude: DexEntry | None = None,
) -> DexEntry | None:
    for e in entries:
        if exclude is not None and e is exclude:
            continue
        if _pos(e) == cell:
            return e
    return None


def _occupancy(entries: list[DexEntry]) -> dict[tuple[int, int, int], list[DexEntry]]:
    occ: dict[tuple[int, int, int], list[DexEntry]] = {}
    for e in entries:
        occ.setdefault(_pos(e), []).append(e)
    return occ


def _find_duplicate_cell(entries: list[DexEntry]) -> tuple[int, int, int] | None:
    occ = _occupancy(entries)
    for pos, lst in sorted(occ.items()):
        if len(lst) > 1:
            return pos
    return None


def _global_push_one_box_over(entries: list[DexEntry], cell: tuple[int, int, int]) -> None:
    """
    Every Pokémon at or after ``cell`` (globally, any section/star_difficulty) moves +1 box,
    same row/slot. Highest positions first.
    """
    movers = [e for e in entries if _lex_ge(_pos(e), cell)]
    movers.sort(key=lambda e: (-e.box, -e.row, -e.slot, -e.pk))
    for e in movers:
        e.box += 1


def _resolve_duplicates(entries: list[DexEntry], max_passes: int = 256) -> None:
    """Advance global tail one step at a time until positions are unique."""
    for _ in range(max_passes):
        dup = _find_duplicate_cell(entries)
        if dup is None:
            return
        movers = [e for e in entries if _lex_ge(_pos(e), dup)]
        movers.sort(key=lambda e: (-e.box, -e.row, -e.slot, -e.pk))
        for e in movers:
            e.box, e.row, e.slot = advance_coordinates(e.box, e.row, e.slot)
    dup = _find_duplicate_cell(entries)
    if dup is not None:
        raise RuntimeError(f"Could not resolve duplicate positions after shifts (cell={dup}).")


@transaction.atomic
def shift_entries_for_insert(
    section: str,
    box: int,
    row: int,
    slot: int,
    star_difficulty: str | None = None,
) -> None:
    """
    Shift existing entries before inserting at (box, row, slot).

    If ``star_difficulty`` is non-empty, only entries in the same ``section`` with that same
    ``star_difficulty`` and at or after the insert position move.

    If ``star_difficulty`` is null/empty, every entry in ``section`` at or after the insert
    position moves.

    If a shifted Pokémon would land on an occupied cell, all Pokémon at or after that cell
    (globally) are pushed one box forward (+1 box); duplicate cells are then fixed by advancing
    the affected tail one slot at a time.
    """
    star = normalize_star_difficulty(star_difficulty)

    entries = list(DexEntry.objects.select_for_update().order_by("pk"))
    initial = {e.pk: (e.box, e.row, e.slot) for e in entries if e.pk is not None}

    insert_pos = (box, row, slot)

    ripple: list[DexEntry] = []
    for e in entries:
        if e.section != section:
            continue
        if star is not None and normalize_star_difficulty(e.star_difficulty) != star:
            continue
        if _lex_ge(_pos(e), insert_pos):
            ripple.append(e)

    ripple.sort(
        key=lambda e: (-initial[e.pk][0], -initial[e.pk][1], -initial[e.pk][2], -e.pk)
    )

    original_coords = {e.pk: initial[e.pk] for e in ripple}

    for e in ripple:
        ob, orow, oslot = original_coords[e.pk]
        nb, nr, ns = advance_coordinates(ob, orow, oslot)
        guard = 0
        while True:
            guard += 1
            if guard > 10000:
                raise RuntimeError("Shift exceeded iteration limit (possible cycle).")
            occ = _occupant_at(entries, (nb, nr, ns), exclude=e)
            if occ is None:
                e.box, e.row, e.slot = nb, nr, ns
                break
            _global_push_one_box_over(entries, (nb, nr, ns))
            _resolve_duplicates(entries)

    _resolve_duplicates(entries)

    changed = [
        e
        for e in entries
        if e.pk is not None and _pos(e) != initial[e.pk]
    ]
    if changed:
        DexEntry.objects.bulk_update(changed, ["box", "row", "slot"])
