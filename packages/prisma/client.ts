// Named exports for better ESM compatibility
export {
    DocumentStatus, EmailDomainStatus, EnvelopeType,
    // Enums commonly used in the codebase
    FieldType, OrganisationMemberInviteStatus,
    OrganisationType, Prisma, PrismaClient, RecipientRole, SendStatus,
    SigningStatus, SubscriptionStatus,
    UserSecurityAuditLogType
} from '@prisma/client';

// Type exports
export type {
    DocumentMeta,
    EmailDomain, Envelope, Organisation, OrganisationClaim, OrganisationEmail, OrganisationGlobalSettings, PrismaPromise, Recipient,
    User
} from '@prisma/client';

// Re-export the main client instance from index
export { kyselyPrisma, prisma, prismaWithLogging } from './index';
