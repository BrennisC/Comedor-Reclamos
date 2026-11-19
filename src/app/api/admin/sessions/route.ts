import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import { prisma } from '@/api/lib/db';

export async function GET(req: NextRequest) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  try {
    const sessions = await prisma.adminSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        adminSub: true,
        email: true,
        name: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    const now = Date.now();
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        adminSub: s.adminSub,
        email: s.email,
        name: s.name,
        expiresAt: s.expiresAt.toISOString(),
        revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
        createdAt: s.createdAt.toISOString(),
        isCurrent: s.id === session.sessionId,
        isActive: !s.revokedAt && s.expiresAt.getTime() > now,
      })),
    });
  } catch (error) {
    console.error('Error listing admin sessions:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar las sesiones administrativas.' },
      { status: 500 }
    );
  }
}
