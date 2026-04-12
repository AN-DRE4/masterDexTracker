'use client';

import { useEffect, useState } from 'react';
import type { DexEntry } from '@/app/types';
import type { SectionKey } from '@/app/types';
import { SECTION_LABELS } from '@/app/types';
import type { DexEntryUpdate } from '@/app/lib/api';

interface EntryModalProps {
  entry: DexEntry | null;
  editMode: boolean;
  onClose: () => void;
  onSave: (data: DexEntryUpdate) => Promise<void>;
}

const SECTION_KEYS: SectionKey[] = [
  'living_dex',
  'gender_forms',
  'stars',
  'shiny_living_dex',
  'shiny_gender_forms',
];

export function EntryModal({ entry, editMode, onClose, onSave }: EntryModalProps) {
  const [form, setForm] = useState<DexEntryUpdate>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({
        box: entry.box,
        row: entry.row,
        slot: entry.slot,
        national_dex_number: entry.national_dex_number,
        name: entry.name,
        bulbapedia_url: entry.bulbapedia_url,
        image_url: entry.image_url,
        games: entry.games,
        notes: entry.notes,
        caught: entry.caught,
        section: entry.section,
        star_difficulty: entry.star_difficulty,
      });
    }
  }, [entry]);

  if (!entry) return null;

  const sectionLabel = SECTION_LABELS[entry.section as keyof typeof SECTION_LABELS] ?? entry.section;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  if (editMode) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Edit entry"
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">Edit entry</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Name</span>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Bulbapedia URL</span>
              <input
                type="url"
                value={form.bulbapedia_url ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, bulbapedia_url: e.target.value }))}
                placeholder="https://bulbapedia.bulbagarden.net/wiki/…"
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">National #</span>
              <input
                type="number"
                value={form.national_dex_number ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, national_dex_number: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-slate-500 block mb-0.5">Box</span>
                <input
                  type="number"
                  min={1}
                  value={form.box ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, box: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full border border-slate-300 rounded px-2 py-1"
                />
              </label>
              <label className="block">
                <span className="text-slate-500 block mb-0.5">Row</span>
                <input
                  type="number"
                  min={1}
                  value={form.row ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, row: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full border border-slate-300 rounded px-2 py-1"
                />
              </label>
              <label className="block">
                <span className="text-slate-500 block mb-0.5">Slot</span>
                <input
                  type="number"
                  min={1}
                  value={form.slot ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, slot: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full border border-slate-300 rounded px-2 py-1"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Image URL</span>
              <input
                type="url"
                value={form.image_url ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Games</span>
              <input
                type="text"
                value={form.games ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, games: e.target.value }))}
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Notes</span>
              <textarea
                value={form.notes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Section</span>
              <select
                value={form.section ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value as SectionKey }))}
                className="w-full border border-slate-300 rounded px-2 py-1"
              >
                {SECTION_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {SECTION_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Star / Challenge</span>
              <input
                type="text"
                value={form.star_difficulty ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, star_difficulty: e.target.value || null }))
                }
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.caught ?? false}
                onChange={(e) => setForm((f) => ({ ...f, caught: e.target.checked }))}
                className="rounded"
              />
              <span className="text-slate-600">Caught</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Entry details"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{entry.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {entry.image_url && (
          <div className="flex justify-center mb-4">
            <img
              src={entry.image_url}
              alt={entry.name}
              className="w-24 h-24 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <dl className="space-y-2 text-sm">
          {entry.bulbapedia_url?.trim() ? (
            <div>
              <dt className="text-slate-500">Bulbapedia</dt>
              <dd>
                <a
                  href={entry.bulbapedia_url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  Open on Bulbapedia (new tab)
                </a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-slate-500">Place in</dt>
            <dd>Box {entry.box}, Row {entry.row}, Slot {entry.slot}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Section</dt>
            <dd>{sectionLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Games</dt>
            <dd>{entry.games || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Notes</dt>
            <dd className="whitespace-pre-wrap">{entry.notes || '—'}</dd>
          </div>
          {entry.star_difficulty && (
            <div>
              <dt className="text-slate-500">Star / Challenge</dt>
              <dd>{entry.star_difficulty}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
