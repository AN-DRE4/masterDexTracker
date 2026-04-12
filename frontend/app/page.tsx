'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoxGrid } from './components/BoxGrid';
import { CreateEntryModal } from './components/CreateEntryModal';
import { EntryModal } from './components/EntryModal';
import { Filters } from './components/Filters';
import type { DexEntry, SectionKey } from './types';
import { fetchEntries, patchEntry } from './lib/api';

export default function Home() {
  const [entries, setEntries] = useState<DexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState('');
  const [caughtFilter, setCaughtFilter] = useState('');
  const [search, setSearch] = useState('');
  const [game, setGame] = useState('');
  const [selectedBox, setSelectedBox] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<DexEntry | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitial, setCreateInitial] = useState<Partial<DexEntry>>({});

  const listParams = useMemo(() => {
    const p: Parameters<typeof fetchEntries>[0] = {};
    if (section) p.section = section;
    if (caughtFilter === 'true') p.caught = true;
    if (caughtFilter === 'false') p.caught = false;
    if (game.trim()) p.game = game.trim();
    if (search.trim()) p.search = search.trim();
    return p;
  }, [section, caughtFilter, game, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries(listParams);
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [listParams]);

  useEffect(() => {
    load();
  }, [load]);

  const boxNumbers = useMemo(() => {
    const boxes = new Set<number>();
    entries.forEach((e) => boxes.add(e.box));
    const arr = Array.from(boxes).sort((a, b) => a - b);
    return arr.length ? arr : [1];
  }, [entries]);

  const gridEntries = useMemo(
    () => entries.filter((e) => e.box === selectedBox),
    [entries, selectedBox]
  );

  useEffect(() => {
    if (entries.length === 0 && !loading) return;
    const boxes = new Set(entries.map((e) => e.box));
    const sorted = Array.from(boxes).sort((a, b) => a - b);
    if (sorted.length && !sorted.includes(selectedBox)) {
      setSelectedBox(sorted[0]);
    }
  }, [entries, loading, selectedBox]);

  const handleToggleCaught = useCallback(
    async (entry: DexEntry) => {
      try {
        const updated = await patchEntry(entry.id, { caught: !entry.caught });
        setEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
      } catch {
        setError('Failed to update');
      }
    },
    []
  );

  const handleSaveEntry = useCallback(
    async (payload: Parameters<typeof patchEntry>[1]) => {
      if (!selectedEntry) return;
      try {
        const updated = await patchEntry(selectedEntry.id, payload);
        setEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
        setSelectedEntry(null);
      } catch {
        setError('Failed to update entry');
      }
    },
    [selectedEntry]
  );

  const openCreateBlank = useCallback(() => {
    const sec = (section || 'living_dex') as SectionKey;
    setCreateInitial({
      box: selectedBox,
      row: 1,
      slot: 1,
      section: sec,
      name: '',
      national_dex_number: 0,
    });
    setCreateOpen(true);
  }, [section, selectedBox]);

  const handleCreateAdjacent = useCallback((from: DexEntry) => {
    setSelectedEntry(null);
    setCreateInitial({
      box: from.box,
      row: from.row,
      slot: from.slot + 1,
      section: from.section,
      name: '',
      national_dex_number: 0,
      sort_order: from.sort_order,
    });
    setCreateOpen(true);
  }, []);

  const handleEntryCreated = useCallback(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Master Dex Tracker</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {editMode ? (
            <button
              type="button"
              onClick={openCreateBlank}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-emerald-500 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
            >
              Add a new entry
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setEditMode((prev) => !prev)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              editMode
                ? 'bg-amber-100 border-amber-400 text-amber-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {editMode ? 'Edit mode on' : 'Edit mode'}
          </button>
        </div>
      </div>
      <Filters
        section={section}
        caughtFilter={caughtFilter}
        search={search}
        game={game}
        onSectionChange={setSection}
        onCaughtFilterChange={setCaughtFilter}
        onSearchChange={setSearch}
        onGameChange={setGame}
        boxNumbers={boxNumbers}
        selectedBox={selectedBox}
        onBoxChange={setSelectedBox}
      />
      {error && (
        <p className="text-red-600 text-sm mb-2">{error}</p>
      )}
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <BoxGrid
          entries={gridEntries}
          onSelectEntry={setSelectedEntry}
          onToggleCaught={handleToggleCaught}
        />
      )}
      <EntryModal
        entry={selectedEntry}
        editMode={editMode}
        onClose={() => setSelectedEntry(null)}
        onSave={handleSaveEntry}
        onCreateAdjacent={editMode ? handleCreateAdjacent : undefined}
      />
      <CreateEntryModal
        open={createOpen}
        initial={createInitial}
        onClose={() => setCreateOpen(false)}
        onCreated={handleEntryCreated}
      />
    </main>
  );
}
