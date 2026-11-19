import type { ComplaintsSummary } from '../types/complaint';

export type AdminSection = 'resumen' | 'bandeja' | 'reportes' | 'storage' | 'admins';

export interface AdminBannerMessage {
  type: 'ok' | 'error';
  text: string;
}

export const EMPTY_SUMMARY: ComplaintsSummary = {
  total: 0,
  byMealPeriod: { desayuno: 0, almuerzo: 0, cena: 0 },
  byCategory: {
    calidad_coccion: 0,
    temperatura: 0,
    higiene_limpieza: 0,
    tamano_porcion: 0,
    atencion_espera: 0,
    otros: 0,
  },
  byStatus: {
    pendiente: 0,
    en_revision: 0,
    resuelto: 0,
    archivado: 0,
  },
  byPriority: {
    baja: 0,
    media: 0,
    alta: 0,
  },
  dailyTrend: [],
  withPhotos: 0,
};
