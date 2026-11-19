'use client';

import { Download, LogOut } from 'lucide-react';

interface AdminTopBarProps {
  sectionTitle: string;
  canExport: boolean;
  isExporting: boolean;
  onExportPdf: () => void;
  onLogoutAdmin: () => void;
}

export function AdminTopBar({
  sectionTitle,
  canExport,
  isExporting,
  onExportPdf,
  onLogoutAdmin,
}: AdminTopBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div className="text-sm">
          <span className="text-slate-500">Panel Admin</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-display font-semibold text-slate-900">{sectionTitle}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExportPdf}
            disabled={!canExport || isExporting}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
          </button>
          <button
            type="button"
            onClick={onLogoutAdmin}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 lg:hidden whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
