import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest, hashPassword } from '@/api/lib/auth';
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
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error listing admin users:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los administradores.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      email?: unknown;
      name?: unknown;
      password?: unknown;
    };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Ingresa un correo electrónico válido.' },
        { status: 400 }
      );
    }
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Ingresa un nombre válido (mínimo 2 caracteres).' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const duplicate = await prisma.adminUser.findUnique({ where: { email } });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Ya existe un administrador registrado con ese correo.' },
        { status: 409 }
      );
    }

    const { salt, hash } = hashPassword(password);
    const created = await prisma.adminUser.create({
      data: {
        id: `adm_${crypto.randomBytes(5).toString('hex')}`,
        email,
        name,
        passwordHash: hash,
        passwordSalt: salt,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json(
      {
        user: {
          id: created.id,
          email: created.email,
          name: created.name,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'No se pudo registrar el nuevo administrador.' },
      { status: 500 }
    );
  }
}
