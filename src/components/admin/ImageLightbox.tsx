'use client';

import { X } from 'lucide-react';
import { getProtectedImageUrl } from '../../lib/api';
import { formatFileBytes } from '../../lib/webp';
import {
  getCategoryLabel,
  getMealPeriodLabel,
  type ComplaintRecord,
} from '../../types/complaint';

interface ImageLightboxProps {
  item: ComplaintRecord;
  onClose: () => void;
}

export function ImageLightbox({ item, onClose }: ImageLightboxProps) {
  if (!item.imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="text-xs text-slate-600 tabular-nums">
            <strong className="font-semibold text-slate-900">
              {getMealPeriodLabel(item.mealPeriod)}
            </strong>{' '}
            · {getCategoryLabel(item.category)} · {item.incidentDate} · WebP (
            {formatFileBytes(item.imageSizeBytes)})
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-slate-950 p-2">
          <img
            src={getProtectedImageUrl(item.imageUrl) || ''}
            alt="Evidencia fotográfica en formato WebP"
            className="mx-auto max-h-[70vh] w-auto object-contain"
          />
        </div>
        <div className="px-5 py-4 text-sm text-slate-700">{item.description}</div>
      </div>
    </div>
  );
}
