import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import {
  extractAdminFromRequest,
  getClientDeviceIp,
  hashDeviceIp,
} from '@/api/lib/auth';
import {
  buildSummary,
  insertComplaintWithQuota,
  listComplaints,
  parseWebpDataUrl,
  toPublicComplaint,
} from '@/api/services/complaints';
import {
  deleteFromNeonObjectStorage,
  isNeonObjectStorageConfigured,
  uploadWebpToNeonObjectStorage,
} from '@/api/services/objectStorage';
import {
  buildEvidenceKey,
  evidenceKeyToUrl,
  evidenceLocalPath,
} from '@/api/lib/storageKeys';
import {
  DAILY_LIMIT,
  getServerTodayDate,
  VALID_CATEGORIES,
  VALID_MEAL_PERIODS,
  type ComplaintCategory,
  type MealPeriod,
  type StoredComplaint,
} from '@/api/types';

export async function GET(req: NextRequest) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  try {
    const sp = req.nextUrl.searchParams;
    const dateFilter = sp.get('date')?.trim() || '';
    const mealFilter = sp.get('mealPeriod')?.trim() || '';
    const categoryFilter = sp.get('category')?.trim() || '';
    const statusFilter = sp.get('status')?.trim() || '';
    const priorityFilter = sp.get('priority')?.trim() || '';
    const searchFilter = sp.get('q')?.trim() || '';

    const filtered = await listComplaints({
      date: dateFilter || undefined,
      mealPeriod: mealFilter || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      q: searchFilter || undefined,
    });

    return NextResponse.json({
      complaints: filtered.map(toPublicComplaint),
      summary: buildSummary(filtered),
    });
  } catch (error) {
    console.error('Error listing complaints:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los reclamos diarios.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ip, source } = getClientDeviceIp(req);
    const { deviceHash, deviceLabel } = hashDeviceIp(ip);
    const today = getServerTodayDate();

    const body = (await req.json()) as {
      description?: unknown;
      mealPeriod?: unknown;
      category?: unknown;
      incidentDate?: unknown;
      imageBase64?: unknown;
      imageFileName?: unknown;
      originalSizeBytes?: unknown;
    };

    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    const mealPeriod =
      typeof body.mealPeriod === 'string' ? body.mealPeriod.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const incidentDate =
      typeof body.incidentDate === 'string' ? body.incidentDate.trim() : '';

    if (description.length < 60) {
      return NextResponse.json(
        {
          error:
            'Describe tu reclamo con al menos 60 caracteres para poder clasificarlo.',
        },
        { status: 400 }
      );
    }

    if (description.length > 100) {
      return NextResponse.json(
        {
          error: 'El detalle del reclamo no puede superar los 100 caracteres.',
        },
        { status: 400 }
      );
    }

    if (!VALID_MEAL_PERIODS.has(mealPeriod)) {
      return NextResponse.json(
        {
          error: 'Selecciona si el reclamo corresponde a Desayuno, Almuerzo o Cena.',
        },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: 'Selecciona una categoría válida para el reporte diario.' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)) {
      return NextResponse.json(
        { error: 'Ingresa una fecha válida (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    const id = `rec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let imageUrl: string | null = null;
    let imageFileName: string | null = null;
    let imageSizeBytes: number | null = null;
    let originalSizeBytes: number | null = null;
    let storageKey: string | null = null;

    if (typeof body.imageBase64 === 'string' && body.imageBase64.length > 0) {
      const webpBuffer = parseWebpDataUrl(body.imageBase64);
      if (!webpBuffer) {
        return NextResponse.json(
          { error: 'La fotografía debe enviarse transformada en formato WebP válido.' },
          { status: 400 }
        );
      }

      storageKey = buildEvidenceKey({
        submissionDate: today,
        mealPeriod,
        category,
        id,
      });
      const localPath = evidenceLocalPath(storageKey);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, webpBuffer);
      imageUrl = evidenceKeyToUrl(storageKey);
      imageFileName =
        typeof body.imageFileName === 'string' && body.imageFileName.trim()
          ? body.imageFileName.trim()
          : path.basename(storageKey);
      imageSizeBytes = webpBuffer.length;
      originalSizeBytes =
        typeof body.originalSizeBytes === 'number' && body.originalSizeBytes > 0
          ? body.originalSizeBytes
          : webpBuffer.length;

      if (isNeonObjectStorageConfigured()) {
        try {
          await uploadWebpToNeonObjectStorage({
            key: storageKey,
            webpBuffer,
          });
        } catch (storageErr) {
          console.error('Neon Object Storage upload failed (kept local WebP):', storageErr);
        }
      }
    }

    const record: StoredComplaint = {
      id,
      description,
      mealPeriod: mealPeriod as MealPeriod,
      category: category as ComplaintCategory,
      incidentDate,
      createdAt: new Date().toISOString(),
      submissionDate: today,
      imageUrl,
      imageFileName,
      imageSizeBytes,
      originalSizeBytes,
      deviceHash,
      deviceLabel,
      status: 'pendiente',
      priority: category === 'higiene_limpieza' ? 'alta' : 'media',
      adminNote: null,
      reviewedAt: null,
      reviewedBy: null,
    };

    const result = await insertComplaintWithQuota(record);

    if (result.limitExceeded || !result.saved) {
      if (imageUrl && storageKey) {
        const uploadedPath = evidenceLocalPath(storageKey);
        if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
      }
      if (storageKey && isNeonObjectStorageConfigured()) {
        void deleteFromNeonObjectStorage(storageKey).catch(() => undefined);
      }
      const limitRes = NextResponse.json(
        {
          error:
            'Has alcanzado el máximo de 3 reclamos diarios permitidos para este dispositivo. Podrás registrar nuevos reclamos mañana.',
          quota: {
            usedToday: DAILY_LIMIT,
            limit: DAILY_LIMIT,
            remaining: 0,
            date: today,
            headerSource: source,
            deviceLabel,
          },
        },
        { status: 429 }
      );
      limitRes.headers.set('X-RateLimit-Limit', String(DAILY_LIMIT));
      limitRes.headers.set('X-RateLimit-Remaining', '0');
      return limitRes;
    }

    revalidateTag('complaints', { expire: 0 });

    const remaining = Math.max(0, DAILY_LIMIT - result.usedToday);
    const okRes = NextResponse.json(
      {
        complaint: toPublicComplaint(result.saved),
        quota: {
          usedToday: result.usedToday,
          limit: DAILY_LIMIT,
          remaining,
          date: today,
          headerSource: source,
          deviceLabel,
        },
      },
      { status: 201 }
    );
    okRes.headers.set('X-RateLimit-Limit', String(DAILY_LIMIT));
    okRes.headers.set('X-RateLimit-Remaining', String(remaining));
    return okRes;
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al guardar el reclamo en Neon DB.' },
      { status: 500 }
    );
  }
}
