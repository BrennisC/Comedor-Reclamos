'use client';

import { Download, LogOut, Menu } from 'lucide-react';

interface AdminTopBarProps {
  sectionTitle: string;
  canExport: boolean;
  isExporting: boolean;
  onOpenSidebar: () => void;
  onExportPdf: () => void;
  onLogoutAdmin: () => void;
}

export function AdminTopBar({
  sectionTitle,
  canExport,
  isExporting,
  onOpenSidebar,
  onExportPdf,
  onLogoutAdmin,
}: AdminTopBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Abrir menú"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-sm">
            <span className="hidden text-slate-500 sm:inline">Panel Admin</span>
            <span className="mx-2 hidden text-slate-300 sm:inline">/</span>
            <span className="block truncate font-display font-semibold text-slate-900">
              {sectionTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onExportPdf}
            disabled={!canExport || isExporting}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap sm:px-3.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
            </span>
            <span className="sm:hidden">{isExporting ? '...' : 'PDF'}</span>
          </button>
          <button
            type="button"
            onClick={onLogoutAdmin}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 lg:hidden whitespace-nowrap sm:px-3.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
