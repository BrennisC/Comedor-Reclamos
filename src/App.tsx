"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Calendar, Camera, Lock, ShieldCheck, Utensils } from "lucide-react";
import Image from "next/image";
import { ComplaintForm } from "./components/ComplaintForm";
import { fetchQuota, queryKeys } from "./lib/api";
import {
  COMPLAINT_CATEGORIES,
  MEAL_PERIODS,
  SUNDAY_HOLIDAY_MEAL_PERIODS,
} from "./types/complaint";

type StudentSubTab = "nuevo" | "guia";

export default function App() {
  const router = useRouter();
  const [studentTab, setStudentTab] = useState<StudentSubTab>("nuevo");

  useEffect(() => {
    if (window.location.hash === "#admin") {
      router.replace("/admin");
    }
  }, [router]);

  const quotaQuery = useQuery({
    queryKey: queryKeys.quota,
    queryFn: fetchQuota,
  });

  const quota = quotaQuery.data;
  const usedToday = quota?.usedToday ?? 0;
  const limit = quota?.limit ?? 3;
  const remaining = quota?.remaining ?? 3;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:gap-8 sm:px-6">
          <button
            type="button"
            onClick={() => setStudentTab("nuevo")}
            className="inline-flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            <Image
              src="/logo_comedor.jpg"
              alt="Logo Comedor Universitario UNAS"
              width={160}
              height={160}
              className="h-11 w-11 rounded-xl bg-white object-contain ring-1 ring-slate-200"
              priority
            />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Comedor Universitario
            </span>
          </button>

          <nav className="order-3 flex w-full items-center gap-6 overflow-x-auto text-sm font-medium text-slate-600 sm:order-none sm:w-auto">
            <button
              type="button"
              onClick={() => setStudentTab("nuevo")}
              className={`shrink-0 whitespace-nowrap border-b-2 py-1 transition-colors ${
                studentTab === "nuevo"
                  ? "border-emerald-700 text-slate-900"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Nuevo Reclamo
            </button>
            <button
              type="button"
              onClick={() => setStudentTab("guia")}
              className={`shrink-0 whitespace-nowrap border-b-2 py-1 transition-colors ${
                studentTab === "guia"
                  ? "border-emerald-700 text-slate-900"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              Horarios y Límite
            </button>
          </nav>

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <Lock className="h-3.5 w-3.5" />
              Acceso Admin
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>Máximo 3 reclamos por día por dispositivo</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 tabular-nums">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {studentTab === "nuevo" ? (
          <ComplaintForm quota={quota} />
        ) : (
          <div className="mx-auto max-w-5xl space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 px-2 py-4 sm:px-8">
                <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Guía para estudiantes: Pasos para presentar un reclamo en el
                  Comedor Universitario.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/90">
                  Revisa los turnos de atención, las categorías disponibles y
                  las condiciones para enviar tu reporte de forma clara y útil.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-slate-900">
                    Límite diario por dispositivo
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Puedes registrar hasta{" "}
                    <strong className="font-semibold text-slate-900">
                      3 reclamos por día
                    </strong>{" "}
                    desde el mismo dispositivo, sin iniciar sesión.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Camera className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-slate-900">
                    Evidencia fotográfica opcional
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Puedes adjuntar o tomar una foto para respaldar tu reclamo.
                    La evidencia es opcional y ayuda a una mejor revisión.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-sm font-semibold text-slate-900">
                    Detalle claro del incidente
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Indica turno, fecha, categoría y una descripción con el
                    contexto necesario para facilitar la atención del caso.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-2">
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold text-slate-900">
                      Turnos del comedor
                    </h2>
                    <p className="text-xs text-slate-500">
                      Horarios de atención
                    </p>
                  </div>
                </div>
                {[
                  { title: "Lunes a sábado", periods: MEAL_PERIODS },
                  {
                    title: "Domingos y feriados",
                    periods: SUNDAY_HOLIDAY_MEAL_PERIODS,
                  },
                ].map(({ title, periods }) => (
                  <div key={title} className="border-b border-slate-200 last:border-b-0">
                    <p className="bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {title}
                    </p>
                    <ul className="divide-y divide-slate-200">
                      {periods.map((period) => (
                        <li
                          key={`${title}-${period.id}`}
                          className="flex items-center justify-between gap-4 px-5 py-3"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {period.label}
                          </p>
                          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-medium text-slate-700 tabular-nums">
                            {period.schedule}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-3">
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold text-slate-900">
                      Categorías para clasificar tu reclamo
                    </h2>
                    <p className="text-xs text-slate-500">
                      Selecciona la opción que mejor describa la situación
                    </p>
                  </div>
                </div>
                <ul className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-slate-200">
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <li key={cat.id} className="bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {cat.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {cat.hint}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-slate-500 sm:px-6">
          <span>Comedor Universitario · Portal de Reclamos</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="hover:text-slate-900"
            >
              Administración
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
