'use client';

import type { DexEntry } from '@/app/types';
import { SECTION_LABELS } from '@/app/types';

interface EntryModalProps {
  entry: DexEntry | null;
  onClose: () => void;
}

export function EntryModal({ entry, onClose }: EntryModalProps) {
  if (!entry) return null;
  const sectionLabel = SECTION_LABELS[entry.section as keyof typeof SECTION_LABELS] ?? entry.section;
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
