import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const adminEnvConfigured = Boolean(
      process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim()
    );
    const session = await extractAdminFromRequest(req);
    return NextResponse.json({
      authenticated: Boolean(session),
      needsSetup: false,
      adminEnvConfigured,
      admin: session
        ? { id: session.sub, email: session.email, name: session.name }
        : null,
    });
  } catch (error) {
    console.error('Error checking admin session:', error);
    return NextResponse.json(
      { error: 'No se pudo verificar la sesión administrativa.' },
      { status: 500 }
    );
  }
}
