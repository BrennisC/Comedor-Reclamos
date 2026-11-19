import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import { prisma } from '@/api/lib/db';

export async function DELETE(
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
    const existing = await prisma.adminSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Sesión no encontrada.' }, { status: 404 });
    }

    if (existing.revokedAt) {
      return NextResponse.json({ ok: true, revoked: true, alreadyRevoked: true });
    }

    await prisma.adminSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      revoked: true,
      revokedCurrent: id === session.sessionId,
    });
  } catch (error) {
    console.error('Error revoking admin session:', error);
    return NextResponse.json(
      { error: 'No se pudo revocar la sesión administrativa.' },
      { status: 500 }
    );
  }
}
