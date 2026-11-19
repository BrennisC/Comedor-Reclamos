import type {
  AdminSessionState,
  AdminUserInfo,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintRecord,
  ComplaintsSummary,
  ComplaintStatus,
  MealPeriod,
  QuotaStatus,
} from '../types/complaint';

export interface ComplaintFilters {
  date: string;
  mealPeriod: MealPeriod | '';
  category: ComplaintCategory | '';
  status: ComplaintStatus | '';
  priority: ComplaintPriority | '';
  q: string;
}

export interface CreateComplaintInput {
  description: string;
  mealPeriod: MealPeriod;
  category: ComplaintCategory;
  incidentDate: string;
  imageBase64?: string;
  imageFileName?: string;
  originalSizeBytes?: number;
}

const ADMIN_TOKEN_STORAGE_KEY = 'comedor_admin_token';
let memoryAdminToken: string | null = null;

export function getAdminToken(): string | null {
  if (memoryAdminToken) return memoryAdminToken;
  try {
    const stored = window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (stored) {
      memoryAdminToken = stored;
      return stored;
    }
  } catch {
    // Ignore storage access errors in restricted frames
  }
  return null;
}

export function setAdminToken(token: string | null): void {
  memoryAdminToken = token;
  try {
    if (token) {
      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getProtectedImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const token = getAdminToken();
  if (!token) return imageUrl;
  const sep = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${sep}token=${encodeURIComponent(token)}`;
}

export const queryKeys = {
  quota: ['quota'] as const,
  adminSession: ['adminSession'] as const,
  adminUsers: ['adminUsers'] as const,
  storageImages: ['storageImages'] as const,
  complaints: (filters: ComplaintFilters) => ['complaints', filters] as const,
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchQuota(): Promise<QuotaStatus> {
  const res = await fetch('/api/quota');
  if (!res.ok) {
    throw new Error('No se pudo obtener el estado del límite diario.');
  }
  return (await res.json()) as QuotaStatus;
}

export async function fetchAdminSession(): Promise<AdminSessionState> {
  const res = await fetch('/api/admin/session', {
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('No se pudo verificar la sesión del administrador.');
  }
  return (await res.json()) as AdminSessionState;
}

export async function loginAdmin(input: {
  email: string;
  password: string;
}): Promise<{ admin: AdminUserInfo; token: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { error?: string; admin?: AdminUserInfo; token?: string };
  if (!res.ok || !data.admin || !data.token) {
    throw new ApiError(data.error || 'Credenciales incorrectas.', res.status);
  }
  setAdminToken(data.token);
  return { admin: data.admin, token: data.token };
}

export async function logoutAdmin(): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  }).catch(() => undefined);
  setAdminToken(null);
}

export async function fetchComplaints(
  filters: ComplaintFilters
): Promise<{ complaints: ComplaintRecord[]; summary: ComplaintsSummary }> {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.mealPeriod) params.set('mealPeriod', filters.mealPeriod);
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.q.trim()) params.set('q', filters.q.trim());

  const qs = params.toString();
  const res = await fetch(`/api/admin/complaints${qs ? `?${qs}` : ''}`, {
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(data.error || 'No se pudieron cargar los reclamos diarios.', res.status);
  }
  return (await res.json()) as {
    complaints: ComplaintRecord[];
    summary: ComplaintsSummary;
  };
}

export async function createComplaint(
  input: CreateComplaintInput
): Promise<{ complaint: ComplaintRecord; quota: QuotaStatus }> {
  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = (await res.json()) as {
    error?: string;
    complaint?: ComplaintRecord;
    quota?: QuotaStatus;
  };

  if (!res.ok || !payload.complaint || !payload.quota) {
    throw new ApiError(payload.error || 'No se pudo registrar el reclamo.', res.status);
  }

  return {
    complaint: payload.complaint,
    quota: payload.quota,
  };
}

export async function updateComplaintWorkflow(params: {
  id: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  adminNote?: string | null;
}): Promise<ComplaintRecord> {
  const res = await fetch(`/api/admin/complaints/${params.id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify({
      status: params.status,
      priority: params.priority,
      adminNote: params.adminNote,
    }),
  });
  const data = (await res.json()) as { error?: string; complaint?: ComplaintRecord };
  if (!res.ok || !data.complaint) {
    throw new ApiError(data.error || 'No se pudo actualizar el reclamo.', res.status);
  }
  return data.complaint;
}

export async function bulkUpdateComplaints(params: {
  ids: string[];
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
}): Promise<{ updatedCount: number }> {
  const res = await fetch('/api/admin/complaints/bulk', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as { error?: string; updatedCount?: number };
  if (!res.ok || typeof data.updatedCount !== 'number') {
    throw new ApiError(data.error || 'No se pudo aplicar la actualización masiva.', res.status);
  }
  return { updatedCount: data.updatedCount };
}

export async function deleteComplaint(id: string): Promise<void> {
  const res = await fetch(`/api/complaints/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(data.error || 'No se pudo eliminar el registro.', res.status);
  }
}

export async function fetchAdminUsers(): Promise<AdminUserInfo[]> {
  const res = await fetch('/api/admin/users', {
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  });
  const data = (await res.json()) as { error?: string; users?: AdminUserInfo[] };
  if (!res.ok || !data.users) {
    throw new ApiError(data.error || 'No se pudieron cargar los administradores.', res.status);
  }
  return data.users;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminUserInfo> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { error?: string; user?: AdminUserInfo };
  if (!res.ok || !data.user) {
    throw new ApiError(data.error || 'No se pudo crear el administrador.', res.status);
  }
  return data.user;
}

export interface StorageImageInfo {
  key: string;
  url: string;
  size: number;
  contentType: string;
  lastModified?: number;
}

export interface StorageImagesResponse {
  configured: boolean;
  bucket?: string;
  images: StorageImageInfo[];
  error?: string;
}

export async function fetchStorageImages(): Promise<StorageImagesResponse> {
  const res = await fetch('/api/admin/storage', {
    credentials: 'include',
    headers: getAdminAuthHeaders(),
  });
  const data = (await res.json().catch(() => ({}))) as StorageImagesResponse & { error?: string };
  if (!res.ok) {
    throw new ApiError(data.error || 'No se pudieron cargar las imágenes de Neon.', res.status);
  }
  return {
    configured: Boolean(data.configured),
    bucket: data.bucket,
    images: Array.isArray(data.images) ? data.images : [],
    error: data.error,
  };
}
