import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import {
  getBucketName,
  isNeonObjectStorageConfigured,
  listNeonObjectStorage,
} from '@/api/services/objectStorage';

export async function GET(req: NextRequest) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  const configured = isNeonObjectStorageConfigured();
  const bucket = getBucketName();
  if (!configured) {
    return NextResponse.json({ configured: false, bucket, images: [] });
  }

  try {
    const objects = await listNeonObjectStorage();
    const images = objects
      .filter((item) => item.key.toLowerCase().endsWith('.webp'))
      .sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0))
      .map((item) => ({
        key: item.key,
        url: `/api/uploads/${item.key}`,
        size: item.size,
        contentType: item.contentType,
        lastModified: item.lastModified,
      }));

    return NextResponse.json({ configured: true, bucket, images });
  } catch (error) {
    console.error('Neon Object Storage list failed:', error);
    return NextResponse.json(
      {
        configured: true,
        bucket,
        images: [],
        error: 'No se pudo listar el bucket de Neon Object Storage.',
      },
      { status: 502 }
    );
  }
}
