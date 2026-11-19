import type { ConvertedWebpImage } from "./webp";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.85;

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () =>
      reject(new Error("No se pudo leer la imagen seleccionada."));
    el.src = url;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("El navegador no pudo generar el archivo WebP.")),
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Error codificando WebP en base64."));
    reader.onerror = () =>
      reject(new Error("Error codificando WebP en base64."));
    reader.readAsDataURL(blob);
  });
}

function fitWithin(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height };
  return width >= height
    ? { width: max, height: Math.round((height * max) / width) }
    : { width: Math.round((width * max) / height), height: max };
}

export async function fileToWebp(file: File): Promise<ConvertedWebpImage> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    if (srcW <= 0 || srcH <= 0) {
      throw new Error("Dimensiones de imagen inválidas.");
    }

    const { width, height } = fitWithin(srcW, srcH, MAX_DIMENSION);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo inicializar el conversor WebP.");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToWebpBlob(canvas);
    const dataUrl = await blobToDataUrl(blob);

    const cleanBase = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    return {
      blob,
      dataUrl,
      width,
      height,
      originalSizeBytes: file.size,
      webpSizeBytes: blob.size,
      originalType: file.type || "image/jpeg",
      fileName: `${cleanBase || "reclamo"}.webp`,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
