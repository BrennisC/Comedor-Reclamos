"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import type { ConvertedWebpImage } from "../lib/webp";
import {
  getDefaultMealPeriod,
  getTodayIsoDate,
  type ComplaintCategory,
  type MealPeriod,
  type QuotaStatus,
} from "../types/complaint";
import { CategorySelector } from "./forms/CategorySelector";
import { EvidenceUploader } from "./forms/EvidenceUploader";
import { FormFeedback } from "./forms/FormFeedback";
import { MealPeriodSelector } from "./forms/MealPeriodSelector";
import { SubmittingOverlay } from "./forms/SubmittingOverlay";
import { useSubmitComplaint } from "../hooks/useSubmitComplaint";

const MIN_DESCRIPTION_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 100;
const DEFAULT_LIMIT = 3;

interface ComplaintFormProps {
  quota: QuotaStatus | undefined;
}

export function ComplaintForm({ quota }: ComplaintFormProps) {
  const [mealPeriod, setMealPeriod] = useState<MealPeriod>("almuerzo");
  const [incidentDate, setIncidentDate] = useState("");
  const [todayMaxDate, setTodayMaxDate] = useState<string | undefined>();
  const [category, setCategory] =
    useState<ComplaintCategory>("calidad_coccion");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<ConvertedWebpImage | null>(null);
  const [isConvertingImage, setIsConvertingImage] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    setMealPeriod(getDefaultMealPeriod());
    const localToday = getTodayIsoDate();
    setIncidentDate((prev) => prev || localToday);
    setTodayMaxDate(localToday);
  }, []);

  const limit = quota?.limit ?? DEFAULT_LIMIT;
  const remaining = quota?.remaining ?? DEFAULT_LIMIT;
  const limitReached = quota !== undefined && quota.remaining <= 0;

  const submitMutation = useSubmitComplaint({
    onSuccess: (complaint) => {
      setSuccessId(complaint.id);
      setDescription("");
      setImage(null);
      setErrorMessage(null);
    },
    onError: setErrorMessage,
  });

  const isSubmitting = submitMutation.isPending;
  const trimmedLength = description.trim().length;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessId(null);

    if (limitReached) {
      setErrorMessage(
        `Has alcanzado el límite diario de ${limit} registros por dispositivo. Intenta nuevamente mañana.`,
      );
      return;
    }

    if (trimmedLength < MIN_DESCRIPTION_LENGTH) {
      setErrorMessage(
        `Por favor describe tu reclamo con al menos ${MIN_DESCRIPTION_LENGTH} caracteres.`,
      );
      return;
    }

    if (trimmedLength > MAX_DESCRIPTION_LENGTH) {
      setErrorMessage(
        `El detalle no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres.`,
      );
      return;
    }

    submitMutation.mutate({
      description,
      mealPeriod,
      category,
      incidentDate,
      image,
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        {isSubmitting && <SubmittingOverlay />}

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Registrar reclamo de comida
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            No necesitas iniciar sesión. Selecciona el turno, la fecha, la
            categoría y adjunta o captura una fotografía de evidencia.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {/* Turno y fecha */}
          <div className="grid grid-cols-1 gap-6 px-6 py-5 md:grid-cols-12">
            <div className="md:col-span-8">
              <MealPeriodSelector
                value={mealPeriod}
                incidentDate={incidentDate}
                onChange={setMealPeriod}
              />
            </div>
            <div className="md:col-span-4">
              <label
                htmlFor="incident-date"
                className="block text-sm font-medium text-slate-800"
              >
                Fecha del servicio
              </label>
              <input
                id="incident-date"
                type="date"
                value={incidentDate}
                max={todayMaxDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
                className="mt-2 min-h-[56px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 tabular-nums focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="px-6 py-5">
            <CategorySelector value={category} onChange={setCategory} />
          </div>

          {/* Descripción */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="complaint-description"
                className="block text-sm font-medium text-slate-800"
              >
                Detalle de la queja
              </label>
              <span className="text-xs text-slate-500 tabular-nums">
                {description.length} / {MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              id="complaint-description"
              aria-describedby="complaint-description-help"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué ocurrió con el plato, bebida o atención del comedor..."
              minLength={MIN_DESCRIPTION_LENGTH}
              maxLength={MAX_DESCRIPTION_LENGTH}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
            />
            <p
              id="complaint-description-help"
              className="mt-1.5 text-xs text-slate-500"
            >
              Escribe entre {MIN_DESCRIPTION_LENGTH} y {MAX_DESCRIPTION_LENGTH}{" "}
              caracteres (una o dos oraciones concretas).
            </p>
          </div>

          {/* Evidencia */}
          <div className="px-6 py-5">
            <EvidenceUploader
              image={image}
              disabled={limitReached}
              onImageChange={setImage}
              onError={setErrorMessage}
              onConvertingChange={setIsConvertingImage}
            />
          </div>
        </div>

        {/* Mensajes y envío */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <FormFeedback
            errorMessage={errorMessage}
            successId={successId}
            onDismissSuccess={() => setSuccessId(null)}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600 tabular-nums">
              {limitReached ? (
                <span className="font-medium text-red-700">
                  Límite diario alcanzado ({limit} / {limit} registros hoy en
                  este dispositivo)
                </span>
              ) : (
                <span>
                  Registro sin login · Te quedan{" "}
                  <strong className="font-semibold text-slate-900">
                    {remaining} de {limit}
                  </strong>{" "}
                  reclamos hoy
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isConvertingImage || limitReached}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Enviando reclamo...
                </>
              ) : (
                "Enviar reclamo"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
