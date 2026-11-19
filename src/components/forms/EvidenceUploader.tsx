"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Camera,
  CloudUpload,
  FileImage,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { fileToWebp, formatFileSize } from "../../lib/filetoWebp";
import type { ConvertedWebpImage } from "../../lib/webp";
import { CameraCaptureModal } from "../CameraCaptureModal";

interface EvidenceUploaderProps {
  image: ConvertedWebpImage | null;
  disabled: boolean;
  onImageChange: (image: ConvertedWebpImage | null) => void;
  onError: (message: string | null) => void;
  /** Se notifica para que el formulario bloquee el envío mientras se convierte. */
  onConvertingChange?: (isConverting: boolean) => void;
}

export function EvidenceUploader({
  image,
  disabled,
  onImageChange,
  onError,
  onConvertingChange,
}: EvidenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureFallbackRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const setConverting = (value: boolean) => {
    setIsConverting(value);
    onConvertingChange?.(value);
  };

  const processFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Por favor selecciona un archivo de imagen válido.");
      return;
    }
    onError(null);
    setConverting(true);
    try {
      onImageChange(await fileToWebp(file));
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "No se pudo transformar la imagen a formato WebP.",
      );
    } finally {
      setConverting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || isConverting) return;
    void processFile(event.dataTransfer.files?.[0] ?? null);
  };

  const savingsPct =
    image && image.originalSizeBytes > 0
      ? Math.max(
          0,
          Math.round(
            ((image.originalSizeBytes - image.webpSizeBytes) /
              image.originalSizeBytes) *
              100,
          ),
        )
      : 0;

  return (
    <div>
      <span className="block text-sm font-medium text-slate-800">
        Fotografía de evidencia (opcional)
      </span>

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

      {!image ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-3 flex flex-col items-center justify-between gap-4 rounded-lg border border-dashed px-5 py-6 transition-colors sm:flex-row ${
            isDragging
              ? "border-emerald-700 bg-emerald-50/70"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
              {isConverting ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
              ) : (
                <FileImage className="h-5 w-5" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-800">
              {isConverting
                ? "Procesando imagen..."
                : isDragging
                  ? "Suelta aquí tu imagen"
                  : "Arrastra o sube una imagen, o toma una foto ahora"}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isConverting || disabled}
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:flex-initial whitespace-nowrap"
            >
              <Upload className="h-4 w-4" />
              Subir imagen
            </button>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              disabled={isConverting || disabled}
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 sm:flex-initial whitespace-nowrap"
            >
              <Camera className="h-4 w-4" />
              Tomar foto
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.dataUrl}
            alt="Vista previa de la evidencia"
            className="h-28 w-full shrink-0 rounded-md border border-slate-200 bg-white object-cover sm:w-40"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {image.fileName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
              <span>
                {image.width} × {image.height} px
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {formatFileSize(image.originalSizeBytes)} →{" "}
                <strong className="font-semibold text-emerald-800">
                  {formatFileSize(image.webpSizeBytes)}
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
            onClick={() => onImageChange(null)}
            className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Quitar foto
          </button>
        </div>
      )}

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureComplete={(img) => {
          onImageChange(img);
          onError(null);
        }}
        onFallbackToFile={() => captureFallbackRef.current?.click()}
      />
    </div>
  );
}