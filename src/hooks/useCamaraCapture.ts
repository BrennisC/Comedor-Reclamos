"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canvasToBlob,
  convertToWebp,
  recompressBlobToWebp,
  type ConvertedWebpImage,
} from "../lib/webp";

export type Facing = "environment" | "user";

interface VideoDeviceOption {
  deviceId: string;
  label: string;
}

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function useCameraCapture(isOpen: boolean, onClose: () => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<number | null>(null);
  const recompressRef = useRef<number | undefined>(undefined);
  const requestIdRef = useRef(0);

  const [isStarting, setIsStarting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<ConvertedWebpImage | null>(null);
  const [rawBlob, setRawBlob] = useState<Blob | null>(null);

  const [facingMode, setFacingMode] = useState<Facing>("environment");
  const [devices, setDevices] = useState<VideoDeviceOption[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [showGrid, setShowGrid] = useState(true);
  const [mirrorPreview, setMirrorPreview] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [quality, setQuality] = useState(85);
  const [maxWidth, setMaxWidth] = useState(1600);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const shouldMirror = mirrorPreview || facingMode === "user";

  // Refs para que startCamera sea estable y no dispare el efecto de apertura.
  const settingsRef = useRef({ facingMode, deviceId });
  settingsRef.current = { facingMode, deviceId };

  const clearCountdown = useCallback(() => {
    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    clearCountdown();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [clearCountdown]);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices?.enumerateDevices();
      setDevices(
        (all ?? [])
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Cámara ${i + 1}`,
          })),
      );
    } catch {
      // Opcional: ignorar si el navegador lo restringe.
    }
  }, []);

  const startCamera = useCallback(
    async (override?: { deviceId?: string; facing?: Facing }) => {
      stopCamera();
      const requestId = ++requestIdRef.current;
      setIsStarting(true);
      setCameraError(null);
      setCompressError(null);
      setCaptured(null);
      setRawBlob(null);

      const targetDevice = override?.deviceId ?? settingsRef.current.deviceId;
      const targetFacing = override?.facing ?? settingsRef.current.facingMode;
      const size = { width: { ideal: 1280 }, height: { ideal: 720 } };

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Tu navegador o contexto actual no permite abrir la cámara en vivo.",
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: targetDevice
            ? { deviceId: { exact: targetDevice }, ...size }
            : { facingMode: { ideal: targetFacing }, ...size },
          audio: false,
        });

        if (requestId !== requestIdRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch (playErr) {
            // play() interrumpido por una carga más nueva: ignorar.
            if (requestId !== requestIdRef.current) return;
            if (
              playErr instanceof DOMException &&
              playErr.name === "AbortError"
            )
              return;
            throw playErr;
          }
        }

        if (requestId === requestIdRef.current) await refreshDevices();
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setCameraError(
          `${errorMessage(err, "No se pudo acceder a la cámara del dispositivo.")} ` +
            "Puedes cerrar este diálogo y subir una imagen desde tus archivos.",
        );
      } finally {
        if (requestId === requestIdRef.current) setIsStarting(false);
      }
    },
    [refreshDevices, stopCamera],
  );

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setIsConverting(true);
    try {
      const { videoWidth: w, videoHeight: h } = video;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo capturar el cuadro de video.");
      if (shouldMirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);

      const raw = await canvasToBlob(canvas, "image/png");
      const webp = await convertToWebp({
        source: canvas,
        width: w,
        height: h,
        originalSizeBytes: raw.size,
        quality: quality / 100,
        maxDimension: maxWidth,
        fileName: `camara_${Date.now()}.webp`,
      });

      setRawBlob(raw);
      setCaptured(webp);
      stopCamera();
    } catch (err) {
      setCameraError(
        errorMessage(err, "Ocurrió un problema al convertir la foto a WebP."),
      );
    } finally {
      setIsConverting(false);
    }
  }, [maxWidth, quality, shouldMirror, stopCamera]);

  const takePhoto = useCallback(() => {
    if (isStarting || isConverting || countdown !== null) return;
    if (timerSeconds === 0) {
      void captureFrame();
      return;
    }
    let left: number = timerSeconds;
    setCountdown(left);
    countdownRef.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearCountdown();
        void captureFrame();
      } else {
        setCountdown(left);
      }
    }, 1000);
  }, [
    captureFrame,
    clearCountdown,
    countdown,
    isConverting,
    isStarting,
    timerSeconds,
  ]);

  // Recomprime con debounce para no reconvertir en cada paso del slider.
  const updateCompression = useCallback(
    (nextQuality: number, nextMaxWidth: number) => {
      setQuality(nextQuality);
      setMaxWidth(nextMaxWidth);
      if (!rawBlob) return;

      window.clearTimeout(recompressRef.current);
      recompressRef.current = window.setTimeout(async () => {
        setIsConverting(true);
        setCompressError(null);
        try {
          setCaptured(
            await recompressBlobToWebp(
              rawBlob,
              nextQuality / 100,
              nextMaxWidth,
              captured?.fileName ?? `camara_${Date.now()}.webp`,
            ),
          );
        } catch (err) {
          setCompressError(
            errorMessage(err, "No se pudo recalcular la compresión WebP."),
          );
        } finally {
          setIsConverting(false);
        }
      }, 250);
    },
    [captured?.fileName, rawBlob],
  );

  const toggleFacing = useCallback(() => {
    const next: Facing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setDeviceId("");
    void startCamera({ deviceId: "", facing: next });
  }, [facingMode, startCamera]);

  const selectDevice = useCallback(
    (id: string) => {
      setDeviceId(id);
      void startCamera({ deviceId: id });
    },
    [startCamera],
  );

  // Abrir / cerrar
  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      stopCamera();
      setCaptured(null);
      setRawBlob(null);
      setCameraError(null);
      setCompressError(null);
    }
    return () => {
      stopCamera();
      window.clearTimeout(recompressRef.current);
    };
  }, [isOpen, startCamera, stopCamera]);

  // Atajos de teclado
  useEffect(() => {
    if (!isOpen) return;
    const canShoot = !captured && !cameraError && !isStarting && !isConverting;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === " " && canShoot) {
        e.preventDefault();
        takePhoto();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    cameraError,
    captured,
    isConverting,
    isOpen,
    isStarting,
    onClose,
    takePhoto,
  ]);

  return {
    videoRef,
    // estado
    isStarting,
    isConverting,
    cameraError,
    compressError,
    captured,
    facingMode,
    devices,
    deviceId,
    showGrid,
    mirrorPreview,
    showControls,
    quality,
    maxWidth,
    timerSeconds,
    countdown,
    shouldMirror,
    // acciones
    startCamera: () => startCamera(),
    takePhoto,
    updateCompression,
    toggleFacing,
    selectDevice,
    toggleGrid: () => setShowGrid((v) => !v),
    toggleMirror: () => setMirrorPreview((v) => !v),
    toggleControls: () => setShowControls((v) => !v),
    toggleTimer: () => setTimerSeconds((v) => (v === 0 ? 3 : 0)),
  };
}
