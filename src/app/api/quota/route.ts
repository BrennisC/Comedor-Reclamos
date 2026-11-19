import { NextResponse, type NextRequest } from 'next/server';
import { getClientDeviceIp, hashDeviceIp } from '@/api/lib/auth';
import { countTodayByDevice } from '@/api/services/complaints';
import { DAILY_LIMIT, getServerTodayDate } from '@/api/types';

export async function GET(req: NextRequest) {
  try {
    const { ip, source } = getClientDeviceIp(req);
    const { deviceHash, deviceLabel } = hashDeviceIp(ip);
    const today = getServerTodayDate();
    const usedToday = await countTodayByDevice(deviceHash, today);
    const remaining = Math.max(0, DAILY_LIMIT - usedToday);

    const res = NextResponse.json({
      usedToday,
      limit: DAILY_LIMIT,
      remaining,
      date: today,
      headerSource: source,
      deviceLabel,
    });
    res.headers.set('X-RateLimit-Limit', String(DAILY_LIMIT));
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    return res;
  } catch (error) {
    console.error('Error checking quota:', error);
    return NextResponse.json(
      { error: 'No se pudo verificar el límite diario del dispositivo.' },
      { status: 500 }
    );
  }
}
