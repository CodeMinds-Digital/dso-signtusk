/// <reference types="@signtusk/prisma/types/types.d.ts" />
import { PrismaClient } from "@prisma/client";
import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import kyselyExtension from "prisma-extension-kysely";

import type { DB } from "./generated/types.js";

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
    process.env.NEXT_PRIVATE_DIRECT_DATABASE_URL =
      process.env.DATABASE_URL_UNPOOLED;
  }

  if (process.env.POSTGRES_PRISMA_URL) {
    process.env.NEXT_PRIVATE_DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  }

  if (process.env.POSTGRES_URL_NON_POOLING) {
    process.env.NEXT_PRIVATE_DIRECT_DATABASE_URL =
      process.env.POSTGRES_URL_NON_POOLING;
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
export const prisma = remember(
  "prisma",
  () =>
    new PrismaClient({
      datasourceUrl: getDatabaseUrl(),
    })
);

// Create Kysely instance using prisma-extension-kysely (no direct pg dependency)
export const kyselyPrisma = remember("kyselyPrisma", () =>
  prisma.$extends(
    kyselyExtension({
      kysely: (driver) =>
        new Kysely<DB>({
          dialect: {
            createAdapter: () => new PostgresAdapter(),
            createDriver: () => driver,
            createIntrospector: (db) => new PostgresIntrospector(db),
            createQueryCompiler: () => new PostgresQueryCompiler(),
          },
        }),
    })
  )
);

// For backward compatibility - expose kysely through kyselyPrisma
export const kysely = {
  get $kysely() {
    return kyselyPrisma.$kysely;
  },
};

export const prismaWithLogging = prisma;

// Export sql function from kysely
export { sql } from "kysely";

// Export Prisma types for server-side code only
// Note: Do NOT use "export * from '@prisma/client'" as it causes browser bundling issues
export type { PrismaClient } from "@prisma/client";
export type { DB } from "./generated/types.js";

// Re-export specific items needed by server code
export { Prisma } from "@prisma/client";
