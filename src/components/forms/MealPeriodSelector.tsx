import { MEAL_PERIODS, type MealPeriod } from "@/types/complaint";

interface MealPeriodSelectorProps {
  value: MealPeriod;
  onChange: (value: MealPeriod) => void;
}

export function MealPeriodSelector({
  value,
  onChange,
}: MealPeriodSelectorProps) {
  return (
    <div>
      <span className="block text-sm font-medium text-slate-800">
        Turno del comedor
      </span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {MEAL_PERIODS.map((period) => {
          const active = value === period.id;
          return (
            <button
              key={period.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(period.id)}
              className={`flex min-h-[56px] flex-col items-start justify-center rounded-lg border px-3.5 py-2 text-left transition-colors ${
                active
                  ? "border-emerald-700 bg-emerald-50/70 text-emerald-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-semibold whitespace-nowrap">
                {period.label}
              </span>
              <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                {period.schedule}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
