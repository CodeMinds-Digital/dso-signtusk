/**
 * Browser-safe Prisma enums.
 * These are duplicated from @prisma/client to avoid importing the full Prisma client in browser code.
 * Keep these in sync with the Prisma schema.
 *
 * NOTE: We use string literal union types instead of enums to ensure compatibility
 * with Prisma's generated types. TypeScript treats enum types as nominal (different enums
 * with same values are incompatible), but string literal unions are structural.
 *
 * IMPORTANT: Do NOT define interface types here (like Field, Recipient, etc.) as they
 * will conflict with the Prisma-generated types. Use the types from @prisma/client instead.
 */

// String literal union types for compatibility with Prisma
export type FieldType =
  | "SIGNATURE"
  | "FREE_SIGNATURE"
  | "INITIALS"
  | "NAME"
  | "EMAIL"
  | "DATE"
  | "TEXT"
  | "NUMBER"
  | "RADIO"
  | "CHECKBOX"
  | "DROPDOWN";

export const FieldType = {
  SIGNATURE: "SIGNATURE",
  FREE_SIGNATURE: "FREE_SIGNATURE",
  INITIALS: "INITIALS",
  NAME: "NAME",
  EMAIL: "EMAIL",
  DATE: "DATE",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  RADIO: "RADIO",
  CHECKBOX: "CHECKBOX",
  DROPDOWN: "DROPDOWN",
} as const;

export type RecipientRole =
  | "CC"
  | "SIGNER"
  | "VIEWER"
  | "APPROVER"
  | "ASSISTANT";

export const RecipientRole = {
  CC: "CC",
  SIGNER: "SIGNER",
  VIEWER: "VIEWER",
  APPROVER: "APPROVER",
  ASSISTANT: "ASSISTANT",
} as const;

export type SigningStatus = "NOT_SIGNED" | "SIGNED" | "REJECTED";

export const SigningStatus = {
  NOT_SIGNED: "NOT_SIGNED",
  SIGNED: "SIGNED",
  REJECTED: "REJECTED",
} as const;

export type SendStatus = "NOT_SENT" | "SENT";

export const SendStatus = {
  NOT_SENT: "NOT_SENT",
  SENT: "SENT",
} as const;

export type ReadStatus = "NOT_OPENED" | "OPENED";

export const ReadStatus = {
  NOT_OPENED: "NOT_OPENED",
  OPENED: "OPENED",
} as const;

export type DocumentDistributionMethod = "EMAIL" | "NONE";

export const DocumentDistributionMethod = {
  EMAIL: "EMAIL",
  NONE: "NONE",
} as const;

export type DocumentStatus = "DRAFT" | "PENDING" | "COMPLETED" | "REJECTED";

export const DocumentStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const;

export type EnvelopeType = "DOCUMENT" | "TEMPLATE";

export const EnvelopeType = {
  DOCUMENT: "DOCUMENT",
  TEMPLATE: "TEMPLATE",
} as const;

export type DocumentVisibility = "EVERYONE" | "ADMIN" | "MANAGER_AND_ABOVE";

export const DocumentVisibility = {
  EVERYONE: "EVERYONE",
  ADMIN: "ADMIN",
  MANAGER_AND_ABOVE: "MANAGER_AND_ABOVE",
} as const;

export type OrganisationType = "PERSONAL" | "ORGANISATION";

export const OrganisationType = {
  PERSONAL: "PERSONAL",
  ORGANISATION: "ORGANISATION",
} as const;

export type OrganisationMemberRole = "ADMIN" | "MANAGER" | "MEMBER";

export const OrganisationMemberRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const;

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "INACTIVE";

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  INACTIVE: "INACTIVE",
} as const;

export type DocumentSigningOrder = "PARALLEL" | "SEQUENTIAL";

export const DocumentSigningOrder = {
  PARALLEL: "PARALLEL",
  SEQUENTIAL: "SEQUENTIAL",
} as const;

export type TeamMemberRole = "ADMIN" | "MANAGER" | "MEMBER";

export const TeamMemberRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const;

export type WebhookTriggerEvents =
  | "DOCUMENT_CREATED"
  | "DOCUMENT_SENT"
  | "DOCUMENT_OPENED"
  | "DOCUMENT_SIGNED"
  | "DOCUMENT_COMPLETED"
  | "DOCUMENT_REJECTED"
  | "DOCUMENT_CANCELLED";

export const WebhookTriggerEvents = {
  DOCUMENT_CREATED: "DOCUMENT_CREATED",
  DOCUMENT_SENT: "DOCUMENT_SENT",
  DOCUMENT_OPENED: "DOCUMENT_OPENED",
  DOCUMENT_SIGNED: "DOCUMENT_SIGNED",
  DOCUMENT_COMPLETED: "DOCUMENT_COMPLETED",
  DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
  DOCUMENT_CANCELLED: "DOCUMENT_CANCELLED",
} as const;

export type WebhookCallStatus = "SUCCESS" | "FAILED";

export const WebhookCallStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export type TemplateType = "PUBLIC" | "PRIVATE";

export const TemplateType = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
} as const;

// Alias for backwards compatibility
export type TemplateTypes = TemplateType;
export const TemplateTypes = TemplateType;

export type FolderType = "DOCUMENT" | "TEMPLATE";

export const FolderType = {
  DOCUMENT: "DOCUMENT",
  TEMPLATE: "TEMPLATE",
} as const;

export type OrganisationGroupType =
  | "INTERNAL_ORGANISATION"
  | "INTERNAL_TEAM"
  | "CUSTOM";

export const OrganisationGroupType = {
  INTERNAL_ORGANISATION: "INTERNAL_ORGANISATION",
  INTERNAL_TEAM: "INTERNAL_TEAM",
  CUSTOM: "CUSTOM",
} as const;

export type AuthenticationMethod =
  | "ACCOUNT"
  | "EXPLICIT_NONE"
  | "TWO_FACTOR_AUTH"
  | "PASSKEY"
  | "PASSWORD";

export const AuthenticationMethod = {
  ACCOUNT: "ACCOUNT",
  EXPLICIT_NONE: "EXPLICIT_NONE",
  TWO_FACTOR_AUTH: "TWO_FACTOR_AUTH",
  PASSKEY: "PASSKEY",
  PASSWORD: "PASSWORD",
} as const;

export type DocumentDataType = "BYTES" | "BYTES_64" | "S3_PATH";

export const DocumentDataType = {
  BYTES: "BYTES",
  BYTES_64: "BYTES_64",
  S3_PATH: "S3_PATH",
} as const;

export type OrganisationMemberInviteStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED";

export const OrganisationMemberInviteStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;

export type Role = "ADMIN" | "USER";

export const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type DocumentSource = "DOCUMENT" | "TEMPLATE" | "TEMPLATE_DIRECT_LINK";

export const DocumentSource = {
  DOCUMENT: "DOCUMENT",
  TEMPLATE: "TEMPLATE",
  TEMPLATE_DIRECT_LINK: "TEMPLATE_DIRECT_LINK",
} as const;

export type EmailDomainStatus = "PENDING" | "ACTIVE";

export const EmailDomainStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
} as const;

// ============================================================================
// Browser-safe interface types
// These are simplified versions of Prisma types for use in client-side code.
// They don't include all Prisma-specific features but provide the basic shape.
// For server-side code that needs full Prisma types, import from @prisma/client.
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDecimal = any; // Represents Prisma Decimal - compatible with number/string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = any; // Represents Prisma Json fields

export interface Field {
  id: number;
  secondaryId: string;
  envelopeId: string;
  envelopeItemId: string;
  recipientId: number;
  type: FieldType;
  page: number;
  positionX: AnyDecimal;
  positionY: AnyDecimal;
  width: AnyDecimal;
  height: AnyDecimal;
  customText: string;
  inserted: boolean;
  fieldMeta: AnyJson;
}

export interface Recipient {
  id: number;
  envelopeId: string;
  email: string;
  name: string;
  token: string;
  documentDeletedAt: Date | null;
  expired: Date | null;
  signedAt: Date | null;
  authOptions: AnyJson;
  signingOrder: number | null;
  rejectionReason: string | null;
  role: RecipientRole;
  readStatus: ReadStatus;
  signingStatus: SigningStatus;
  sendStatus: SendStatus;
}

export interface Signature {
  id: number;
  created: Date;
  recipientId: number;
  fieldId: number;
  signatureImageAsBase64: string | null;
  typedSignature: string | null;
}

export interface Envelope {
  id: string;
  secondaryId: string;
  externalId: string | null;
  type: EnvelopeType;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  deletedAt: Date | null;
  title: string;
  status: DocumentStatus;
  source: DocumentSource;
  qrToken: string | null;
  internalVersion: number;
  useLegacyFieldInsertion: boolean;
  authOptions: AnyJson;
  formValues: AnyJson;
  visibility: DocumentVisibility;
  templateType: TemplateType;
  publicTitle: string;
  publicDescription: string;
  templateId: number | null;
  userId: number;
  teamId: number;
  folderId: string | null;
  documentMetaId: string;
}

export interface EnvelopeItem {
  id: string;
  title: string;
  order: number;
  documentDataId: string;
  envelopeId: string;
}

export interface DocumentData {
  id: string;
  type: DocumentDataType;
  data: string;
  initialData: string;
}

export interface DocumentMeta {
  id: string;
  subject: string | null;
  message: string | null;
  timezone: string | null;
  dateFormat: string | null;
  redirectUrl: string | null;
  signingOrder: DocumentSigningOrder;
  allowDictateNextSigner: boolean;
  typedSignatureEnabled: boolean;
  uploadSignatureEnabled: boolean;
  drawSignatureEnabled: boolean;
  language: string;
  distributionMethod: DocumentDistributionMethod;
  emailSettings: AnyJson;
  emailReplyTo: string | null;
  emailId: string | null;
}

export interface Webhook {
  id: string;
  webhookUrl: string;
  eventTriggers: WebhookTriggerEvents[];
  secret: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  teamId: number;
}

export interface ApiToken {
  id: number;
  name: string;
  token: string;
  algorithm: "SHA512";
  expires: Date | null;
  createdAt: Date;
  userId: number | null;
  teamId: number;
}

export interface Team {
  id: number;
  name: string;
  url: string;
  createdAt: Date;
  avatarImageId: string | null;
  organisationId: string;
  teamGlobalSettingsId: string;
}

export interface TeamEmail {
  teamId: number;
  createdAt: Date;
  name: string;
  email: string;
}

export interface TeamGroup {
  id: string;
  organisationGroupId: string;
  teamRole: TeamMemberRole;
  teamId: number;
}

export interface OrganisationGroup {
  id: string;
  name: string;
  type: OrganisationGroupType;
  organisationRole: OrganisationMemberRole;
  organisationId: string;
}

export interface TeamProfile {
  id: string;
  enabled: boolean;
  teamId: number;
  bio: string | null;
}

export interface TeamGlobalSettings {
  id: string;
  documentVisibility: DocumentVisibility | null;
  documentLanguage: string | null;
  documentTimezone: string | null;
  documentDateFormat: string | null;
  includeSenderDetails: boolean | null;
  includeSigningCertificate: boolean | null;
  includeAuditLog: boolean | null;
  typedSignatureEnabled: boolean | null;
  uploadSignatureEnabled: boolean | null;
  drawSignatureEnabled: boolean | null;
  emailId: string | null;
  emailReplyTo: string | null;
  emailDocumentSettings: AnyJson;
  brandingEnabled: boolean | null;
  brandingLogo: string | null;
  brandingUrl: string | null;
  brandingCompanyDetails: string | null;
  aiFeaturesEnabled: boolean | null;
}

export interface TemplateDirectLink {
  id: string;
  envelopeId: string;
  token: string;
  createdAt: Date;
  enabled: boolean;
  directTemplateRecipientId: number;
}

export interface User {
  id: number;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  signature: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
  roles: Role[];
  avatarImageId: string | null;
  disabled: boolean;
  twoFactorEnabled: boolean;
}

export interface Passkey {
  id: string;
  userId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
}

export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  planId: string;
  priceId: string;
  periodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
  cancelAtPeriodEnd: boolean;
  customerId: string;
  organisationId: string;
}

export interface SubscriptionClaim {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  locked: boolean;
  teamCount: number;
  memberCount: number;
  envelopeItemCount: number;
  flags: AnyJson;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}
