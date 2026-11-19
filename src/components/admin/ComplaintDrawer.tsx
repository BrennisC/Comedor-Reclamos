'use client';

import { Trash2, X } from 'lucide-react';
import { getProtectedImageUrl } from '../../lib/api';
import { formatBytes } from '../../lib/webp';
import {
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  getCategoryLabel,
  getMealPeriodLabel,
  type ComplaintPriority,
  type ComplaintRecord,
  type ComplaintStatus,
} from '../../types/complaint';

interface ComplaintDrawerProps {
  item: ComplaintRecord;
  draftStatus: ComplaintStatus;
  draftPriority: ComplaintPriority;
  draftNote: string;
  isSaving: boolean;
  onChangeStatus: (status: ComplaintStatus) => void;
  onChangePriority: (priority: ComplaintPriority) => void;
  onChangeNote: (note: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ComplaintDrawer({
  item,
  draftStatus,
  draftPriority,
  draftNote,
  isSaving,
  onChangeStatus,
  onChangePriority,
  onChangeNote,
  onSave,
  onDelete,
  onClose,
}: ComplaintDrawerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Organizar reclamo
            </h3>
            <p className="font-mono text-xs text-slate-500">{item.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de organización"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-1 text-xs text-slate-600 tabular-nums">
            <p>
              <strong className="font-semibold text-slate-900">
                {getMealPeriodLabel(item.mealPeriod)}
              </strong>{' '}
              · {getCategoryLabel(item.category)} · {item.incidentDate}
            </p>
            <p className="font-mono text-slate-500">
              Dispositivo: {item.deviceLabel} · Registrado:{' '}
              {item.createdAt.slice(0, 16).replace('T', ' ')}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            {item.description}
          </div>

          {item.imageUrl && (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                <img
                  src={getProtectedImageUrl(item.imageUrl) || ''}
                  alt="Evidencia WebP almacenada en Neon Object Storage"
                  className="mx-auto max-h-60 w-auto object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                <span>
                  WebP {formatBytes(item.imageSizeBytes)} (original{' '}
                  {formatBytes(item.originalSizeBytes)})
                </span>
                <span className="font-medium text-emerald-800">Neon Object Storage</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Estado</label>
              <select
                value={draftStatus}
                onChange={(e) => onChangeStatus(e.target.value as ComplaintStatus)}
                className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              >
                {COMPLAINT_STATUSES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Prioridad</label>
              <select
                value={draftPriority}
                onChange={(e) => onChangePriority(e.target.value as ComplaintPriority)}
                className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
              >
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Nota interna / acción correctiva
            </label>
            <textarea
              rows={4}
              value={draftNote}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Registra la revisión en cocina, proveedor o medida aplicada..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
            />
            {item.reviewedBy && (
              <p className="mt-1.5 text-xs text-slate-500">
                Última revisión por {item.reviewedBy}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex min-h-[42px] items-center rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
