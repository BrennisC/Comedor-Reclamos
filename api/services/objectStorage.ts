import { Files } from 'files-sdk';
import { neon } from 'files-sdk/neon';

const DEFAULT_BUCKET = 'uploads';

export function getBucketName(): string {
  return process.env.NEON_OBJECT_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
}

let cachedFiles: Files | null | undefined;

function isConfigured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      process.env.AWS_ENDPOINT_URL_S3?.trim() &&
      process.env.AWS_REGION?.trim()
  );
}

function getFiles(): Files | null {
  if (cachedFiles !== undefined) return cachedFiles;
  if (!isConfigured()) {
    cachedFiles = null;
    return cachedFiles;
  }
  cachedFiles = new Files({ adapter: neon({ bucket: getBucketName() }) });
  return cachedFiles;
}

export function isNeonObjectStorageConfigured(): boolean {
  return isConfigured();
}

export async function uploadWebpToNeonObjectStorage(params: {
  key: string;
  webpBuffer: Buffer;
}): Promise<boolean> {
  const files = getFiles();
  if (!files) return false;
  await files.upload(params.key, params.webpBuffer, { contentType: 'image/webp' });
  return true;
}

export async function downloadWebpFromNeonObjectStorage(
  key: string
): Promise<Buffer | null> {
  const files = getFiles();
  if (!files) return null;
  try {
    const file = await files.download(key);
    const bytes = new Uint8Array(await file.arrayBuffer());
    return Buffer.from(bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not.?found|404|no such key|nosuchkey/i.test(message)) {
      return null;
    }
    throw error;
  }
}

export async function deleteFromNeonObjectStorage(key: string): Promise<boolean> {
  const files = getFiles();
  if (!files) return false;
  try {
    await files.delete(key);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not.?found|404|no such key|nosuchkey/i.test(message)) {
      return false;
    }
    throw error;
  }
}

export interface StoredObjectInfo {
  key: string;
  size: number;
  contentType: string;
  lastModified?: number;
}

export async function listNeonObjectStorage(prefix?: string): Promise<StoredObjectInfo[]> {
  const files = getFiles();
  if (!files) return [];
  const page = await files.list(prefix ? { prefix } : undefined);
  return page.items.map((item) => ({
    key: item.key,
    size: item.size,
    contentType: item.contentType,
    lastModified: item.lastModified,
  }));
}
