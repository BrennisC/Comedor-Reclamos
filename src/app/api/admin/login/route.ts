import { NextResponse, type NextRequest } from 'next/server';
import {
  createAdminSession,
  safeEqualStrings,
  setAdminSessionCookie,
  verifyPassword,
} from '@/api/lib/auth';
import { prisma } from '@/api/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Ingresa tu correo y contraseña.' },
        { status: 400 }
      );
    }

    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || '';
    const envPassword = process.env.ADMIN_PASSWORD?.trim() || '';
    const hasEnvAdmin = Boolean(envEmail && envPassword);

    if (hasEnvAdmin && safeEqualStrings(email, envEmail)) {
      if (!safeEqualStrings(password, envPassword)) {
        return NextResponse.json(
          { error: 'Correo o contraseña incorrectos.' },
          { status: 401 }
        );
      }
      const adminInfo = {
        id: 'adm_env',
        email: envEmail,
        name: 'Administrador Principal',
      };
      const token = await createAdminSession(adminInfo);
      const res = NextResponse.json({ admin: adminInfo, token });
      setAdminSessionCookie(req, res, token);
      return res;
    }

    const adminUser = await prisma.adminUser.findUnique({ where: { email } });
    if (adminUser) {
      const valid = verifyPassword(password, adminUser.passwordSalt, adminUser.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: 'Correo o contraseña incorrectos.' },
          { status: 401 }
        );
      }
      const adminInfo = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
      };
      const token = await createAdminSession({ ...adminInfo, adminUserId: adminUser.id });
      const res = NextResponse.json({
        admin: adminInfo,
        token,
      });
      setAdminSessionCookie(req, res, token);
      return res;
    }

    if (!hasEnvAdmin) {
      const dbAdminCount = await prisma.adminUser.count();
      if (dbAdminCount === 0) {
        return NextResponse.json(
          {
            error:
              'Credenciales de administrador no configuradas en el servidor. Define ADMIN_EMAIL y ADMIN_PASSWORD en las variables de entorno.',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Correo o contraseña incorrectos.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      { error: 'Error al validar credenciales de administrador.' },
      { status: 500 }
    );
  }
}
