"use client";

import Image from "next/image";
import {
  BarChart3,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Users,
  X,
} from "lucide-react";
import type { AdminSection } from "@/constants/admin";

interface AdminSidebarProps {
  activeSection: AdminSection;
  pendingCount: number;
  adminName: string;
  adminEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: AdminSection) => void;
  onOpenStudentPortal: () => void;
  onLogoutAdmin: () => void;
}

const NAV_ITEMS = [
  { id: "resumen", label: "Resumen General", icon: LayoutDashboard },
  { id: "bandeja", label: "Bandeja y Gestión", icon: Inbox },
  { id: "reportes", label: "Reportes por Día", icon: BarChart3 },
  { id: "storage", label: "Evidencias", icon: Images },
  { id: "admins", label: "Administradores", icon: Users },
] as const;

export function AdminSidebar({
  activeSection,
  pendingCount,
  adminName,
  adminEmail,
  isOpen,
  onClose,
  onSelectSection,
  onOpenStudentPortal,
  onLogoutAdmin,
}: AdminSidebarProps) {
  const handleSelect = (section: AdminSection) => {
    onSelectSection(section);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col justify-between border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:overflow-y-auto lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menú de administración"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/logo_comedor.jpg"
                  alt="Logo Comedor Universitario UNAS"
                  width={96}
                  height={96}
                  className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain ring-1 ring-slate-200"
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
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Consola de supervisión
            </p>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((nav) => {
              const Icon = nav.icon;
              const active = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => handleSelect(nav.id)}
                  className={`flex min-h-[42px] w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-950"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-emerald-700" : "text-slate-400"
                      }`}
                    />
                    <span>{nav.label}</span>
                  </span>
                  {nav.id === "bandeja" && pendingCount > 0 && (
                    <span className="font-mono text-xs font-semibold text-emerald-800 tabular-nums">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-semibold text-slate-900">
            {adminName || "Administrador"}
          </p>
          <p className="truncate text-xs text-slate-500">{adminEmail || ""}</p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenStudentPortal();
                onClose();
              }}
              className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Ver vista de estudiante
            </button>
            <button
              type="button"
              onClick={() => {
                onLogoutAdmin();
                onClose();
              }}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
