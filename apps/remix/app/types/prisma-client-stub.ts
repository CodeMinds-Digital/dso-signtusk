/**
 * Browser-safe stub for @prisma/client and @signtusk/prisma.
 * This file is used as an alias for these packages in the client bundle.
 * It re-exports the browser-safe enums from @signtusk/lib/constants/prisma-enums.
 */

// Re-export all browser-safe enums
export * from "@signtusk/lib/constants/prisma-enums";

// Browser-safe Decimal class for type compatibility
class BrowserDecimal {
  private value: number;
  constructor(value: string | number) {
    this.value = typeof value === "string" ? parseFloat(value) : value;
  }
  toNumber(): number {
    return this.value;
  }
  toString(): string {
    return String(this.value);
  }
  toFixed(digits?: number): string {
    return this.value.toFixed(digits);
  }
  valueOf(): number {
    return this.value;
  }
}

// Export Prisma namespace with stubs for type compatibility
export const Prisma = {
  Decimal: BrowserDecimal,
  JsonNull: Symbol.for("prisma.json.null"),
  DbNull: Symbol.for("prisma.db.null"),
  AnyNull: Symbol.for("prisma.any.null"),
  // Type helpers that might be used
  validator: () => ({}),
  getExtensionContext: () => ({}),
  defineExtension: (ext: unknown) => ext,
};

// Type exports for compatibility
export type InputJsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: InputJsonValue }
  | InputJsonValue[];

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// Decimal type for compatibility
export type Decimal = {
  toNumber(): number;
  toString(): string;
  toFixed(digits?: number): string;
  valueOf(): number;
};

export type DecimalJsLike = {
  d: number[];
  e: number;
  s: number;
  toFixed(): string;
};

// Export PrismaClient as a no-op for client-side
export class PrismaClient {
  constructor() {
    throw new Error("PrismaClient cannot be used in the browser");
  }
}

// ============================================
// Kysely stubs for @signtusk/prisma compatibility
// ============================================

// Stub Kysely class
export class Kysely<T = unknown> {
  constructor(_config?: unknown) {
    throw new Error("Kysely cannot be used in the browser");
  }
}

// Stub PostgresDialect
export class PostgresDialect {
  constructor(_config?: unknown) {
    throw new Error("PostgresDialect cannot be used in the browser");
  }
}

// Stub sql tagged template function
export const sql = Object.assign(
  (_strings: TemplateStringsArray, ..._values: unknown[]) => {
    throw new Error("sql cannot be used in the browser");
  },
  {
    raw: (_value: string) => {
      throw new Error("sql.raw cannot be used in the browser");
    },
    ref: (_value: string) => {
      throw new Error("sql.ref cannot be used in the browser");
    },
    table: (_value: string) => {
      throw new Error("sql.table cannot be used in the browser");
    },
    id: (..._values: string[]) => {
      throw new Error("sql.id cannot be used in the browser");
    },
    lit: (_value: unknown) => {
      throw new Error("sql.lit cannot be used in the browser");
    },
    join: (_values: unknown[], _separator?: unknown) => {
      throw new Error("sql.join cannot be used in the browser");
    },
  }
);

// Stub prisma and kysely instances
export const prisma = new Proxy(
  {},
  {
    get() {
      throw new Error("prisma cannot be used in the browser");
    },
  }
);

export const kysely = new Proxy(
  {},
  {
    get() {
      throw new Error("kysely cannot be used in the browser");
    },
  }
);

export const kyselyPrisma = {
  $kysely: kysely,
};

export const prismaWithLogging = prisma;

// Type exports for DB
export type DB = Record<string, unknown>;

export default {};
