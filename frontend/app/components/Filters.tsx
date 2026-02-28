'use client';

import { SECTION_LABELS } from '@/app/types';
import type { SectionKey } from '@/app/types';

interface FiltersProps {
  section: string;
  caughtFilter: string;
  search: string;
  game: string;
  onSectionChange: (v: string) => void;
  onCaughtFilterChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onGameChange: (v: string) => void;
  boxNumbers: number[];
  selectedBox: number;
  onBoxChange: (v: number) => void;
}

export function Filters({
  section,
  caughtFilter,
  search,
  game,
  onSectionChange,
  onCaughtFilterChange,
  onSearchChange,
  onGameChange,
  boxNumbers,
  selectedBox,
  onBoxChange,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-4 p-4 bg-white rounded-lg border border-slate-200">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Section</span>
        <select
          value={section}
          onChange={(e) => onSectionChange(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All</option>
          {(Object.entries(SECTION_LABELS) as [SectionKey, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Box</span>
        <div className="flex items-center gap-1 border border-slate-300 rounded overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => {
              const idx = boxNumbers.indexOf(selectedBox);
              if (idx > 0) onBoxChange(boxNumbers[idx - 1]!);
            }}
            disabled={!boxNumbers.length || selectedBox === boxNumbers[0]}
            className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous box"
          >
            ←
          </button>
          <select
            value={selectedBox}
            onChange={(e) => onBoxChange(Number(e.target.value))}
            className="border-0 rounded-none py-1 pr-2 pl-1 text-sm bg-transparent min-w-[4.5rem]"
          >
            {boxNumbers.length ? (
              boxNumbers.map((n) => (
                <option key={n} value={n}>
                  Box {n}
                </option>
              ))
            ) : (
              <option value={1}>Box 1</option>
            )}
          </select>
          <button
            type="button"
            onClick={() => {
              const idx = boxNumbers.indexOf(selectedBox);
              if (idx >= 0 && idx < boxNumbers.length - 1) onBoxChange(boxNumbers[idx + 1]!);
            }}
            disabled={!boxNumbers.length || selectedBox === boxNumbers[boxNumbers.length - 1]}
            className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next box"
          >
            →
          </button>
        </div>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Caught</span>
        <select
          value={caughtFilter}
          onChange={(e) => onCaughtFilterChange(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All</option>
          <option value="true">Caught</option>
          <option value="false">Not caught</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Game</span>
        <input
          type="text"
          value={game}
          onChange={(e) => onGameChange(e.target.value)}
          placeholder="Game name"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-28"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Name or #"
          className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
        />
      </label>
    </div>
  );
}
