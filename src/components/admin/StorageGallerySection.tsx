'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CloudOff, FolderClosed, Images, RefreshCw, X } from 'lucide-react';
import {
  fetchStorageImages,
  getProtectedImageUrl,
  queryKeys,
  type StorageImageInfo,
} from '../../lib/api';
import { formatBytes } from '../../lib/webp';
import { getCategoryLabel, type ComplaintCategory } from '../../types/complaint';

const MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
};

interface StorageGroup {
  folder: string;
  label: string;
  images: StorageImageInfo[];
}

function formatFolderLabel(folder: string): string {
  if (!folder) return 'Sin carpeta';
  const [date, meal, category] = folder.split('/');
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  const prettyDate = dateMatch
    ? `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`
    : date;
  const mealLabel = meal ? MEAL_LABELS[meal] ?? meal : '';
  const categoryLabel = category ? getCategoryLabel(category as ComplaintCategory) : '';
  return [prettyDate, mealLabel, categoryLabel].filter(Boolean).join(' · ');
}

function groupByFolder(images: StorageImageInfo[]): StorageGroup[] {
  const groups = new Map<string, StorageGroup>();
  for (const image of images) {
    const segments = image.key.split('/');
    const folder = segments.length > 1 ? segments.slice(0, -1).join('/') : '';
    const group = groups.get(folder) ?? {
      folder,
      label: formatFolderLabel(folder),
      images: [],
    };
    group.images.push(image);
    groups.set(folder, group);
  }
  return Array.from(groups.values()).sort((a, b) => b.folder.localeCompare(a.folder));
}

export function StorageGallerySection() {
  const [selected, setSelected] = useState<StorageImageInfo | null>(null);

  const storageQuery = useQuery({
    queryKey: queryKeys.storageImages,
    queryFn: fetchStorageImages,
  });

  const images = storageQuery.data?.images ?? [];
  const configured = storageQuery.data?.configured ?? false;
  const bucket = storageQuery.data?.bucket ?? 'uploads';
  const groups = useMemo(() => groupByFolder(images), [images]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Evidencias en Neon Object Storage
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Archivos WebP del bucket privado <code className="font-mono">{bucket}</code>. Se
            muestran con acceso autenticado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 tabular-nums">
            {images.length} archivo(s)
          </span>
          <button
            type="button"
            onClick={() => void storageQuery.refetch()}
            disabled={storageQuery.isFetching}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${storageQuery.isFetching ? 'animate-spin' : ''}`}
            />
            Actualizar
          </button>
        </div>
      </div>

      {storageQuery.isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : storageQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-900">
          {storageQuery.error instanceof Error
            ? storageQuery.error.message
            : 'No se pudo consultar Neon Object Storage.'}
        </div>
      ) : !configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8">
          <div className="flex items-start gap-3">
            <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="text-sm text-amber-950">
              <p className="font-semibold">Neon Object Storage no está configurado.</p>
              <p className="mt-1 text-xs leading-relaxed">
                Faltan las variables <code className="font-mono">AWS_ACCESS_KEY_ID</code>,{' '}
                <code className="font-mono">AWS_SECRET_ACCESS_KEY</code>,{' '}
                <code className="font-mono">AWS_ENDPOINT_URL_S3</code> y{' '}
                <code className="font-mono">AWS_REGION</code>. El bucket se define en{' '}
                <code className="font-mono">NEON_OBJECT_STORAGE_BUCKET</code>.
              </p>
            </div>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <Images className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
            Todavía no hay imágenes en el bucket
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Las fotos WebP aparecerán aquí cuando los estudiantes registren reclamos con evidencia.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.folder || 'root'} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <FolderClosed className="h-4 w-4 text-emerald-700" />
                  <h3 className="font-display text-sm font-semibold text-slate-900">
                    {group.label}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <code className="font-mono text-[11px] text-slate-500">
                    {group.folder ? `${bucket}/${group.folder}` : bucket}
                  </code>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {group.images.length} archivo(s)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {group.images.map((image) => (
                  <button
                    key={image.key}
                    type="button"
                    onClick={() => setSelected(image)}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-4/3 w-full overflow-hidden bg-slate-100">
                      <img
                        src={getProtectedImageUrl(image.url) || ''}
                        alt={`Evidencia ${image.key}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-1 px-3 py-2.5">
                      <p className="truncate font-mono text-[11px] font-medium text-slate-800">
                        {image.key.split('/').pop()}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {formatBytes(image.size)}
                        {image.lastModified
                          ? ` · ${new Date(image.lastModified).toLocaleDateString('es-ES')}`
                          : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-semibold text-slate-900">
                  {selected.key}
                </p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {formatBytes(selected.size)}
                  {selected.lastModified
                    ? ` · ${new Date(selected.lastModified).toLocaleString('es-ES')}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cerrar vista previa"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-slate-950 p-2">
              <img
                src={getProtectedImageUrl(selected.url) || ''}
                alt={`Vista previa de ${selected.key}`}
                className="mx-auto max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
