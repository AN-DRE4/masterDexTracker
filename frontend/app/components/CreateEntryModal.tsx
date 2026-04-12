'use client';

import { useEffect, useState } from 'react';
import type { DexEntry, SectionKey } from '@/app/types';
import { SECTION_LABELS } from '@/app/types';
import { createEntry, type DexEntryCreate } from '@/app/lib/api';

const SECTION_KEYS: SectionKey[] = [
  'living_dex',
  'gender_forms',
  'stars',
  'shiny_living_dex',
  'shiny_gender_forms',
];

function defaultsFromInitial(initial: Partial<DexEntry>): DexEntryCreate {
  return {
    box: initial.box ?? 1,
    row: initial.row ?? 1,
    slot: initial.slot ?? 1,
    national_dex_number: initial.national_dex_number ?? 0,
    name: initial.name ?? '',
    bulbapedia_url: initial.bulbapedia_url ?? '',
    image_url: initial.image_url ?? '',
    games: initial.games ?? '',
    notes: initial.notes ?? '',
    caught: initial.caught ?? false,
    section: initial.section ?? 'living_dex',
    sort_order: initial.sort_order ?? 0,
    star_difficulty: initial.star_difficulty ?? null,
  };
}

interface CreateEntryModalProps {
  open: boolean;
  initial: Partial<DexEntry>;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateEntryModal({ open, initial, onClose, onCreated }: CreateEntryModalProps) {
  const [form, setForm] = useState<DexEntryCreate>(() => defaultsFromInitial({}));
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(defaultsFromInitial(initial));
    setLocalError(null);
  }, [open, initial]);

  if (!open) return null;

  const requiredOk =
    form.name.trim() !== '' &&
    form.section &&
    form.box > 0 &&
    form.row > 0 &&
    form.slot > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!requiredOk) {
      setLocalError('Box, row, slot, name, and section are required.');
      return;
    }
    setSaving(true);
    try {
      await createEntry({
        ...form,
        name: form.name.trim(),
        bulbapedia_url: form.bulbapedia_url?.trim() ?? '',
        image_url: form.image_url?.trim() ?? '',
        games: form.games ?? '',
        notes: form.notes ?? '',
        star_difficulty: form.star_difficulty?.trim() ? form.star_difficulty.trim() : null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add new entry"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Add new entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {localError && <p className="text-red-600 text-sm mb-3">{localError}</p>}
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <p className="text-slate-500 text-xs">
            Required: box, row, slot, name, section. All other fields are optional.
          </p>
          <label className="block">
            <span className="text-slate-500 block mb-0.5">Name *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <label className="block">
            <span className="text-slate-500 block mb-0.5">Bulbapedia URL</span>
            <input
              type="url"
              value={form.bulbapedia_url}
              onChange={(e) => setForm((f) => ({ ...f, bulbapedia_url: e.target.value }))}
              placeholder="https://bulbapedia.bulbagarden.net/wiki/…"
              className="w-full border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <label className="block">
            <span className="text-slate-500 block mb-0.5">National #</span>
            <input
              type="number"
              value={form.national_dex_number === 0 ? '' : form.national_dex_number}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  national_dex_number: v === '' ? 0 : parseInt(v, 10) || 0,
                }));
              }}
              className="w-full border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Box *</span>
              <input
                type="number"
                min={1}
                value={form.box || ''}
                onChange={(e) => setForm((f) => ({ ...f, box: parseInt(e.target.value, 10) || 0 }))}
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Row *</span>
              <input
                type="number"
                min={1}
                value={form.row || ''}
                onChange={(e) => setForm((f) => ({ ...f, row: parseInt(e.target.value, 10) || 0 }))}
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
            <label className="block">
              <span className="text-slate-500 block mb-0.5">Slot *</span>
              <input
                type="number"
                min={1}
                value={form.slot || ''}
                onChange={(e) => setForm((f) => ({ ...f, slot: parseInt(e.target.value, 10) || 0 }))}
                className="w-full border border-slate-300 rounded px-2 py-1"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-slate-500 block mb-0.5">Image URL</span>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className="w-full border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <label className="block">
            <span className="text-slate-500 block mb-0.5">Games</span>
            <input
              type="text"
              value={form.games}
              onChange={(e) => setForm((f) => ({ ...f, games: e.target.value }))}
              className="w-full border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <label className="block">
            <span className="text-slate-500 block mb-0.5">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full border border-slate-300 rounded px-2 py-1"
            />
          </label>
          <label className="block">
            <span className="text-slate-500 block mb-0.5">Section *</span>
            <select
              value={form.section}
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
            <span className="text-slate-500 block mb-0.5">Sort order</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
              }
              className="w-full border border-slate-300 rounded px-2 py-1"
            />
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
              checked={form.caught}
              onChange={(e) => setForm((f) => ({ ...f, caught: e.target.checked }))}
              className="rounded"
            />
            <span className="text-slate-600">Caught</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || !requiredOk}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create entry'}
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
