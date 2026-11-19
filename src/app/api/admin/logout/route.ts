import { NextResponse, type NextRequest } from 'next/server';
import {
  clearAdminSessionCookie,
  getAdminSessionToken,
  revokeAdminSession,
} from '@/api/lib/auth';

export async function POST(req: NextRequest) {
  const token = getAdminSessionToken(req);
  await revokeAdminSession(token);
  const res = NextResponse.json({ ok: true });
  clearAdminSessionCookie(req, res);
  return res;
}
