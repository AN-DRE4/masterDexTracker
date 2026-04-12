"""Insert-at-position: shift existing DexEntry coordinates within the same section."""

from django.db import transaction
from django.db.models import Q

from .models import DexEntry

# Pokémon Home–style box: 6 rows × 5 slots (30 cells per box)
MAX_ROW = 5
MAX_SLOT = 6


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


@transaction.atomic
def shift_entries_for_insert(section: str, box: int, row: int, slot: int) -> None:
    """
    Every entry in `section` at (box, row, slot) or later in (box, row, slot) order
    moves forward by one cell, carrying overflow to the next row and then the next box
    starting at row 1, slot 1.

    Other sections are untouched (each section has its own coordinate space).
    """
    qs = (
        DexEntry.objects.select_for_update()
        .filter(section=section)
        .filter(
            Q(box__gt=box)
            | Q(box=box, row__gt=row)
            | Q(box=box, row=row, slot__gte=slot)
        )
        .order_by("-box", "-row", "-slot")
    )
    entries = list(qs)
    for e in entries:
        e.box, e.row, e.slot = advance_coordinates(e.box, e.row, e.slot)
    if entries:
        DexEntry.objects.bulk_update(entries, ["box", "row", "slot"])
