import fs from 'node:fs';
import path from 'node:path';

export type MealPeriod = 'desayuno' | 'almuerzo' | 'cena';

export type ComplaintCategory =
  | 'calidad_coccion'
  | 'temperatura'
  | 'higiene_limpieza'
  | 'tamano_porcion'
  | 'atencion_espera'
  | 'otros';

export type ComplaintStatus = 'pendiente' | 'en_revision' | 'resuelto' | 'archivado';
export type ComplaintPriority = 'baja' | 'media' | 'alta';

export interface StoredComplaint {
  id: string;
  description: string;
  mealPeriod: MealPeriod;
  category: ComplaintCategory;
  incidentDate: string;
  createdAt: string;
  submissionDate: string;
  imageUrl: string | null;
  imageFileName: string | null;
  imageSizeBytes: number | null;
  originalSizeBytes: number | null;
  deviceHash: string;
  deviceLabel: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  adminNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface AdminSessionPayload {
  sub: string;
  email: string;
  name: string;
  exp: number;
  sessionId?: string;
}

export const DAILY_LIMIT = 3;

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const VALID_MEAL_PERIODS = new Set<string>(['desayuno', 'almuerzo', 'cena']);
export const VALID_CATEGORIES = new Set<string>([
  'calidad_coccion',
  'temperatura',
  'higiene_limpieza',
  'tamano_porcion',
  'atencion_espera',
  'otros',
]);
export const VALID_STATUSES = new Set<string>([
  'pendiente',
  'en_revision',
  'resuelto',
  'archivado',
]);
export const VALID_PRIORITIES = new Set<string>(['baja', 'media', 'alta']);

export function getServerTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
