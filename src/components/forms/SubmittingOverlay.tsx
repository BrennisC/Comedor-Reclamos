import { Loader2 } from "lucide-react";

export function SubmittingOverlay() {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 px-6 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Enviando reclamo"
    >
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">
        <Loader2
          className="h-10 w-10 animate-spin text-emerald-700"
          aria-hidden="true"
        />
        <p className="mt-4 text-base font-semibold text-slate-900">
          Enviando tu reclamo
        </p>
        <p className="mt-1 text-center text-sm text-slate-600">
          Estamos registrando la información y la evidencia. Espera un
          momento...
        </p>
      </div>
    </div>
  );
}
