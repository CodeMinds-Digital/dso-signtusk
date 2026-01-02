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
  PENDING = "PENDING",
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
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
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
  envelopeItemId: string;
  type: FieldType;
  page: number;
  positionX: number | string;
  positionY: number | string;
  width: number | string;
  height: number | string;
  recipientId: number;
  fieldMeta?: unknown;
  customText?: string | null;
  inserted?: boolean;
}

export interface Recipient {
  id: number;
  email: string;
  name: string;
  role: RecipientRole;
  signingStatus: SigningStatus;
  sendStatus: SendStatus;
  readStatus: ReadStatus;
  token?: string;
  signingOrder?: number | null;
  authenticationMethod?: AuthenticationMethod | null;
}

export interface EnvelopeItem {
  id: string;
  envelopeId: number;
}

export interface Webhook {
  id: number;
  webhookUrl: string;
  eventTriggers: WebhookTriggerEvents[];
  secret: string | null;
  enabled: boolean;
  teamId: number;
  createdAt: Date;
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
  id: number;
  email: string;
  name: string;
  teamId: number;
  createdAt: Date;
}

export interface TeamGroup {
  id: number;
  teamId: number;
  organisationGroupId: number;
  teamRole: TeamMemberRole;
}

export interface TemplateDirectLink {
  id: number;
  templateId: number;
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
  createdAt: Date;
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
