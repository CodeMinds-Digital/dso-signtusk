/**
 * Browser-safe stub for @prisma/client.
 * This file is used as an alias for @prisma/client in the client bundle.
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

export default {};
