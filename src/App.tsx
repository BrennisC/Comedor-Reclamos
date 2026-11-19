"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Camera, Lock, ShieldCheck, Utensils } from "lucide-react";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLoginView } from "./components/AdminLoginView";
import { ComplaintForm } from "./components/ComplaintForm";
import {
  fetchAdminSession,
  fetchQuota,
  logoutAdmin,
  queryKeys,
} from "./lib/api";
import { COMPLAINT_CATEGORIES, MEAL_PERIODS } from "./types/complaint";
import Image from "next/image";

type PortalViewMode = "student" | "admin";
type StudentSubTab = "nuevo" | "guia";

export default function App() {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<PortalViewMode>("student");
  const [studentTab, setStudentTab] = useState<StudentSubTab>("nuevo");

  const quotaQuery = useQuery({
    queryKey: queryKeys.quota,
    queryFn: fetchQuota,
    enabled: viewMode === "student",
  });

  const adminSessionQuery = useQuery({
    queryKey: queryKeys.adminSession,
    queryFn: fetchAdminSession,
  });

  useEffect(() => {
    const isAdminUrl =
      window.location.hash === "#admin" ||
      new URLSearchParams(window.location.search).get("panel") === "admin";
    if (isAdminUrl) {
      setViewMode("admin");
    }
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        setViewMode("admin");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateToMode = (nextMode: PortalViewMode) => {
    setViewMode(nextMode);
    if (typeof window !== "undefined") {
      if (nextMode === "admin") {
        if (window.location.hash !== "#admin") {
          window.history.replaceState(null, "", "#admin");
        }
      } else if (window.location.hash === "#admin") {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    queryClient.removeQueries({ queryKey: ["complaints"] });
    queryClient.removeQueries({ queryKey: queryKeys.adminUsers });
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminSession });
    navigateToMode("student");
  };

  const adminSession = adminSessionQuery.data;
  const isAdminAuthenticated = Boolean(adminSession?.authenticated);

  // Authenticated Admin Workspace (Full Dashboard)
  if (viewMode === "admin" && isAdminAuthenticated && adminSession) {
    return (
      <AdminDashboard
        sessionState={adminSession}
        onLogoutAdmin={() => void handleAdminLogout()}
        onOpenStudentPortal={() => {
          setStudentTab("nuevo");
          navigateToMode("student");
        }}
      />
    );
  }

  const quota = quotaQuery.data;
  const usedToday = quota?.usedToday ?? 0;
  const limit = quota?.limit ?? 3;
  const remaining = quota?.remaining ?? 3;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: strictly 3 zones separated by gap-8 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Brand */}
          <button
            type="button"
            onClick={() => {
              setStudentTab("nuevo");
              navigateToMode("student");
            }}
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

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="flex items-center gap-6 overflow-x-auto text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setStudentTab("nuevo");
                navigateToMode("student");
              }}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === "student" && studentTab === "nuevo"
                  ? "border-emerald-700 text-slate-900"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Nuevo Reclamo
            </button>
            <button
              type="button"
              onClick={() => {
                setStudentTab("guia");
                navigateToMode("student");
              }}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === "student" && studentTab === "guia"
                  ? "border-emerald-700 text-slate-900"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Horarios y Límite
            </button>
          </nav>

          {/* Zone 3: 1 primary action (Admin access / login) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() =>
                navigateToMode(viewMode === "admin" ? "student" : "admin")
              }
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

      {/* Cabecera de Límite Diario (visible solo en la vista pública de estudiantes) */}
      {viewMode === "student" && (
        <div className="border-b border-slate-200 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>Máximo 3 reclamos por día por dispositivo</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums">
              <div
                className="flex items-center gap-1.5"
                aria-label={`Uso diario: ${usedToday} de ${limit}`}
              >
                {[0, 1, 2].map((slot) => (
                  <span
                    key={slot}
                    className={`h-2 w-6 rounded-sm transition-colors ${
                      slot < usedToday
                        ? remaining === 0
                          ? "bg-red-600"
                          : "bg-emerald-700"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span>
                Hoy:{" "}
                <strong className="font-semibold text-slate-900">
                  {usedToday} / {limit}
                </strong>
                {" · "}
                <span
                  className={
                    remaining === 0
                      ? "font-semibold text-red-700"
                      : "font-medium text-emerald-800"
                  }
                >
                  {remaining === 0
                    ? "Límite diario completo"
                    : `Quedan ${remaining} disponibles`}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {viewMode === "admin" ? (
          <AdminLoginView
            sessionState={adminSession}
            isCheckingSession={adminSessionQuery.isPending}
            onLoginSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: queryKeys.adminSession,
              });
              navigateToMode("admin");
            }}
            onBackToStudentPortal={() => {
              setStudentTab("nuevo");
              navigateToMode("student");
            }}
          />
        ) : studentTab === "nuevo" ? (
          <ComplaintForm quota={quota} />
        ) : (
          <div className="mx-auto max-w-4xl space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-5">
                <h1 className="font-display text-xl font-semibold text-slate-900">
                  Cómo enviar tu reclamo en el Comedor Universitario
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Información sobre turnos de atención, límite diario por
                  dispositivo y captura fotográfica.
                </p>
              </div>
              <div className="px-6 py-5 text-sm text-slate-600">
                Aquí podés consultar los turnos del comedor y las categorías
                disponibles para clasificar tu reclamo.
              </div>
            </section>

            {/* Meal Schedules & Categories Reference */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
                  <Utensils className="h-4 w-4 text-emerald-700" />
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    Turnos del Comedor Universitario
                  </h2>
                </div>
                <ul className="divide-y divide-slate-200 px-5">
                  {MEAL_PERIODS.map((period) => (
                    <li
                      key={period.id}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <span className="font-medium text-slate-900">
                        {period.label}
                      </span>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {period.schedule}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
                  <Calendar className="h-4 w-4 text-emerald-700" />
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    Categorías disponibles
                  </h2>
                </div>
                <ul className="divide-y divide-slate-200 px-5">
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <li key={cat.id} className="py-2.5">
                      <p className="text-xs font-semibold text-slate-900">
                        {cat.label}
                      </p>
                      <p className="text-xs text-slate-500">{cat.hint}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs text-slate-500">
          <span>
            Comedor Universitario · Portal estudiantil de atención alimentaria
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setStudentTab("nuevo");
                navigateToMode("student");
              }}
              className="hover:text-slate-900"
            >
              Registrar reclamo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
