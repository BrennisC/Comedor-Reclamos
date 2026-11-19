'use client';

import Image from 'next/image';
import { BarChart3, Images, Inbox, LayoutDashboard, LogOut, Users } from 'lucide-react';
import type { AdminSection } from '../../constants/admin';

interface AdminSidebarProps {
  activeSection: AdminSection;
  pendingCount: number;
  adminName: string;
  adminEmail: string;
  onSelectSection: (section: AdminSection) => void;
  onOpenStudentPortal: () => void;
  onLogoutAdmin: () => void;
}

const NAV_ITEMS = [
  { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard },
  { id: 'bandeja', label: 'Bandeja y Gestión', icon: Inbox },
  { id: 'reportes', label: 'Reportes por Día', icon: BarChart3 },
  { id: 'storage', label: 'Evidencias', icon: Images },
  { id: 'admins', label: 'Administradores', icon: Users },
] as const;

export function AdminSidebar({
  activeSection,
  pendingCount,
  adminName,
  adminEmail,
  onSelectSection,
  onOpenStudentPortal,
  onLogoutAdmin,
}: AdminSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col justify-between border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div>
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_comedor.jpg"
              alt="Logo Comedor Universitario UNAS"
              width={96}
              height={96}
              className="h-10 w-10 shrink-0 rounded-lg object-contain bg-white ring-1 ring-slate-200"
            />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold leading-tight tracking-tight text-slate-900">
                Comedor Universitario
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800">
                Panel administrativo
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Consola de supervisión</p>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
          {NAV_ITEMS.map((nav) => {
            const Icon = nav.icon;
            const active = activeSection === nav.id;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => onSelectSection(nav.id)}
                className={`flex min-h-[40px] items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-emerald-50 text-emerald-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  />
                  <span>{nav.label}</span>
                </span>
                {nav.id === 'bandeja' && pendingCount > 0 && (
                  <span className="font-mono text-xs font-semibold text-emerald-800 tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden border-t border-slate-200 p-4 lg:block">
        <p className="truncate text-sm font-semibold text-slate-900">
          {adminName || 'Administrador'}
        </p>
        <p className="truncate text-xs text-slate-500">{adminEmail || ''}</p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenStudentPortal}
            className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
          >
            Ver vista de estudiante
          </button>
          <button
            type="button"
            onClick={onLogoutAdmin}
            className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
