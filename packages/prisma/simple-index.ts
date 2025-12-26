import { PrismaClient } from '@prisma/client';

// Simple database URL helper
const getDatabaseUrl = () => {
    return process.env.NEXT_PRIVATE_DATABASE_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        'postgresql://postgres:password@localhost:5432/signtusk_dev';
};

// Simple remember function
const remember = <T>(name: string, getValue: () => T): T => {
    const globalForPrisma = globalThis as unknown as { [key: string]: any };

    if (!globalForPrisma[name]) {
        globalForPrisma[name] = getValue();
    }

    return globalForPrisma[name];
};

// Export simple Prisma client
export const prisma = remember('prisma', () =>
    new PrismaClient({
        datasourceUrl: getDatabaseUrl(),
    })
);

// Export types for compatibility
export type { PrismaClient } from '@prisma/client';
export * from '@prisma/client';