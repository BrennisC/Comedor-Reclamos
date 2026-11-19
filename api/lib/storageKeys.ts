import path from 'node:path';
import { UPLOADS_DIR } from '../types';

export const EVIDENCE_URL_PREFIX = '/api/uploads/';

const KEY_SEGMENT = /^[a-zA-Z0-9_-]+$/;

/**
 * Object keys are organized per submission day, meal period and category:
 * `2026-11-19/cena/higiene_limpieza/rec_1234_ab12cd34.webp`
 */
export function buildEvidenceKey(params: {
  submissionDate: string;
  mealPeriod: string;
  category: string;
  id: string;
}): string {
  return `${params.submissionDate}/${params.mealPeriod}/${params.category}/${params.id}.webp`;
}

export function evidenceKeyToUrl(key: string): string {
  return `${EVIDENCE_URL_PREFIX}${key}`;
}

/** Accepts legacy flat keys (`rec_x.webp`) and nested keys. */
export function evidenceKeyFromUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const index = imageUrl.indexOf(EVIDENCE_URL_PREFIX);
  if (index === -1) return null;
  const raw = imageUrl.slice(index + EVIDENCE_URL_PREFIX.length).split('?')[0].split('#')[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isValidEvidenceKey(key: string): boolean {
  const segments = key.split('/');
  if (segments.length === 0) return false;
  const fileName = segments[segments.length - 1];
  if (!/^[a-zA-Z0-9_-]+\.webp$/.test(fileName)) return false;
  return segments.slice(0, -1).every((segment) => KEY_SEGMENT.test(segment));
}

export function evidenceLocalPath(key: string): string {
  const segments = key.split('/').filter(Boolean);
  return path.join(UPLOADS_DIR, ...segments);
}
