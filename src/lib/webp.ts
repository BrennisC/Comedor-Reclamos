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

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
    img.src = src;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Error leyendo los datos de la imagen WebP.'));
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo los datos de la imagen WebP.'));
    reader.readAsDataURL(blob);
  });
}

export async function convertImageToWebp(
  input: File | Blob,
  options?: { maxDimension?: number; quality?: number; fileName?: string }
): Promise<ConvertedWebpImage> {
  const maxDimension = options?.maxDimension ?? 1600;
  const quality = options?.quality ?? 0.85;
  const originalType = input.type || 'image/jpeg';
  const originalSizeBytes = input.size;

  const objectUrl = URL.createObjectURL(input);
  try {
    const img = await loadImageElement(objectUrl);
    let targetWidth = img.naturalWidth || img.width;
    let targetHeight = img.naturalHeight || img.height;

    if (targetWidth <= 0 || targetHeight <= 0) {
      throw new Error('Dimensiones de imagen inválidas.');
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

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

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
        quality
      );
    });

    const dataUrl = await blobToDataUrl(webpBlob);
    const baseName = (
      options?.fileName ||
      (input instanceof File ? input.name : 'captura_comedor')
    )
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    return {
      blob: webpBlob,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      originalSizeBytes,
      webpSizeBytes: webpBlob.size,
      originalType,
      fileName: `${baseName || 'reclamo'}.webp`,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
