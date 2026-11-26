'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Image as ImageIcon, Search, SlidersHorizontal, Square, Trash2 } from 'lucide-react';
import { bulkUpdateComplaints, getProtectedImageUrl } from '../../lib/api';
import { formatFileBytes } from '../../lib/webp';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  getCategoryLabel,
  getMealPeriodLabel,
  getPriorityLabel,
  getStatusLabel,
  MEAL_PERIODS,
  type ComplaintCategory,
  type ComplaintPriority,
  type ComplaintRecord,
  type ComplaintStatus,
} from '../../types/complaint';
import type { AdminBannerMessage } from '../../constants/admin';
import type { AdminComplaintsController } from '../../hooks/useAdminComplaints';

interface InboxSectionProps {
  controller: AdminComplaintsController;
  onOpenInspector: (item: ComplaintRecord) => void;
  onRequestDelete: (item: ComplaintRecord) => void;
  onPreviewImage: (item: ComplaintRecord) => void;
  onNotice: (message: AdminBannerMessage) => void;
}

export function InboxSection({
  controller,
  onOpenInspector,
  onRequestDelete,
  onPreviewImage,
  onNotice,
}: InboxSectionProps) {
  const queryClient = useQueryClient();

  const {
    filterDate,
    setFilterDate,
    filterMealPeriod,
    setFilterMealPeriod,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    searchQuery,
    setSearchQuery,
    complaints,
    complaintsQuery,
    hasActiveFilters,
    resetFilters,
  } = controller;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ComplaintStatus>('en_revision');
  const [bulkPriority, setBulkPriority] = useState<ComplaintPriority | ''>('');

  const bulkUpdateMutation = useMutation({
    mutationFn: async () =>
      bulkUpdateComplaints({
        ids: selectedIds,
        status: bulkStatus,
        priority: bulkPriority || undefined,
      }),
    onSuccess: async ({ updatedCount }) => {
      setSelectedIds([]);
      await queryClient.invalidateQueries({ queryKey: ['complaints'] });
      onNotice({
        type: 'ok',
        text: `${updatedCount} reclamo(s) organizados correctamente.`,
      });
    },
    onError: (err) => {
      onNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo aplicar la acción masiva.',
      });
    },
  });

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllVisible = () => {
    if (complaints.length === 0) return;
    const allVisibleSelected = complaints.every((c) => selectedIds.includes(c.id));
    setSelectedIds(allVisibleSelected ? [] : complaints.map((c) => c.id));
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setFilterMealPeriod('')}
              className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filterMealPeriod === ''
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los turnos
            </button>
            {MEAL_PERIODS.map((period) => (
              <button
                key={period.id}
                type="button"
                onClick={() => setFilterMealPeriod(period.id)}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  filterMealPeriod === period.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="date"
              aria-label="Filtrar por fecha"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 tabular-nums focus:border-emerald-700 focus:outline-none"
            />
            <select
              aria-label="Filtrar por categoría"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ComplaintCategory | '')}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="">Todas las categorías</option>
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ComplaintStatus | '')}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {COMPLAINT_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por prioridad"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as ComplaintPriority | '')}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
            >
              <option value="">Todas las prioridades</option>
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  Prioridad {p.label}
                </option>
              ))}
            </select>
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar texto, nota o dispositivo..."
                className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[40px] rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Bulk Organization Bar */}
        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
            <span className="text-xs font-semibold text-emerald-950 tabular-nums">
              {selectedIds.length} reclamo(s) seleccionado(s)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Nuevo estado en lote"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as ComplaintStatus)}
                className="min-h-[36px] rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
              >
                {COMPLAINT_STATUSES.map((st) => (
                  <option key={st.id} value={st.id}>
                    Estado: {st.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Nueva prioridad en lote"
                value={bulkPriority}
                onChange={(e) => setBulkPriority(e.target.value as ComplaintPriority | '')}
                className="min-h-[36px] rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
              >
                <option value="">Mantener prioridad</option>
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    Prioridad: {p.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => bulkUpdateMutation.mutate()}
                disabled={bulkUpdateMutation.isPending}
                className="inline-flex min-h-[36px] items-center rounded-md bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap"
              >
                {bulkUpdateMutation.isPending ? 'Aplicando...' : 'Aplicar a seleccionados'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex min-h-[36px] items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Complaints Table / List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
          <button
            type="button"
            onClick={toggleSelectAllVisible}
            className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900"
          >
            {complaints.length > 0 && complaints.every((c) => selectedIds.includes(c.id)) ? (
              <CheckSquare className="h-4 w-4 text-emerald-700" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>Seleccionar todos ({complaints.length})</span>
          </button>
          <span className="tabular-nums">Mostrando {complaints.length} registro(s)</span>
        </div>

        {complaintsQuery.isPending ? (
          <div className="divide-y divide-slate-200">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-4 px-6 py-5">
                <div className="h-16 w-24 shrink-0 rounded-md bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-48 rounded bg-slate-100" />
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
              No hay reclamos con los filtros actuales
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Prueba cambiando los filtros de fecha, estado o búsqueda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {complaints.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const protectedThumb = getProtectedImageUrl(item.imageUrl);
              return (
                <article
                  key={item.id}
                  className={`flex flex-col gap-4 px-5 py-4 transition-colors md:flex-row md:items-start md:justify-between ${
                    isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSelectRow(item.id)}
                      aria-label={`Seleccionar reclamo ${item.id}`}
                      className="mt-1 shrink-0 text-slate-400 hover:text-emerald-700"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    {protectedThumb ? (
                      <button
                        type="button"
                        onClick={() => onPreviewImage(item)}
                        className="group h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={protectedThumb}
                          alt={`Evidencia WebP del ${item.incidentDate}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
                        />
                      </button>
                    ) : (
                      <div className="flex h-20 w-28 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-400">
                        <ImageIcon className="mb-1 h-4 w-4" />
                        Sin foto
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                        <span
                          className={`font-semibold ${
                            item.status === 'resuelto'
                              ? 'text-emerald-800'
                              : item.status === 'en_revision'
                                ? 'text-sky-800'
                                : item.status === 'archivado'
                                  ? 'text-slate-500'
                                  : 'text-amber-800'
                          }`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-medium ${
                            item.priority === 'alta' ? 'text-red-700' : 'text-slate-700'
                          }`}
                        >
                          Prioridad {getPriorityLabel(item.priority)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900">
                          {getMealPeriodLabel(item.mealPeriod)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{getCategoryLabel(item.category)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.incidentDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{item.deviceLabel}</span>
                        {item.imageSizeBytes ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>WebP {formatFileBytes(item.imageSizeBytes)}</span>
                          </>
                        ) : null}
                      </div>

                      <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
                        {item.description}
                      </p>

                      {item.adminNote && (
                        <p className="mt-1.5 text-xs text-slate-600">
                          <strong className="font-semibold text-slate-800">Nota admin:</strong>{' '}
                          {item.adminNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 md:pl-4">
                    <button
                      type="button"
                      onClick={() => onOpenInspector(item)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Organizar
                    </button>

                    <button
                      type="button"
                      onClick={() => onRequestDelete(item)}
                      aria-label="Eliminar reclamo"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
