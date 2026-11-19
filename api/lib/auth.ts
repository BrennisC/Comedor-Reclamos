import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import type { AdminSessionPayload } from '../types';
import { prisma } from './db';

const ADMIN_COOKIE_NAME = 'comedor_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function safeEqualStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function hashPassword(
  password: string,
  existingSalt?: string
): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

function toSessionPayload(session: {
  id: string;
  adminSub: string;
  email: string;
  name: string;
  expiresAt: Date;
}): AdminSessionPayload {
  return {
    sub: session.adminSub,
    email: session.email,
    name: session.name,
    exp: Math.floor(session.expiresAt.getTime() / 1000),
    sessionId: session.id,
  };
}

export async function createAdminSession(admin: {
  id: string;
  email: string;
  name: string;
  adminUserId?: string | null;
}): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.adminSession.create({
    data: {
      token,
      adminSub: admin.id,
      email: admin.email,
      name: admin.name,
      adminUserId: admin.adminUserId ?? null,
      expiresAt,
    },
  });
  return token;
}

export async function getActiveAdminSession(
  token: string | null | undefined
): Promise<AdminSessionPayload | null> {
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({ where: { token } });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  return toSessionPayload(session);
}

export function getAdminSessionToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearer = authHeader.slice('Bearer '.length).trim();
    if (bearer) return bearer;
  }
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value?.trim();
  if (cookieToken) return cookieToken;
  const queryToken = req.nextUrl.searchParams.get('token')?.trim();
  if (queryToken) return queryToken;
  return null;
}

export async function extractAdminFromRequest(
  req: NextRequest
): Promise<AdminSessionPayload | null> {
  const token = getAdminSessionToken(req);
  return getActiveAdminSession(token);
}

export async function revokeAdminSession(token: string | null | undefined): Promise<void> {
  if (!token) return;
  await prisma.adminSession.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function setAdminSessionCookie(
  req: NextRequest,
  res: NextResponse,
  token: string
): void {
  const isHttps =
    req.headers.get('x-forwarded-proto') === 'https' ||
    req.nextUrl.protocol === 'https:';
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
  });
}

export function clearAdminSessionCookie(req: NextRequest, res: NextResponse): void {
  const isHttps =
    req.headers.get('x-forwarded-proto') === 'https' ||
    req.nextUrl.protocol === 'https:';
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
  });
}

export function getClientDeviceIp(req: NextRequest): {
  ip: string;
  source: 'X-Forwarded-For' | 'remoteAddress';
} {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const firstIp = xff.split(',')[0]?.trim();
    if (firstIp) {
      return { ip: firstIp, source: 'X-Forwarded-For' };
    }
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  return { ip: realIp || '127.0.0.1', source: 'remoteAddress' };
}

export function hashDeviceIp(ip: string): {
  deviceHash: string;
  deviceLabel: string;
} {
  const hash = crypto.createHash('sha256').update(ip).digest('hex');
  return {
    deviceHash: hash,
    deviceLabel: `disp-${hash.slice(0, 6)}`,
  };
}
