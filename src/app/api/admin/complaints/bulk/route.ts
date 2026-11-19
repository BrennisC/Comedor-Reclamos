import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import { prisma } from '@/api/lib/db';
import { VALID_PRIORITIES, VALID_STATUSES } from '@/api/types';

export async function PATCH(req: NextRequest) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      ids?: unknown;
      status?: unknown;
      priority?: unknown;
    };

    const ids = Array.isArray(body.ids)
      ? body.ids.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      : [];
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Selecciona al menos un reclamo para actualizar.' },
        { status: 400 }
      );
    }

    const data: {
      status?: string;
      priority?: string;
      reviewedAt: Date;
      reviewedBy: string;
    } = {
      reviewedAt: new Date(),
      reviewedBy: session.email,
    };

    if (typeof body.status === 'string' && VALID_STATUSES.has(body.status)) {
      data.status = body.status;
    }
    if (typeof body.priority === 'string' && VALID_PRIORITIES.has(body.priority)) {
      data.priority = body.priority;
    }

    if (!data.status && !data.priority) {
      return NextResponse.json(
        { error: 'Indica un estado o prioridad válidos para aplicar.' },
        { status: 400 }
      );
    }

    const updated = await prisma.complaint.updateMany({
      where: { id: { in: ids } },
      data,
    });

    revalidateTag('complaints', { expire: 0 });

    return NextResponse.json({ updatedCount: updated.count });
  } catch (error) {
    console.error('Error bulk updating complaints:', error);
    return NextResponse.json(
      { error: 'No se pudieron actualizar los reclamos seleccionados.' },
      { status: 500 }
    );
  }
}
