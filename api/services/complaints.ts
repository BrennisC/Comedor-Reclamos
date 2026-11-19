import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from '../lib/db';
import {
  DAILY_LIMIT,
  VALID_PRIORITIES,
  VALID_STATUSES,
  type ComplaintCategory,
  type ComplaintPriority,
  type ComplaintStatus,
  type MealPeriod,
  type StoredComplaint,
} from '../types';

export function mapPrismaComplaint(row: {
  id: string;
  description: string;
  mealPeriod: string;
  category: string;
  incidentDate: string;
  createdAt: Date;
  submissionDate: string;
  imageUrl: string | null;
  imageFileName: string | null;
  imageSizeBytes: number | null;
  originalSizeBytes: number | null;
  deviceHash: string;
  deviceLabel: string;
  status: string;
  priority: string;
  adminNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}): StoredComplaint {
  return {
    id: row.id,
    description: row.description,
    mealPeriod: row.mealPeriod as MealPeriod,
    category: row.category as ComplaintCategory,
    incidentDate: row.incidentDate,
    createdAt: row.createdAt.toISOString(),
    submissionDate: row.submissionDate,
    imageUrl: row.imageUrl,
    imageFileName: row.imageFileName,
    imageSizeBytes: row.imageSizeBytes,
    originalSizeBytes: row.originalSizeBytes,
    deviceHash: row.deviceHash,
    deviceLabel: row.deviceLabel,
    status: (VALID_STATUSES.has(row.status) ? row.status : 'pendiente') as ComplaintStatus,
    priority: (VALID_PRIORITIES.has(row.priority) ? row.priority : 'media') as ComplaintPriority,
    adminNote: row.adminNote,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    reviewedBy: row.reviewedBy,
  };
}

export async function countTodayByDevice(
  deviceHash: string,
  submissionDate: string
): Promise<number> {
  return await prisma.complaint.count({
    where: {
      deviceHash,
      submissionDate,
    },
  });
}

export async function listComplaints(filters: {
  date?: string;
  mealPeriod?: string;
  category?: string;
  status?: string;
  priority?: string;
  q?: string;
}): Promise<StoredComplaint[]> {
  'use cache';
  cacheTag('complaints');
  cacheLife({ stale: 30, revalidate: 30, expire: 120 });

  const rows = await prisma.complaint.findMany({
    where: {
      ...(filters.date ? { incidentDate: filters.date } : {}),
      ...(filters.mealPeriod ? { mealPeriod: filters.mealPeriod } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.q
        ? {
            OR: [
              {
                description: {
                  contains: filters.q,
                  mode: 'insensitive',
                },
              },
              {
                adminNote: {
                  contains: filters.q,
                  mode: 'insensitive',
                },
              },
              {
                deviceLabel: {
                  contains: filters.q,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return rows.map(mapPrismaComplaint);
}

export async function insertComplaintWithQuota(
  record: StoredComplaint
): Promise<
  | { limitExceeded: true; usedToday: number; saved: null }
  | { limitExceeded: false; usedToday: number; saved: StoredComplaint }
> {
  return await prisma.$transaction(async (tx) => {
    const usedToday = await tx.complaint.count({
      where: {
        deviceHash: record.deviceHash,
        submissionDate: record.submissionDate,
      },
    });
    if (usedToday >= DAILY_LIMIT) {
      return { limitExceeded: true as const, usedToday, saved: null };
    }
    const created = await tx.complaint.create({
      data: {
        id: record.id,
        description: record.description,
        mealPeriod: record.mealPeriod,
        category: record.category,
        incidentDate: record.incidentDate,
        createdAt: new Date(record.createdAt),
        submissionDate: record.submissionDate,
        imageUrl: record.imageUrl,
        imageFileName: record.imageFileName,
        imageSizeBytes: record.imageSizeBytes,
        originalSizeBytes: record.originalSizeBytes,
        deviceHash: record.deviceHash,
        deviceLabel: record.deviceLabel,
        status: record.status,
        priority: record.priority,
        adminNote: record.adminNote,
        reviewedAt: record.reviewedAt ? new Date(record.reviewedAt) : null,
        reviewedBy: record.reviewedBy,
      },
    });
    return {
      limitExceeded: false as const,
      usedToday: usedToday + 1,
      saved: mapPrismaComplaint(created),
    };
  });
}

export async function deleteComplaintById(
  id: string
): Promise<StoredComplaint | null> {
  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) return null;
  const deleted = await prisma.complaint.delete({
    where: { id },
  });
  return mapPrismaComplaint(deleted);
}

export function toPublicComplaint(record: StoredComplaint) {
  return {
    id: record.id,
    description: record.description,
    mealPeriod: record.mealPeriod,
    category: record.category,
    incidentDate: record.incidentDate,
    createdAt: record.createdAt,
    imageUrl: record.imageUrl,
    imageFileName: record.imageFileName,
    imageSizeBytes: record.imageSizeBytes,
    originalSizeBytes: record.originalSizeBytes,
    deviceLabel: record.deviceLabel,
    status: record.status,
    priority: record.priority,
    adminNote: record.adminNote,
    reviewedAt: record.reviewedAt,
    reviewedBy: record.reviewedBy,
  };
}

export function buildSummary(records: StoredComplaint[]) {
  const byMealPeriod: Record<MealPeriod, number> = {
    desayuno: 0,
    almuerzo: 0,
    cena: 0,
  };
  const byCategory: Record<ComplaintCategory, number> = {
    calidad_coccion: 0,
    temperatura: 0,
    higiene_limpieza: 0,
    tamano_porcion: 0,
    atencion_espera: 0,
    otros: 0,
  };
  const byStatus: Record<ComplaintStatus, number> = {
    pendiente: 0,
    en_revision: 0,
    resuelto: 0,
    archivado: 0,
  };
  const byPriority: Record<ComplaintPriority, number> = {
    baja: 0,
    media: 0,
    alta: 0,
  };

  const dailyMap = new Map<
    string,
    { date: string; total: number; resolved: number }
  >();
  let withPhotos = 0;

  for (const item of records) {
    if (item.mealPeriod in byMealPeriod) {
      byMealPeriod[item.mealPeriod] += 1;
    }
    if (item.category in byCategory) {
      byCategory[item.category] += 1;
    }
    if (item.status in byStatus) {
      byStatus[item.status] += 1;
    }
    if (item.priority in byPriority) {
      byPriority[item.priority] += 1;
    }
    if (item.imageUrl) withPhotos += 1;

    const currentDay = dailyMap.get(item.incidentDate) ?? {
      date: item.incidentDate,
      total: 0,
      resolved: 0,
    };
    currentDay.total += 1;
    if (item.status === 'resuelto' || item.status === 'archivado') {
      currentDay.resolved += 1;
    }
    dailyMap.set(item.incidentDate, currentDay);
  }

  const dailyTrend = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    total: records.length,
    byMealPeriod,
    byCategory,
    byStatus,
    byPriority,
    dailyTrend,
    withPhotos,
  };
}

export function parseWebpDataUrl(dataUrl: string): Buffer | null {
  const prefix = 'data:image/webp;base64,';
  if (!dataUrl.startsWith(prefix)) {
    return null;
  }
  const base64Body = dataUrl.slice(prefix.length);
  const buffer = Buffer.from(base64Body, 'base64');
  if (buffer.length < 12) return null;
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    return null;
  }
  return buffer;
}
