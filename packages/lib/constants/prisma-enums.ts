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

// Re-export interface types from @prisma/client for backwards compatibility
// These are the actual Prisma-generated types, not simplified browser-safe versions
export type {
  ApiToken,
  DocumentData,
  DocumentMeta,
  Envelope,
  EnvelopeItem,
  Field,
  Passkey,
  Recipient,
  Signature,
  Subscription,
  SubscriptionClaim,
  Team,
  TeamEmail,
  TeamGlobalSettings,
  TeamGroup,
  TeamProfile,
  TemplateDirectLink,
  User,
  Webhook,
} from "@prisma/client";
