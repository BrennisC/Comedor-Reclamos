import fs from 'node:fs';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import { evidenceKeyFromUrl, evidenceLocalPath } from '@/api/lib/storageKeys';
import { deleteComplaintById } from '@/api/services/complaints';
import { deleteFromNeonObjectStorage } from '@/api/services/objectStorage';

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
    const removed = await deleteComplaintById(id);
    if (!removed) {
      return NextResponse.json({ error: 'Reclamo no encontrado.' }, { status: 404 });
    }

    const storageKey = evidenceKeyFromUrl(removed.imageUrl);
    if (storageKey) {
      const filePath = evidenceLocalPath(storageKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await deleteFromNeonObjectStorage(storageKey).catch(() => undefined);
    }

    revalidateTag('complaints', { expire: 0 });

    return NextResponse.json({ deleted: true, id: removed.id });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar el reclamo.' },
      { status: 500 }
    );
  }
}
