import { Calendar, Camera, ShieldCheck, Utensils } from "lucide-react";
import { COMPLAINT_CATEGORIES, MEAL_PERIODS } from "@/types/complaint";

const GUIDE_CARDS = [
  {
    icon: ShieldCheck,
    title: "Límite diario por dispositivo",
    body: (
      <>
        Puedes registrar hasta{" "}
        <strong className="font-semibold text-slate-900">
          3 reclamos por día
        </strong>{" "}
        desde el mismo dispositivo, sin iniciar sesión.
      </>
    ),
  },
  {
    icon: Camera,
    title: "Evidencia fotográfica opcional",
    body: (
      <>
        Puedes adjuntar o tomar una foto para respaldar tu reclamo. La evidencia
        es opcional y ayuda a una mejor revisión.
      </>
    ),
  },
  {
    icon: Calendar,
    title: "Detalle claro del incidente",
    body: (
      <>
        Indica turno, fecha, categoría y una descripción con el contexto
        necesario para facilitar la atención del caso.
      </>
    ),
  },
];

function GuideHero() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 px-6 py-7 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
          Guía para estudiantes
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Cómo registrar tu reclamo en el Comedor Universitario
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/90">
          Revisa los turnos de atención, las categorías disponibles y las
          condiciones para enviar tu reporte de forma clara y útil.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
        {GUIDE_CARDS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MealPeriodsCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-2">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Utensils className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Turnos del comedor
          </h2>
          <p className="text-xs text-slate-500">Horarios de atención</p>
        </div>
      </div>
      <ul className="divide-y divide-slate-200">
        {MEAL_PERIODS.map((period) => (
          <li
            key={period.id}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {period.label}
              </p>
              <p className="text-xs text-slate-500">Servicio regular</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-medium text-slate-700 tabular-nums">
              {period.schedule}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoriesCard() {
  return (
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
            <p className="text-sm font-semibold text-slate-900">{cat.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {cat.hint}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StudentGuide() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <GuideHero />
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <MealPeriodsCard />
        <CategoriesCard />
      </section>
    </div>
  );
}
