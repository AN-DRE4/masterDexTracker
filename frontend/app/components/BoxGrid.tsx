'use client';

import type { DexEntry } from '@/app/types';

// Display: 6 columns × 5 rows (data has row 1–6, slot 1–5; we transpose so slot = display row, row = display col)
const COLS = 6;
const ROWS = 5;

function buildGrid(entries: DexEntry[]): (DexEntry | null)[][] {
  const grid: (DexEntry | null)[][] = [];
  for (let displayRow = 1; displayRow <= ROWS; displayRow++) {
    const row: (DexEntry | null)[] = [];
    for (let displayCol = 1; displayCol <= COLS; displayCol++) {
      // display row = slot (1–5), display col = row (1–6)
      const entry = entries.find((e) => e.row === displayRow && e.slot === displayCol);
      row.push(entry ?? null);
    }
    grid.push(row);
  }
  return grid;
}

interface BoxGridProps {
  entries: DexEntry[];
  onSelectEntry: (entry: DexEntry) => void;
  onToggleCaught: (entry: DexEntry) => void;
}

export function BoxGrid({ entries, onSelectEntry, onToggleCaught }: BoxGridProps) {
  const grid = buildGrid(entries);
  return (
    <div
      className="grid gap-2 p-2 bg-slate-200 rounded-lg"
      style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
    >
      {grid.map((row, ri) =>
        row.map((entry, si) => (
          <div
            key={entry ? entry.id : `empty-${ri}-${si}`}
            className="bg-white rounded border border-slate-300 overflow-hidden flex flex-col items-center justify-center min-h-[100px] aspect-square"
          >
            {entry ? (
              <>
                <button
                  type="button"
                  className="w-full h-full flex flex-col items-center justify-center p-1 hover:bg-slate-50"
                  onClick={() => onSelectEntry(entry)}
                  title={entry.notes?.trim() || undefined}
                >
                  {entry.image_url ? (
                    <img
                      src={entry.image_url}
                      alt={entry.name}
                      className="w-14 h-14 object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-2xl text-slate-400">?</span>
                  )}
                  <span className="text-xs font-medium truncate w-full text-center mt-0.5">
                    {entry.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onToggleCaught(entry);
                  }}
                  className={`w-full py-1 text-xs font-medium ${
                    entry.caught
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {entry.caught ? 'Caught' : 'Mark caught'}
                </button>
              </>
            ) : (
              <span className="text-slate-300 text-sm">—</span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
