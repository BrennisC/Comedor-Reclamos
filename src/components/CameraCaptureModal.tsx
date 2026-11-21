"use client";

import type { ReactNode } from "react";
import {
  Camera,
  Check,
  FlipHorizontal2,
  Grid3x3,
  RefreshCw,
  SlidersHorizontal,
  SwitchCamera,
  Timer,
  X,
} from "lucide-react";
import { formatFileBytes, type ConvertedWebpImage } from "../lib/webp";
import { useCameraCapture } from "@/hooks/useCamaraCapture";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureComplete: (image: ConvertedWebpImage) => void;
}

const BTN_BASE =
  "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";
const BTN_IDLE = "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
const BTN_ACTIVE = "border-emerald-700 bg-emerald-50 text-emerald-900";

const ACTION_BASE =
  "inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap";
const ACTION_PRIMARY = `${ACTION_BASE} bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50`;
const ACTION_SECONDARY = `${ACTION_BASE} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`;

function ToggleButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${BTN_BASE} tabular-nums disabled:opacity-50 ${active ? BTN_ACTIVE : BTN_IDLE}`}
    >
      {children}
    </button>
  );
}

function RangeField({
  id,
  label,
  value,
  unit,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-medium text-slate-700">
          {label}
        </label>
        <span className="font-mono font-semibold text-slate-900 tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-emerald-700"
      />
    </div>
  );
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCaptureComplete,
}: CameraCaptureModalProps) {
  const cam = useCameraCapture(isOpen, onClose);
  const { captured, cameraError, isStarting, isConverting, countdown } = cam;

  if (!isOpen) return null;

  const compressionRatio =
    captured && captured.originalSizeBytes > 0
      ? Math.max(
          0,
          Math.round(
            ((captured.originalSizeBytes - captured.webpSizeBytes) /
              captured.originalSizeBytes) *
              100,
          ),
        )
      : 0;

  const footerText = cam.compressError
    ? cam.compressError
    : captured
      ? "Revisa que el plato o problema sea claramente visible."
      : "Apunta hacia la bandeja o alimento y captura.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3
              id="camera-modal-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Tomar fotografía de evidencia
            </h3>
            <p className="text-xs text-slate-500">
              Captura en vivo con conversión directa a WebP (barra espaciadora
              para capturar).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar cámara"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        {!cameraError && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {!captured && (
                <>
                  <ToggleButton
                    onClick={cam.toggleFacing}
                    disabled={isStarting}
                  >
                    <SwitchCamera className="h-3.5 w-3.5" />
                    {cam.facingMode === "environment"
                      ? "Cámara trasera"
                      : "Cámara frontal"}
                  </ToggleButton>
                  <ToggleButton
                    active={cam.mirrorPreview}
                    onClick={cam.toggleMirror}
                  >
                    <FlipHorizontal2 className="h-3.5 w-3.5" />
                    Espejo
                  </ToggleButton>
                  <ToggleButton active={cam.showGrid} onClick={cam.toggleGrid}>
                    <Grid3x3 className="h-3.5 w-3.5" />
                    Cuadrícula
                  </ToggleButton>
                  <ToggleButton
                    active={cam.timerSeconds === 3}
                    onClick={cam.toggleTimer}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    {cam.timerSeconds === 3
                      ? "Temporizador 3s"
                      : "Sin temporizador"}
                  </ToggleButton>

                  {cam.devices.length > 1 && (
                    <select
                      aria-label="Seleccionar dispositivo de cámara"
                      value={cam.deviceId}
                      onChange={(e) => cam.selectDevice(e.target.value)}
                      className="min-h-[36px] max-w-[180px] truncate rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none"
                    >
                      <option value="">Cámara automática</option>
                      {cam.devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={cam.toggleControls}
              className={`${BTN_BASE} tabular-nums ${
                cam.showControls
                  ? "border-slate-900 bg-slate-900 text-white"
                  : BTN_IDLE
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Ajustes WebP ({cam.quality}%)
            </button>
          </div>
        )}

        {/* Sliders */}
        {cam.showControls && !cameraError && (
          <div className="grid grid-cols-1 gap-4 border-b border-slate-200 bg-white px-5 py-3.5 sm:grid-cols-2">
            <RangeField
              id="webp-quality-range"
              label="Calidad de compresión WebP"
              value={cam.quality}
              unit="%"
              min={60}
              max={95}
              step={5}
              disabled={isConverting}
              onChange={(v) => cam.updateCompression(v, cam.maxWidth)}
            />
            <RangeField
              id="webp-width-range"
              label="Resolución máxima (lado mayor)"
              value={cam.maxWidth}
              unit=" px"
              min={800}
              max={2000}
              step={200}
              disabled={isConverting}
              onChange={(v) => cam.updateCompression(cam.quality, v)}
            />
          </div>
        )}

        {/* Viewport */}
        <div className="p-5">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            {captured && (
              <img
                src={captured.dataUrl}
                alt="Vista previa de fotografía capturada en formato WebP"
                className="h-full w-full object-contain"
              />
            )}

            {/* El <video> queda siempre montado para evitar carreras al repetir la toma */}
            <video
              ref={cam.videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${captured ? "hidden" : ""} ${
                cam.shouldMirror ? "scale-x-[-1]" : ""
              }`}
            />

            {!captured && cam.showGrid && !isStarting && !cameraError && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    className={`border-white/20 ${i % 3 < 2 ? "border-r" : ""} ${i < 6 ? "border-b" : ""}`}
                  />
                ))}
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                <span className="font-display text-6xl font-bold text-white tabular-nums">
                  {countdown}
                </span>
              </div>
            )}

            {isStarting && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 text-sm text-white">
                Iniciando cámara del dispositivo...
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center text-white">
                <Camera className="h-10 w-10 text-slate-400" />
                <p className="max-w-md text-sm leading-relaxed text-slate-200">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={cam.startCamera}
                  className={`${ACTION_PRIMARY} min-h-[44px]`}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar cámara
                </button>
              </div>
            )}
          </div>

          {captured && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 tabular-nums">
              <span>
                WebP ({captured.width} × {captured.height} px) · Calidad{" "}
                {cam.quality}%
              </span>
              <span>
                {formatFileBytes(captured.originalSizeBytes)} →{" "}
                <strong className="font-semibold text-emerald-800">
                  {formatFileBytes(captured.webpSizeBytes)}
                </strong>
                {compressionRatio > 0 ? ` (-${compressionRatio}%)` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <span
            className={`text-xs ${cam.compressError ? "text-red-600" : "text-slate-500"}`}
          >
            {footerText}
          </span>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={ACTION_SECONDARY}
            >
              Cancelar
            </button>

            {!captured && !cameraError && (
              <button
                type="button"
                onClick={cam.takePhoto}
                disabled={isStarting || isConverting || countdown !== null}
                className={ACTION_PRIMARY}
              >
                <Camera className="h-4 w-4" />
                {isConverting
                  ? "Convirtiendo a WebP..."
                  : countdown !== null
                    ? `Capturando en ${countdown}s...`
                    : "Capturar foto"}
              </button>
            )}

            {captured && (
              <>
                <button
                  type="button"
                  onClick={cam.startCamera}
                  className={ACTION_SECONDARY}
                >
                  <RefreshCw className="h-4 w-4" />
                  Repetir toma
                </button>
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={() => {
                    onCaptureComplete(captured);
                    onClose();
                  }}
                  className={ACTION_PRIMARY}
                >
                  <Check className="h-4 w-4" />
                  Usar esta foto WebP
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
