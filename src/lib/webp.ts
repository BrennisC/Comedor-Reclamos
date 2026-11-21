export interface ConvertedWebpImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSizeBytes: number;
  webpSizeBytes: number;
  originalType: string;
  fileName: string;
}

interface ConvertOptions {
  source: CanvasImageSource;
  width: number;
  height: number;
  originalSizeBytes: number;
  quality: number; // 0..1
  maxDimension: number;
  fileName: string;
  originalType?: string;
}

export function formatFileBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error(`No se pudo generar la imagen ${type}.`)),
      type,
      quality,
    );
  });
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("No se pudo leer la imagen WebP generada."));
    reader.onerror = () => reject(new Error("Error leyendo el archivo WebP."));
    reader.readAsDataURL(blob);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("No se pudo cargar la captura para recomprimir."));
    img.src = url;
  });
}

export async function convertToWebp({
  source,
  width,
  height,
  originalSizeBytes,
  quality,
  maxDimension,
  fileName,
  originalType = "image/png",
}: ConvertOptions): Promise<ConvertedWebpImage> {
  if (width <= 0 || height <= 0)
    throw new Error("Dimensiones de captura inválidas.");

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("No se pudo inicializar el lienzo de conversión WebP.");
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(canvas, "image/webp", quality);

  return {
    blob,
    dataUrl: await readBlobAsDataUrl(blob),
    width: targetWidth,
    height: targetHeight,
    originalSizeBytes,
    webpSizeBytes: blob.size,
    originalType,
    fileName: fileName.endsWith(".webp") ? fileName : `${fileName}.webp`,
  };
}

export async function recompressBlobToWebp(
  sourceBlob: Blob,
  quality: number,
  maxDimension: number,
  fileName: string,
): Promise<ConvertedWebpImage> {
  const url = URL.createObjectURL(sourceBlob);
  try {
    const img = await loadImage(url);
    return await convertToWebp({
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      originalSizeBytes: sourceBlob.size,
      quality,
      maxDimension,
      fileName,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
