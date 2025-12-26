/// <reference types="@signtusk/prisma/types/types.d.ts" />
import { PrismaClient } from '@prisma/client';
import { sql } from 'kysely';

// Simple database URL helper (inline to avoid import issues)
const getDatabaseUrl = () => {
  if (process.env.NEXT_PRIVATE_DATABASE_URL) {
    return process.env.NEXT_PRIVATE_DATABASE_URL;
  }

  if (process.env.POSTGRES_URL) {
    process.env.NEXT_PRIVATE_DATABASE_URL = process.env.POSTGRES_URL;
    process.env.NEXT_PRIVATE_DIRECT_DATABASE_URL = process.env.POSTGRES_URL;
  }

  if (process.env.DATABASE_URL) {
    process.env.NEXT_PRIVATE_DATABASE_URL = process.env.DATABASE_URL;
    process.env.NEXT_PRIVATE_DIRECT_DATABASE_URL = process.env.DATABASE_URL;
  }

  if (process.env.DATABASE_URL_UNPOOLED) {
    process.env.NEXT_PRIVATE_DIRECT_DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
  }

  if (process.env.POSTGRES_PRISMA_URL) {
    process.env.NEXT_PRIVATE_DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  }

  if (process.env.POSTGRES_URL_NON_POOLING) {
    process.env.NEXT_PRIVATE_DIRECT_DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING;
  }

  return process.env.NEXT_PRIVATE_DATABASE_URL;
};

// Simple remember function (inline to avoid import issues)
function remember<T>(name: string, getValue: () => T): T {
  const globalForPrisma = globalThis as unknown as { [key: string]: any };

  if (!globalForPrisma[name]) {
    globalForPrisma[name] = getValue();
  }

  return globalForPrisma[name];
}

// Export simple Prisma client
export const prisma = remember('prisma', () =>
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
  })
);

// For compatibility with existing code, export a simple version without Kysely
export const kyselyPrisma = prisma;
export const prismaWithLogging = prisma;

// Export sql function
export { sql };

// Export types for compatibility
export type { PrismaClient } from '@prisma/client';
export * from '@prisma/client';