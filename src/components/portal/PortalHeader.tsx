"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import type {
  PortalViewMode,
  StudentSubTab,
} from "@/constants/portal-types";

type PortalHeaderProps = {
  viewMode: PortalViewMode;
  studentTab: StudentSubTab;
  isAdminAuthenticated: boolean;
  onGoStudent: (tab: StudentSubTab) => void;
  onToggleAdmin: () => void;
};

export function PortalHeader({
  viewMode,
  studentTab,
  isAdminAuthenticated,
  onGoStudent,
  onToggleAdmin,
}: PortalHeaderProps) {
  const navClass = (active: boolean) =>
    `border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
      active
        ? "border-emerald-700 text-slate-900"
        : "border-transparent hover:text-slate-900"
    }`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
        {/* Zona 1: Marca */}
        <button
          type="button"
          onClick={() => onGoStudent("nuevo")}
          className="inline-flex items-center gap-3 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-700"
        >
          <Image
            src="/logo_comedor.jpg"
            alt="Logo Comedor Universitario UNAS"
            width={160}
            height={160}
            className="h-11 w-11 rounded-xl object-contain bg-white ring-1 ring-slate-200"
            priority
          />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Comedor Universitario
          </span>
        </button>

        {/* Zona 2: Navegación */}
        <nav className="flex items-center gap-6 overflow-x-auto text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onGoStudent("nuevo")}
            className={navClass(
              viewMode === "student" && studentTab === "nuevo",
            )}
          >
            Nuevo Reclamo
          </button>
          <button
            type="button"
            onClick={() => onGoStudent("guia")}
            className={navClass(
              viewMode === "student" && studentTab === "guia",
            )}
          >
            Horarios y Límite
          </button>
        </nav>

        {/* Zona 3: Acceso admin */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleAdmin}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Lock className="h-3.5 w-3.5" />
            {viewMode === "admin"
              ? "Formulario Estudiantil"
              : isAdminAuthenticated
                ? "Ir al Panel Admin"
                : "Acceso Admin"}
          </button>
        </div>
      </div>
    </header>
  );
}
