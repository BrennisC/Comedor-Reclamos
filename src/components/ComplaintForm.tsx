"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  CloudUpload,
  FileImage,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { ApiError, queryKeys } from "../lib/api";
import type { ConvertedWebpImage } from "../lib/webp";
import {
  COMPLAINT_CATEGORIES,
  getDefaultMealPeriod,
  getTodayIsoDate,
  MEAL_PERIODS,
  type ComplaintCategory,
  type ComplaintRecord,
  type MealPeriod,
  type QuotaStatus,
} from "../types/complaint";
import { CameraCaptureModal } from "./CameraCaptureModal";

interface ComplaintFormProps {
  quota: QuotaStatus | undefined;
}

export function ComplaintForm({ quota }: ComplaintFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureFallbackRef = useRef<HTMLInputElement | null>(null);

  const [mealPeriod, setMealPeriod] = useState<MealPeriod>("almuerzo");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [todayMaxDate, setTodayMaxDate] = useState<string | undefined>(
    undefined,
  );
  const [category, setCategory] =
    useState<ComplaintCategory>("calidad_coccion");
  const [description, setDescription] = useState<string>("");
  const [webpImage, setWebpImage] = useState<ConvertedWebpImage | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isConvertingImage, setIsConvertingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string } | null>(null);

  useEffect(() => {
    setMealPeriod(getDefaultMealPeriod());
    const localToday = getTodayIsoDate();
    setIncidentDate((prev) => prev || localToday);
    setTodayMaxDate(localToday);
  }, []);

  const limitReached = quota !== undefined && quota.remaining <= 0;

  const formatFileSize = useCallback(
    (bytes: number | null | undefined): string => {
      if (bytes === null || bytes === undefined || bytes <= 0) return "0 B";
      if (bytes < 1024) return `${bytes} B`;
      const kb = bytes / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(2)} MB`;
    },
    [],
  );

  const transformFileToWebp = useCallback(
    async (file: File): Promise<ConvertedWebpImage> => {
      const maxDimension = 1600;
      const quality = 0.85;
      const objectUrl = URL.createObjectURL(file);

      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () =>
            reject(new Error("No se pudo leer la imagen seleccionada."));
          el.src = objectUrl;
        });

        let targetWidth = img.naturalWidth || img.width;
        let targetHeight = img.naturalHeight || img.height;

        if (targetWidth <= 0 || targetHeight <= 0) {
          throw new Error("Dimensiones de imagen inválidas.");
        }

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth >= targetHeight) {
            targetHeight = Math.round(
              (targetHeight * maxDimension) / targetWidth,
            );
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round(
              (targetWidth * maxDimension) / targetHeight,
            );
            targetHeight = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("No se pudo inicializar el conversor WebP.");
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const webpBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else
                reject(
                  new Error("El navegador no pudo generar el archivo WebP."),
                );
            },
            "image/webp",
            quality,
          );
        });

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Error codificando WebP en base64."));
          };
          reader.onerror = () =>
            reject(new Error("Error codificando WebP en base64."));
          reader.readAsDataURL(webpBlob);
        });

        const cleanBase = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_");

        return {
          blob: webpBlob,
          dataUrl,
          width: targetWidth,
          height: targetHeight,
          originalSizeBytes: file.size,
          webpSizeBytes: webpBlob.size,
          originalType: file.type || "image/jpeg",
          fileName: `${cleanBase || "reclamo"}.webp`,
        };
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [],
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          mealPeriod,
          category,
          incidentDate,
          imageBase64: webpImage ? webpImage.dataUrl : undefined,
          imageFileName: webpImage ? webpImage.fileName : undefined,
          originalSizeBytes: webpImage
            ? webpImage.originalSizeBytes
            : undefined,
        }),
      });

      const payload = (await res.json()) as {
        error?: string;
        complaint?: ComplaintRecord;
        quota?: QuotaStatus;
      };

      if (!res.ok || !payload.complaint || !payload.quota) {
        throw new ApiError(
          payload.error || "No se pudo registrar el reclamo.",
          res.status,
        );
      }

      return {
        complaint: payload.complaint,
        quota: payload.quota,
      };
    },
    onSuccess: async ({ complaint, quota: updatedQuota }) => {
      queryClient.setQueryData(queryKeys.quota, updatedQuota);
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setSuccessInfo({ id: complaint.id });
      setDescription("");
      setWebpImage(null);
      setErrorMessage(null);
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.status === 429) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.quota });
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar tu reclamo.",
      );
    },
  });

  const processSelectedFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor selecciona un archivo de imagen válido.");
      return;
    }
    setErrorMessage(null);
    setIsConvertingImage(true);
    try {
      const converted = await transformFileToWebp(file);
      setWebpImage(converted);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "No se pudo transformar la imagen a formato WebP.",
      );
    } finally {
      setIsConvertingImage(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    void processSelectedFile(file);
    event.target.value = "";
  };

  const handleDropZoneDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    if (limitReached || isConvertingImage) return;
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    void processSelectedFile(droppedFile);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (limitReached) {
      setErrorMessage(
        "Has alcanzado el límite diario de 3 registros por dispositivo. Intenta nuevamente mañana.",
      );
      return;
    }

    if (description.trim().length < 10) {
      setErrorMessage(
        "Por favor describe tu reclamo con al menos 10 caracteres.",
      );
      return;
    }

    submitMutation.mutate();
  };

  const savingsPct =
    webpImage && webpImage.originalSizeBytes > 0
      ? Math.max(
          0,
          Math.round(
            ((webpImage.originalSizeBytes - webpImage.webpSizeBytes) /
              webpImage.originalSizeBytes) *
              100,
          ),
        )
      : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white"
      >
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
          {/* Step 1: Meal Period & Date */}
          <div className="grid grid-cols-1 gap-6 px-6 py-5 md:grid-cols-12">
            <div className="md:col-span-8">
              <label className="block text-sm font-medium text-slate-800">
                Turno del comedor
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {MEAL_PERIODS.map((period) => {
                  const active = mealPeriod === period.id;
                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setMealPeriod(period.id)}
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

          {/* Step 2: Category Classification */}
          <div className="px-6 py-5">
            <label className="block text-sm font-medium text-slate-800">
              Categoría para reporte diario
            </label>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {COMPLAINT_CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex min-h-[64px] flex-col justify-center rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                      active
                        ? "border-emerald-700 bg-emerald-50/70 text-emerald-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-sm font-semibold">{cat.label}</span>
                    <span className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {cat.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Complaint Description */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="complaint-description"
                className="block text-sm font-medium text-slate-800"
              >
                Detalle de la queja
              </label>
              <span className="text-xs text-slate-500 tabular-nums">
                {description.trim().length} / 10 mín.
              </span>
            </div>
            <textarea
              id="complaint-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué ocurrió con el plato, bebida o atención del comedor..."
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          {/* Step 4: Photo Upload or Camera Capture -> WebP */}
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="block text-sm font-medium text-slate-800">
                  Fotografía de evidencia (opcional)
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={captureFallbackRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {!webpImage ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!limitReached) setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDropZoneDrop}
                className={`mt-3 flex flex-col items-center justify-between gap-4 rounded-lg border border-dashed px-5 py-6 transition-colors sm:flex-row ${
                  isDraggingFile
                    ? "border-emerald-700 bg-emerald-50/70"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                    {isConvertingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                    ) : (
                      <FileImage className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {isConvertingImage
                        ? "Procesando imagen..."
                        : isDraggingFile
                          ? "Suelta aquí tu imagen"
                          : "Arrastra o sube una imagen, o toma una foto ahora"}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isConvertingImage || limitReached}
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:flex-initial whitespace-nowrap"
                  >
                    <Upload className="h-4 w-4" />
                    Subir imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={isConvertingImage || limitReached}
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 sm:flex-initial whitespace-nowrap"
                  >
                    <Camera className="h-4 w-4" />
                    Tomar foto
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <img
                  src={webpImage.dataUrl}
                  alt="Vista previa de la evidencia"
                  className="h-28 w-full shrink-0 rounded-md border border-slate-200 bg-white object-cover sm:w-40"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {webpImage.fileName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
                    <span>
                      {webpImage.width} × {webpImage.height} px
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatFileSize(webpImage.originalSizeBytes)} →{" "}
                      <strong className="font-semibold text-emerald-800">
                        {formatFileSize(webpImage.webpSizeBytes)}
                      </strong>
                      {savingsPct > 0 ? ` (-${savingsPct}%)` : ""}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                    <CloudUpload className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    La fotografía se adjuntará a tu reclamo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWebpImage(null)}
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar foto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback messages & Submit footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo && (
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
                    <span className="font-mono">{successInfo.id}</span> · Quedó
                    registrado en el turno y fecha indicados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                className="inline-flex min-h-[36px] items-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
              >
                Entendido
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600 tabular-nums">
              {limitReached ? (
                <span className="font-medium text-red-700">
                  Límite diario alcanzado (3 / 3 registros hoy en este
                  dispositivo)
                </span>
              ) : (
                <span>
                  Registro sin login · Te quedan{" "}
                  <strong className="font-semibold text-slate-900">
                    {quota ? quota.remaining : 3} de 3
                  </strong>{" "}
                  reclamos hoy
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={
                submitMutation.isPending || isConvertingImage || limitReached
              }
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 whitespace-nowrap"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Enviando reclamo...
                </>
              ) : (
                "Enviar reclamo"
              )}
            </button>
          </div>
        </div>
      </form>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureComplete={(img) => {
          setWebpImage(img);
          setErrorMessage(null);
        }}
        onFallbackToFile={() => captureFallbackRef.current?.click()}
      />
    </div>
  );
}
