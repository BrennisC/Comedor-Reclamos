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

export interface ComplaintRecord {
  id: string;
  description: string;
  mealPeriod: MealPeriod;
  category: ComplaintCategory;
  incidentDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  imageUrl: string | null;
  imageFileName: string | null;
  imageSizeBytes: number | null;
  originalSizeBytes: number | null;
  deviceLabel: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  adminNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface QuotaStatus {
  usedToday: number;
  limit: number;
  remaining: number;
  date: string;
  headerSource: 'X-Forwarded-For' | 'remoteAddress';
  deviceLabel: string;
}

export interface DailyTrendPoint {
  date: string;
  total: number;
  resolved: number;
}

export interface ComplaintsSummary {
  total: number;
  byMealPeriod: Record<MealPeriod, number>;
  byCategory: Record<ComplaintCategory, number>;
  byStatus: Record<ComplaintStatus, number>;
  byPriority: Record<ComplaintPriority, number>;
  dailyTrend: DailyTrendPoint[];
  withPhotos: number;
}

export interface AdminUserInfo {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface AdminSessionState {
  authenticated: boolean;
  needsSetup: boolean;
  adminEnvConfigured?: boolean;
  admin: AdminUserInfo | null;
}

export const MEAL_PERIODS: {
  id: MealPeriod;
  label: string;
  schedule: string;
}[] = [
  { id: 'desayuno', label: 'Desayuno', schedule: '07:00 – 08:00' },
  { id: 'almuerzo', label: 'Almuerzo', schedule: '12:00 – 14:00' },
  { id: 'cena', label: 'Cena', schedule: '18:00 – 20:00' },
];

export const COMPLAINT_CATEGORIES: {
  id: ComplaintCategory;
  label: string;
  hint: string;
}[] = [
  {
    id: 'calidad_coccion',
    label: 'Calidad y cocción',
    hint: 'Alimentos crudos, quemados, pasados o mal sabor',
  },
  {
    id: 'temperatura',
    label: 'Temperatura',
    hint: 'Platos fríos, sopas tibias o bebidas sin refrigerar',
  },
  {
    id: 'higiene_limpieza',
    label: 'Higiene y limpieza',
    hint: 'Bandejas, cubiertos, mesas o presencia de objetos extraños',
  },
  {
    id: 'tamano_porcion',
    label: 'Tamaño de porción',
    hint: 'Ración insuficiente o faltante de proteína / guarnición',
  },
  {
    id: 'atencion_espera',
    label: 'Atención y tiempos',
    hint: 'Demora excesiva en fila, trato o desabastecimiento',
  },
  {
    id: 'otros',
    label: 'Otros / Sugerencia',
    hint: 'Variedad del menú, señalización u otra observación',
  },
];

export const COMPLAINT_STATUSES: {
  id: ComplaintStatus;
  label: string;
}[] = [
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'en_revision', label: 'En revisión' },
  { id: 'resuelto', label: 'Resuelto' },
  { id: 'archivado', label: 'Archivado' },
];

export const COMPLAINT_PRIORITIES: {
  id: ComplaintPriority;
  label: string;
}[] = [
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Media' },
  { id: 'baja', label: 'Baja' },
];

export function getCategoryLabel(category: ComplaintCategory): string {
  return (
    COMPLAINT_CATEGORIES.find((c) => c.id === category)?.label ?? category
  );
}

export function getMealPeriodLabel(mealPeriod: MealPeriod): string {
  return MEAL_PERIODS.find((m) => m.id === mealPeriod)?.label ?? mealPeriod;
}

export function getStatusLabel(status: ComplaintStatus): string {
  return COMPLAINT_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function getPriorityLabel(priority: ComplaintPriority): string {
  return COMPLAINT_PRIORITIES.find((p) => p.id === priority)?.label ?? priority;
}

export function getDefaultMealPeriod(): MealPeriod {
  const hour = new Date().getHours();
  if (hour < 11) return 'desayuno';
  if (hour < 17) return 'almuerzo';
  return 'cena';
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
