import fs from 'node:fs';
import { NextResponse, type NextRequest } from 'next/server';
import { extractAdminFromRequest } from '@/api/lib/auth';
import { evidenceLocalPath, isValidEvidenceKey } from '@/api/lib/storageKeys';
import { downloadWebpFromNeonObjectStorage } from '@/api/services/objectStorage';

function webpResponse(buffer: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  const session = await extractAdminFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Inicia sesión como administrador para continuar.' },
      { status: 401 }
    );
  }

  const { key: segments } = await context.params;
  const key = (segments ?? []).join('/');
  if (!key || !isValidEvidenceKey(key)) {
    return NextResponse.json({ error: 'Nombre de archivo inválido.' }, { status: 400 });
  }

  const targetPath = evidenceLocalPath(key);
  if (fs.existsSync(targetPath)) {
    return webpResponse(fs.readFileSync(targetPath));
  }

  try {
    const neonBuffer = await downloadWebpFromNeonObjectStorage(key);
    if (neonBuffer) {
      return webpResponse(neonBuffer);
    }
  } catch (error) {
    console.error('Neon Object Storage download failed:', error);
  }

  return NextResponse.json({ error: 'Imagen no encontrada.' }, { status: 404 });
}
