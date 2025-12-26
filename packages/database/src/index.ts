export * from './client';
export * from './types';
export * from './utils';
export * from './migrate';
export * from './multi-tenant-service';
export * from './tenant-aware-operations';

// Re-export Prisma types
export type {
    User,
    Organization,
    Team,
    Document,
    Template,
    Recipient,
    Signature,
    Activity,
    Subscription,
    UsageRecord,
} from '@prisma/client';

// Re-export Prisma enums as both types and values
export {
    DocumentStatus,
    SigningStatus,
    RecipientStatus,
    FieldType,
    SignatureType,
    AuthMethod,
    ActivityType,
    DeliveryStatus,
    SubscriptionStatus,
} from '@prisma/client';

// Re-export PrismaClient
export { PrismaClient } from '@prisma/client';