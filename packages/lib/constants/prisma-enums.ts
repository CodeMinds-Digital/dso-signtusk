/**
 * Browser-safe Prisma enums.
 * These are duplicated from @prisma/client to avoid importing the full Prisma client in browser code.
 * Keep these in sync with the Prisma schema.
 */

export enum FieldType {
  SIGNATURE = "SIGNATURE",
  FREE_SIGNATURE = "FREE_SIGNATURE",
  INITIALS = "INITIALS",
  NAME = "NAME",
  EMAIL = "EMAIL",
  DATE = "DATE",
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  RADIO = "RADIO",
  CHECKBOX = "CHECKBOX",
  DROPDOWN = "DROPDOWN",
}

export enum RecipientRole {
  CC = "CC",
  SIGNER = "SIGNER",
  VIEWER = "VIEWER",
  APPROVER = "APPROVER",
  ASSISTANT = "ASSISTANT",
}

export enum SigningStatus {
  NOT_SIGNED = "NOT_SIGNED",
  SIGNED = "SIGNED",
  REJECTED = "REJECTED",
}

export enum SendStatus {
  NOT_SENT = "NOT_SENT",
  SENT = "SENT",
}

export enum ReadStatus {
  NOT_OPENED = "NOT_OPENED",
  OPENED = "OPENED",
}

export enum DocumentDistributionMethod {
  EMAIL = "EMAIL",
  NONE = "NONE",
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export enum EnvelopeType {
  DOCUMENT = "DOCUMENT",
  TEMPLATE = "TEMPLATE",
}

export enum DocumentVisibility {
  EVERYONE = "EVERYONE",
  ADMIN = "ADMIN",
  MANAGER_AND_ABOVE = "MANAGER_AND_ABOVE",
}

export enum OrganisationType {
  PERSONAL = "PERSONAL",
  ORGANISATION = "ORGANISATION",
}

export enum OrganisationMemberRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  INACTIVE = "INACTIVE",
}

export enum DocumentSigningOrder {
  PARALLEL = "PARALLEL",
  SEQUENTIAL = "SEQUENTIAL",
}

export enum TeamMemberRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
}

export enum WebhookTriggerEvents {
  DOCUMENT_CREATED = "DOCUMENT_CREATED",
  DOCUMENT_SENT = "DOCUMENT_SENT",
  DOCUMENT_OPENED = "DOCUMENT_OPENED",
  DOCUMENT_SIGNED = "DOCUMENT_SIGNED",
  DOCUMENT_COMPLETED = "DOCUMENT_COMPLETED",
  DOCUMENT_REJECTED = "DOCUMENT_REJECTED",
  DOCUMENT_CANCELLED = "DOCUMENT_CANCELLED",
}

export enum WebhookCallStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum TemplateType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum FolderType {
  DOCUMENT = "DOCUMENT",
  TEMPLATE = "TEMPLATE",
}

export enum OrganisationGroupType {
  INTERNAL_ORGANISATION = "INTERNAL_ORGANISATION",
  INTERNAL_TEAM = "INTERNAL_TEAM",
  CUSTOM = "CUSTOM",
}

export enum AuthenticationMethod {
  ACCOUNT = "ACCOUNT",
  EXPLICIT_NONE = "EXPLICIT_NONE",
  TWO_FACTOR_AUTH = "TWO_FACTOR_AUTH",
  PASSKEY = "PASSKEY",
}

export enum DocumentDataType {
  BYTES = "BYTES",
  BYTES_64 = "BYTES_64",
  S3_PATH = "S3_PATH",
}

export enum OrganisationMemberInviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

// Type definitions for commonly used Prisma types in client code
// These are simplified versions - only include fields needed client-side

export interface Field {
  id: number;
  secondaryId: string;
  envelopeId: string;
  envelopeItemId: string;
  type: FieldType;
  page: number;
  positionX: number | string;
  positionY: number | string;
  width: number | string;
  height: number | string;
  recipientId: number;
  fieldMeta?: unknown;
  customText: string;
  inserted: boolean;
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
  authOptions: unknown | null;
  signingOrder: number | null;
  rejectionReason: string | null;
  role: RecipientRole;
  readStatus: ReadStatus;
  signingStatus: SigningStatus;
  sendStatus: SendStatus;
}

export interface EnvelopeItem {
  id: string;
  title: string;
  order: number;
  documentDataId: string;
  envelopeId: string;
}

export interface Webhook {
  id: string;
  webhookUrl: string;
  eventTriggers: WebhookTriggerEvents[];
  secret: string | null;
  enabled: boolean;
  teamId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiToken {
  id: number;
  name: string;
  token: string;
  algorithm: string | null;
  expires: Date | null;
  createdAt: Date;
  teamId: number;
  userId: number;
}

export interface TeamEmail {
  teamId: number;
  email: string;
  name: string;
  createdAt: Date;
}

export interface TeamGroup {
  id: string;
  teamId: number;
  organisationGroupId: string;
  teamRole: TeamMemberRole;
}

export interface TemplateDirectLink {
  id: string;
  envelopeId: string;
  token: string;
  enabled: boolean;
  directTemplateRecipientId: number;
  createdAt: Date;
}

export interface User {
  id: number;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  avatarImageId: string | null;
}

export interface Team {
  id: number;
  name: string;
  url: string;
  createdAt: Date;
  avatarImageId: string | null;
}

export interface Signature {
  id: number;
  recipientId: number;
  fieldId: number;
  signatureImageAsBase64: string | null;
  typedSignature: string | null;
  created: Date;
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
  signingOrder: DocumentSigningOrder | null;
  typedSignatureEnabled: boolean;
  drawSignatureEnabled: boolean;
  uploadSignatureEnabled: boolean;
  language: string | null;
  distributionMethod: DocumentDistributionMethod;
}

// Additional enums needed by components
export enum DocumentSource {
  DOCUMENT = "DOCUMENT",
  TEMPLATE = "TEMPLATE",
  TEMPLATE_DIRECT_LINK = "TEMPLATE_DIRECT_LINK",
}

export enum EmailDomainStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
}

// Additional interfaces needed by components
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
  emailDocumentSettings: unknown | null;
  brandingEnabled: boolean | null;
  brandingLogo: string | null;
  brandingUrl: string | null;
  brandingCompanyDetails: string | null;
  aiFeaturesEnabled: boolean | null;
}

export interface TeamProfile {
  id: string;
  enabled: boolean;
  teamId: number;
  bio: string | null;
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
  flags: unknown;
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

export interface Passkey {
  id: string;
  userId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  credentialId: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: bigint;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports: string[];
}
