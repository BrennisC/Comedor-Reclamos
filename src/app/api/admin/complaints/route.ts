import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import {
  buildSummary,
  listComplaints,
  toPublicComplaint,
} from '@/api/services/complaints';

export async function GET(req: NextRequest) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  try {
    const sp = req.nextUrl.searchParams;
    const dateFilter = sp.get('date')?.trim() || '';
    const mealFilter = sp.get('mealPeriod')?.trim() || '';
    const categoryFilter = sp.get('category')?.trim() || '';
    const statusFilter = sp.get('status')?.trim() || '';
    const priorityFilter = sp.get('priority')?.trim() || '';
    const searchFilter = sp.get('q')?.trim() || '';

    const filtered = await listComplaints({
      date: dateFilter || undefined,
      mealPeriod: mealFilter || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      q: searchFilter || undefined,
    });

    return NextResponse.json({
      complaints: filtered.map(toPublicComplaint),
      summary: buildSummary(filtered),
    });
  } catch (error) {
    console.error('Error listing complaints:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los reclamos diarios.' },
      { status: 500 }
    );
  }
}
