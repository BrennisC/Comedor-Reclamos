import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormFeedbackProps {
  errorMessage: string | null;
  successId: string | null;
  onDismissSuccess: () => void;
}

export function FormFeedback({
  errorMessage,
  successId,
  onDismissSuccess,
}: FormFeedbackProps) {
  return (
    <>
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successId && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium">
                Tu reclamo fue enviado correctamente al equipo del comedor.
              </p>
              <p className="text-xs text-emerald-800">
                Código de seguimiento:{" "}
                <span className="font-mono">{successId}</span> · Quedó
                registrado en el turno y fecha indicados.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissSuccess}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
          >
            Entendido
          </button>
        </div>
      )}
    </>
  );
}
