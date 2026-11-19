'use client';

import { CalendarDays, Download } from 'lucide-react';
import type { DailyMatrixRow } from '../../hooks/useAdminComplaints';

interface ReportsSectionProps {
  dailyMatrix: DailyMatrixRow[];
  complaintsCount: number;
  isExporting: boolean;
  onExportPdf: () => void;
}

export function ReportsSection({
  dailyMatrix,
  complaintsCount,
  isExporting,
  onExportPdf,
}: ReportsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Consolidado diario por fecha y turno
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Matriz organizada automáticamente a partir de los reclamos almacenados en Neon DB.
          </p>
        </div>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={complaintsCount === 0 || isExporting}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Generando PDF...' : 'Descargar reporte PDF'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="px-5 py-3.5">Fecha de servicio</th>
              <th className="px-5 py-3.5 text-right">Desayuno</th>
              <th className="px-5 py-3.5 text-right">Almuerzo</th>
              <th className="px-5 py-3.5 text-right">Cena</th>
              <th className="px-5 py-3.5 text-right">Pendientes</th>
              <th className="px-5 py-3.5 text-right">Resueltos</th>
              <th className="px-5 py-3.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            {dailyMatrix.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                  No existen datos diarios registrados todavía.
                </td>
              </tr>
            ) : (
              dailyMatrix.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      {row.date}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-700">
                    {row.desayuno}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-700">
                    {row.almuerzo}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-700">
                    {row.cena}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-amber-700">
                    {row.pendiente}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-emerald-800">
                    {row.resuelto}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-slate-900">
                    {row.total}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
