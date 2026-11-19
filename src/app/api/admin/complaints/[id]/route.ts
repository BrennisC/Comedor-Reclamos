import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import { prisma } from '@/api/lib/db';
import { mapPrismaComplaint, toPublicComplaint } from '@/api/services/complaints';
import { VALID_PRIORITIES, VALID_STATUSES } from '@/api/types';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = (await req.json()) as {
      status?: unknown;
      priority?: unknown;
      adminNote?: unknown;
    };

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Reclamo no encontrado.' }, { status: 404 });
    }

    const nextStatus =
      typeof body.status === 'string' && VALID_STATUSES.has(body.status)
        ? body.status
        : existing.status;
    const nextPriority =
      typeof body.priority === 'string' && VALID_PRIORITIES.has(body.priority)
        ? body.priority
        : existing.priority;
    const nextNote =
      typeof body.adminNote === 'string'
        ? body.adminNote.trim() || null
        : body.adminNote === null
          ? null
          : existing.adminNote;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: nextStatus,
        priority: nextPriority,
        adminNote: nextNote,
        reviewedAt: new Date(),
        reviewedBy: session.email,
      },
    });

    revalidateTag('complaints', { expire: 0 });

    return NextResponse.json({ complaint: toPublicComplaint(mapPrismaComplaint(updated)) });
  } catch (error) {
    console.error('Error updating complaint workflow:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar la organización del reclamo.' },
      { status: 500 }
    );
  }
}
