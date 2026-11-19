'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  FlipHorizontal2,
  Grid3x3,
  RefreshCw,
  SlidersHorizontal,
  SwitchCamera,
  Timer,
  Upload,
  X,
} from 'lucide-react';
import type { ConvertedWebpImage } from '../lib/webp';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureComplete: (image: ConvertedWebpImage) => void;
  onFallbackToFile: () => void;
}

interface VideoDeviceOption {
  deviceId: string;
  label: string;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCaptureComplete,
  onFallbackToFile,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<ConvertedWebpImage | null>(null);
  const [rawCapturedBlob, setRawCapturedBlob] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<VideoDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [mirrorPreview, setMirrorPreview] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [webpQualityPercent, setWebpQualityPercent] = useState<number>(85);
  const [maxWidthPx, setMaxWidthPx] = useState<number>(1600);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3>(0);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);

  const formatFileBytes = useCallback((bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  }, []);

  const readBlobAsDataUrl = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('No se pudo leer la imagen WebP generada.'));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo WebP.'));
      reader.readAsDataURL(blob);
    });
  }, []);

  const convertCanvasSourceToWebp = useCallback(
    async (
      source: CanvasImageSource,
      naturalWidth: number,
      naturalHeight: number,
      originalSizeBytes: number,
      qualityRatio: number,
      maxDimension: number,
      fileName: string,
      flipHorizontally: boolean
    ): Promise<ConvertedWebpImage> => {
      let targetWidth = naturalWidth;
      let targetHeight = naturalHeight;

      if (targetWidth <= 0 || targetHeight <= 0) {
        throw new Error('Dimensiones de captura inválidas.');
      }

      if (targetWidth > maxDimension || targetHeight > maxDimension) {
        if (targetWidth >= targetHeight) {
          targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
          targetWidth = maxDimension;
        } else {
          targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
          targetHeight = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo inicializar el lienzo de conversión WebP.');
      }

      if (flipHorizontally) {
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('El navegador no pudo generar la imagen WebP.'));
            }
          },
          'image/webp',
          qualityRatio
        );
      });

      const dataUrl = await readBlobAsDataUrl(webpBlob);
      return {
        blob: webpBlob,
        dataUrl,
        width: targetWidth,
        height: targetHeight,
        originalSizeBytes,
        webpSizeBytes: webpBlob.size,
        originalType: 'image/png',
        fileName: fileName.endsWith('.webp') ? fileName : `${fileName}.webp`,
      };
    },
    [readBlobAsDataUrl]
  );

  const recompressBlobToWebp = useCallback(
    async (
      sourceBlob: Blob,
      qualityRatio: number,
      maxDimension: number,
      fileName: string
    ): Promise<ConvertedWebpImage> => {
      const objectUrl = URL.createObjectURL(sourceBlob);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('No se pudo cargar la captura para recomprimir.'));
          el.src = objectUrl;
        });

        return await convertCanvasSourceToWebp(
          img,
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          sourceBlob.size,
          qualityRatio,
          maxDimension,
          fileName,
          false
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [convertCanvasSourceToWebp]
  );

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownRemaining(null);
  }, []);

  const stopCamera = useCallback(() => {
    clearCountdown();
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [clearCountdown]);

  const refreshDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Cámara ${index + 1}`,
        }));
      setVideoDevices(cameras);
    } catch {
      // Device enumeration is optional; ignore if restricted by browser policy.
    }
  }, []);

  const startCamera = useCallback(
    async (overrideDeviceId?: string, overrideFacing?: 'environment' | 'user') => {
      setIsStarting(true);
      setCameraError(null);
      setCapturedImage(null);
      setRawCapturedBlob(null);
      stopCamera();

      const targetDevice = overrideDeviceId ?? selectedDeviceId;
      const targetFacing = overrideFacing ?? facingMode;

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'Tu navegador o contexto actual no permite abrir la cámara en vivo.'
          );
        }

        const videoConstraints: MediaTrackConstraints = targetDevice
          ? {
              deviceId: { exact: targetDevice },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        await refreshDeviceList();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo acceder a la cámara del dispositivo.';
        setCameraError(
          `${message} Puedes usar la captura nativa del teléfono o subir una imagen desde tus archivos.`
        );
      } finally {
        setIsStarting(false);
      }
    },
    [facingMode, refreshDeviceList, selectedDeviceId, stopCamera]
  );

  const captureFrameNow = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsConverting(true);
    try {
      const shouldMirror = mirrorPreview || facingMode === 'user';
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = video.videoWidth;
      rawCanvas.height = video.videoHeight;
      const rawCtx = rawCanvas.getContext('2d');
      if (!rawCtx) throw new Error('No se pudo capturar el cuadro de video.');
      if (shouldMirror) {
        rawCtx.translate(rawCanvas.width, 0);
        rawCtx.scale(-1, 1);
      }
      rawCtx.drawImage(video, 0, 0, rawCanvas.width, rawCanvas.height);

      const rawBlob = await new Promise<Blob>((resolve, reject) => {
        rawCanvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Error al capturar foto.'))),
          'image/png'
        );
      });

      const webp = await convertCanvasSourceToWebp(
        rawCanvas,
        video.videoWidth,
        video.videoHeight,
        rawBlob.size,
        webpQualityPercent / 100,
        maxWidthPx,
        `camara_${Date.now()}.webp`,
        false
      );

      setRawCapturedBlob(rawBlob);
      setCapturedImage(webp);
      stopCamera();
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un problema al convertir la foto a WebP.'
      );
    } finally {
      setIsConverting(false);
    }
  }, [
    convertCanvasSourceToWebp,
    facingMode,
    maxWidthPx,
    mirrorPreview,
    stopCamera,
    webpQualityPercent,
  ]);

  const handleTakePhotoClick = useCallback(() => {
    if (isStarting || isConverting || countdownRemaining !== null) return;
    if (timerSeconds === 0) {
      void captureFrameNow();
      return;
    }

    let secondsLeft: number = timerSeconds;
    setCountdownRemaining(secondsLeft);
    countdownIntervalRef.current = window.setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearCountdown();
        void captureFrameNow();
      } else {
        setCountdownRemaining(secondsLeft);
      }
    }, 1000);
  }, [
    captureFrameNow,
    clearCountdown,
    countdownRemaining,
    isConverting,
    isStarting,
    timerSeconds,
  ]);

  const handleUpdateCompression = async (nextQuality: number, nextMaxWidth: number) => {
    setWebpQualityPercent(nextQuality);
    setMaxWidthPx(nextMaxWidth);
    if (!rawCapturedBlob) return;
    setIsConverting(true);
    try {
      const reconverted = await recompressBlobToWebp(
        rawCapturedBlob,
        nextQuality / 100,
        nextMaxWidth,
        capturedImage?.fileName || `camara_${Date.now()}.webp`
      );
      setCapturedImage(reconverted);
    } catch (err) {
      setCameraError(
        err instanceof Error ? err.message : 'No se pudo recalcular la compresión WebP.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
    void startCamera('', nextFacing);
  };

  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setRawCapturedBlob(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (
        event.key === ' ' &&
        !capturedImage &&
        !cameraError &&
        !isStarting &&
        !isConverting
      ) {
        event.preventDefault();
        handleTakePhotoClick();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    cameraError,
    capturedImage,
    handleTakePhotoClick,
    isConverting,
    isOpen,
    isStarting,
    onClose,
  ]);

  if (!isOpen) return null;

  const compressionRatio =
    capturedImage && capturedImage.originalSizeBytes > 0
      ? Math.max(
          0,
          Math.round(
            ((capturedImage.originalSizeBytes - capturedImage.webpSizeBytes) /
              capturedImage.originalSizeBytes) *
              100
          )
        )
      : 0;

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
              Captura en vivo con conversión directa a WebP (barra espaciadora para capturar).
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

        {/* Camera Toolbar */}
        {!cameraError && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {!capturedImage && (
                <>
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    disabled={isStarting}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap"
                  >
                    <SwitchCamera className="h-3.5 w-3.5" />
                    {facingMode === 'environment' ? 'Cámara trasera' : 'Cámara frontal'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMirrorPreview((prev) => !prev)}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      mirrorPreview
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FlipHorizontal2 className="h-3.5 w-3.5" />
                    Espejo
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGrid((prev) => !prev)}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      showGrid
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Grid3x3 className="h-3.5 w-3.5" />
                    Cuadrícula
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTimerSeconds((prev) => (prev === 0 ? 3 : 0))
                    }
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                      timerSeconds === 3
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    {timerSeconds === 3 ? 'Temporizador 3s' : 'Sin temporizador'}
                  </button>
                </>
              )}

              {videoDevices.length > 1 && !capturedImage && (
                <select
                  aria-label="Seleccionar dispositivo de cámara"
                  value={selectedDeviceId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedDeviceId(nextId);
                    void startCamera(nextId);
                  }}
                  className="min-h-[36px] max-w-[180px] truncate rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="">Cámara automática</option>
                  {videoDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowControls((prev) => !prev)}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                showControls
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Ajustes WebP ({webpQualityPercent}%)
            </button>
          </div>
        )}

        {/* Continuous WebP Quality & Resolution Sliders */}
        {showControls && !cameraError && (
          <div className="grid grid-cols-1 gap-4 border-b border-slate-200 bg-white px-5 py-3.5 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="webp-quality-range" className="font-medium text-slate-700">
                  Calidad de compresión WebP
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {webpQualityPercent}%
                </span>
              </div>
              <input
                id="webp-quality-range"
                type="range"
                min={60}
                max={95}
                step={5}
                value={webpQualityPercent}
                disabled={isConverting}
                onChange={(e) =>
                  void handleUpdateCompression(Number(e.target.value), maxWidthPx)
                }
                className="mt-1.5 w-full accent-emerald-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="webp-width-range" className="font-medium text-slate-700">
                  Resolución máxima (lado mayor)
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {maxWidthPx} px
                </span>
              </div>
              <input
                id="webp-width-range"
                type="range"
                min={800}
                max={2000}
                step={200}
                value={maxWidthPx}
                disabled={isConverting}
                onChange={(e) =>
                  void handleUpdateCompression(webpQualityPercent, Number(e.target.value))
                }
                className="mt-1.5 w-full accent-emerald-700"
              />
            </div>
          </div>
        )}

        {/* Viewport */}
        <div className="p-5">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            {capturedImage ? (
              <img
                src={capturedImage.dataUrl}
                alt="Vista previa de fotografía capturada en formato WebP"
                className="h-full w-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  mirrorPreview || facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
            )}

            {/* Rule-of-thirds composition grid */}
            {!capturedImage && showGrid && !isStarting && !cameraError && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
              >
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            )}

            {/* Countdown indicator */}
            {countdownRemaining !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                <span className="font-display text-6xl font-bold text-white tabular-nums">
                  {countdownRemaining}
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
                  onClick={() => {
                    onClose();
                    onFallbackToFile();
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 whitespace-nowrap"
                >
                  <Upload className="h-4 w-4" />
                  Seleccionar o capturar desde archivo
                </button>
              </div>
            )}
          </div>

          {capturedImage && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 tabular-nums">
              <span>
                WebP ({capturedImage.width} × {capturedImage.height} px) · Calidad{' '}
                {webpQualityPercent}%
              </span>
              <span>
                {formatFileBytes(capturedImage.originalSizeBytes)} →{' '}
                <strong className="font-semibold text-emerald-800">
                  {formatFileBytes(capturedImage.webpSizeBytes)}
                </strong>
                {compressionRatio > 0 ? ` (-${compressionRatio}%)` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <span className="text-xs text-slate-500">
            {capturedImage
              ? 'Revisa que el plato o problema sea claramente visible.'
              : 'Apunta hacia la bandeja o alimento y captura.'}
          </span>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap"
            >
              Cancelar
            </button>

            {!capturedImage && !cameraError && (
              <button
                type="button"
                onClick={handleTakePhotoClick}
                disabled={isStarting || isConverting || countdownRemaining !== null}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap"
              >
                <Camera className="h-4 w-4" />
                {isConverting
                  ? 'Convirtiendo a WebP...'
                  : countdownRemaining !== null
                    ? `Capturando en ${countdownRemaining}s...`
                    : 'Capturar foto'}
              </button>
            )}

            {capturedImage && (
              <>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap"
                >
                  <RefreshCw className="h-4 w-4" />
                  Repetir toma
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCaptureComplete(capturedImage);
                    onClose();
                  }}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 whitespace-nowrap"
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
