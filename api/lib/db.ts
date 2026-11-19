import 'dotenv/config';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

export const databaseUrl =
  process.env.DATABASE_URL?.trim() || process.env.NEON_DATABASE_URL?.trim() || '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured for Neon PostgreSQL via Prisma.');
}

if (typeof globalThis.WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

declare global {
  var _prismaClient: PrismaClient | undefined;
}

function getPrisma(): PrismaClient {
  if (!globalThis._prismaClient) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    globalThis._prismaClient = new PrismaClient({ adapter });
  }
  return globalThis._prismaClient;
}

export const prisma = getPrisma();
