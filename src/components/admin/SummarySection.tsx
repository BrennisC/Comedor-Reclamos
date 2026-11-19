'use client';

import { CheckCircle2, SlidersHorizontal } from 'lucide-react';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  getCategoryLabel,
  getMealPeriodLabel,
  getPriorityLabel,
  MEAL_PERIODS,
  type ComplaintRecord,
  type ComplaintsSummary,
} from '../../types/complaint';

interface SummarySectionProps {
  summary: ComplaintsSummary;
  urgentQueue: ComplaintRecord[];
  isPending: boolean;
  onOpenInbox: () => void;
  onOpenInspector: (item: ComplaintRecord) => void;
}

export function SummarySection({
  summary,
  urgentQueue,
  isPending,
  onOpenInbox,
  onOpenInspector,
}: SummarySectionProps) {
  const resolutionRate =
    summary.total > 0
      ? Math.round(
          ((summary.byStatus.resuelto + summary.byStatus.archivado) / summary.total) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Total de reclamos</p>
          <p className="mt-1.5 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {summary.total}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {summary.withPhotos} con evidencia
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Pendientes por atender</p>
          <p className="mt-1.5 font-display text-3xl font-bold text-amber-700 tabular-nums">
            {summary.byStatus.pendiente}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {summary.byStatus.en_revision} en revisión · {summary.byPriority.alta} prioridad alta
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Tasa de resolución</p>
          <p className="mt-1.5 font-display text-3xl font-bold text-emerald-800 tabular-nums">
            {resolutionRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {summary.byStatus.resuelto} resueltos · {summary.byStatus.archivado} archivados
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Evidencias almacenadas</p>
          <p className="mt-1.5 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {summary.withPhotos}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Fotografías
          </p>
        </div>
      </div>

      {/* Analytics Breakdown: Categories & Meal Periods */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Reclamos por categoría
            </h2>
            <p className="text-xs text-slate-500">
              Distribución clasificada para detectar incidencias recurrentes
            </p>
          </div>
          <div className="space-y-4 p-6">
            {COMPLAINT_CATEGORIES.map((cat) => {
              const count = summary.byCategory[cat.id] || 0;
              const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{cat.label}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-slate-100">
                    <div
                      className="h-full bg-emerald-700 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white lg:col-span-5">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Turnos y estados operativos
            </h2>
            <p className="text-xs text-slate-500">Volumen por franja horaria y seguimiento</p>
          </div>
          <div className="divide-y divide-slate-200 px-6">
            <div className="py-4">
              <p className="text-xs font-medium text-slate-500">Por turno del comedor</p>
              <div className="mt-3 space-y-2.5">
                {MEAL_PERIODS.map((period) => {
                  const count = summary.byMealPeriod[period.id] || 0;
                  const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <div key={period.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {period.label}{' '}
                        <span className="text-xs text-slate-400 tabular-nums">
                          ({period.schedule})
                        </span>
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {count} · {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="py-4">
              <p className="text-xs font-medium text-slate-500">Por estado de gestión</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs tabular-nums">
                {COMPLAINT_STATUSES.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-slate-700">{st.label}</span>
                    <strong className="font-mono text-slate-900">
                      {summary.byStatus[st.id] || 0}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Priority Queue to Organize */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Cola prioritaria por atender
            </h2>
            <p className="text-xs text-slate-500">
              Reclamos pendientes o en revisión ordenados por prioridad
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInbox}
            className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
          >
            Abrir bandeja completa
          </button>
        </div>

        {isPending ? (
          <div className="space-y-3 p-6">
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-12 rounded-lg bg-slate-100" />
          </div>
        ) : urgentQueue.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
            <p className="mt-2 text-sm font-medium text-slate-900">
              {summary.total === 0
                ? 'Aún no hay reclamos registrados en el sistema'
                : 'No quedan reclamos pendientes por revisar'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cuando los estudiantes registren nuevos reclamos aparecerán aquí para organizarlos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {urgentQueue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 px-6 py-4 hover:bg-slate-50/70 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                    <span
                      className={`font-semibold ${
                        item.priority === 'alta'
                          ? 'text-red-700'
                          : item.priority === 'media'
                            ? 'text-amber-700'
                            : 'text-slate-700'
                      }`}
                    >
                      Prioridad {getPriorityLabel(item.priority)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-900">
                      {getMealPeriodLabel(item.mealPeriod)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{getCategoryLabel(item.category)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.incidentDate}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-800">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenInspector(item)}
                  className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Organizar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
