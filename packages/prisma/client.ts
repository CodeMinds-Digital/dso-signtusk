// Named exports for better ESM compatibility
export {
    PrismaClient,
    Prisma,
    // Enums commonly used in the codebase
    FieldType,
    RecipientRole,
    DocumentStatus,
    SendStatus,
    SigningStatus,
    EnvelopeType,
    SubscriptionStatus,
    UserSecurityAuditLogType,
    OrganisationMemberInviteStatus,
    OrganisationType,
    EmailDomainStatus,
} from '@prisma/client';

// Type exports
export type {
    PrismaPromise,
    Envelope,
    Recipient,
    User,
    OrganisationEmail,
} from '@prisma/client';

// Re-export the main client instance from index
export { prisma, kyselyPrisma, prismaWithLogging } from './index';