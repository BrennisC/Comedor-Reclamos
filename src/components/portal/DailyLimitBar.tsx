import { ShieldCheck } from "lucide-react";

type DailyLimitBarProps = {
  usedToday: number;
  limit: number;
  remaining: number;
};

export function DailyLimitBar({
  usedToday,
  limit,
  remaining,
}: DailyLimitBarProps) {
  return (
    <div className="border-b border-slate-200 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-2.5 text-sm text-slate-700">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
          <span>Máximo {limit} reclamos por día por dispositivo</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums">
          <div
            className="flex items-center gap-1.5"
            aria-label={`Uso diario: ${usedToday} de ${limit}`}
          >
            {Array.from({ length: limit }, (_, slot) => (
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
  );
}
