import { PrismaClient } from '@prisma/client';

declare global {
    var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
    datasourceUrl: process.env.NEXT_PRIVATE_DATABASE_URL || process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

// Export types for compatibility
export type { PrismaClient } from '@prisma/client';
export * from '@prisma/client';