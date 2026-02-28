'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoxGrid } from './components/BoxGrid';
import { EntryModal } from './components/EntryModal';
import { Filters } from './components/Filters';
import type { DexEntry } from './types';
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

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Master Dex Tracker</h1>
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
      <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </main>
  );
}
