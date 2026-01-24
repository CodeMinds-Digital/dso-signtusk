export * from "./client";
export * from "./migrate";
export * from "./multi-tenant-service";
export * from "./tenant-aware-operations";
export * from "./types";
export * from "./utils";

// Re-export Prisma types
export type {
  Organisation,
  Recipient,
  Signature,
  Subscription,
  Team,
  User,
} from "@prisma/client";

// Create alias for American spelling
export type { Organisation as Organization } from "@prisma/client";

// Re-export Prisma enums as both types and values
export {
  DocumentStatus,
  FieldType,
  ReadStatus,
  RecipientRole,
  SendStatus,
  SigningStatus,
  SubscriptionStatus,
} from "@prisma/client";

// Re-export PrismaClient
export { PrismaClient } from "@prisma/client";
