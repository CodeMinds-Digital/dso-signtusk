import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const IdentityProvider = {
    DOCUMENSO: "DOCUMENSO",
    GOOGLE: "GOOGLE",
    OIDC: "OIDC"
} as const;
export type IdentityProvider = (typeof IdentityProvider)[keyof typeof IdentityProvider];
export const Role = {
    ADMIN: "ADMIN",
    USER: "USER"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const UserSecurityAuditLogType = {
    ACCOUNT_PROFILE_UPDATE: "ACCOUNT_PROFILE_UPDATE",
    ACCOUNT_SSO_LINK: "ACCOUNT_SSO_LINK",
    ACCOUNT_SSO_UNLINK: "ACCOUNT_SSO_UNLINK",
    ORGANISATION_SSO_LINK: "ORGANISATION_SSO_LINK",
    ORGANISATION_SSO_UNLINK: "ORGANISATION_SSO_UNLINK",
    AUTH_2FA_DISABLE: "AUTH_2FA_DISABLE",
    AUTH_2FA_ENABLE: "AUTH_2FA_ENABLE",
    PASSKEY_CREATED: "PASSKEY_CREATED",
    PASSKEY_DELETED: "PASSKEY_DELETED",
    PASSKEY_UPDATED: "PASSKEY_UPDATED",
    PASSWORD_RESET: "PASSWORD_RESET",
    PASSWORD_UPDATE: "PASSWORD_UPDATE",
    SESSION_REVOKED: "SESSION_REVOKED",
    SIGN_OUT: "SIGN_OUT",
    SIGN_IN: "SIGN_IN",
    SIGN_IN_FAIL: "SIGN_IN_FAIL",
    SIGN_IN_2FA_FAIL: "SIGN_IN_2FA_FAIL",
    SIGN_IN_PASSKEY_FAIL: "SIGN_IN_PASSKEY_FAIL"
} as const;
export type UserSecurityAuditLogType = (typeof UserSecurityAuditLogType)[keyof typeof UserSecurityAuditLogType];
export const WebhookTriggerEvents = {
    DOCUMENT_CREATED: "DOCUMENT_CREATED",
    DOCUMENT_SENT: "DOCUMENT_SENT",
    DOCUMENT_OPENED: "DOCUMENT_OPENED",
    DOCUMENT_SIGNED: "DOCUMENT_SIGNED",
    DOCUMENT_COMPLETED: "DOCUMENT_COMPLETED",
    DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
    DOCUMENT_CANCELLED: "DOCUMENT_CANCELLED"
} as const;
export type WebhookTriggerEvents = (typeof WebhookTriggerEvents)[keyof typeof WebhookTriggerEvents];
export const WebhookCallStatus = {
    SUCCESS: "SUCCESS",
    FAILED: "FAILED"
} as const;
export type WebhookCallStatus = (typeof WebhookCallStatus)[keyof typeof WebhookCallStatus];
export const ApiTokenAlgorithm = {
    SHA512: "SHA512"
} as const;
export type ApiTokenAlgorithm = (typeof ApiTokenAlgorithm)[keyof typeof ApiTokenAlgorithm];
export const SubscriptionStatus = {
    ACTIVE: "ACTIVE",
    PAST_DUE: "PAST_DUE",
    INACTIVE: "INACTIVE"
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const DocumentStatus = {
    DRAFT: "DRAFT",
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    REJECTED: "REJECTED"
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];
export const DocumentSource = {
    DOCUMENT: "DOCUMENT",
    TEMPLATE: "TEMPLATE",
    TEMPLATE_DIRECT_LINK: "TEMPLATE_DIRECT_LINK"
} as const;
export type DocumentSource = (typeof DocumentSource)[keyof typeof DocumentSource];
export const DocumentVisibility = {
    EVERYONE: "EVERYONE",
    MANAGER_AND_ABOVE: "MANAGER_AND_ABOVE",
    ADMIN: "ADMIN"
} as const;
export type DocumentVisibility = (typeof DocumentVisibility)[keyof typeof DocumentVisibility];
export const FolderType = {
    DOCUMENT: "DOCUMENT",
    TEMPLATE: "TEMPLATE"
} as const;
export type FolderType = (typeof FolderType)[keyof typeof FolderType];
export const EnvelopeType = {
    DOCUMENT: "DOCUMENT",
    TEMPLATE: "TEMPLATE"
} as const;
export type EnvelopeType = (typeof EnvelopeType)[keyof typeof EnvelopeType];
export const DocumentDataType = {
    S3_PATH: "S3_PATH",
    BYTES: "BYTES",
    BYTES_64: "BYTES_64"
} as const;
export type DocumentDataType = (typeof DocumentDataType)[keyof typeof DocumentDataType];
export const DocumentSigningOrder = {
    PARALLEL: "PARALLEL",
    SEQUENTIAL: "SEQUENTIAL"
} as const;
export type DocumentSigningOrder = (typeof DocumentSigningOrder)[keyof typeof DocumentSigningOrder];
export const DocumentDistributionMethod = {
    EMAIL: "EMAIL",
    NONE: "NONE"
} as const;
export type DocumentDistributionMethod = (typeof DocumentDistributionMethod)[keyof typeof DocumentDistributionMethod];
export const ReadStatus = {
    NOT_OPENED: "NOT_OPENED",
    OPENED: "OPENED"
} as const;
export type ReadStatus = (typeof ReadStatus)[keyof typeof ReadStatus];
export const SendStatus = {
    NOT_SENT: "NOT_SENT",
    SENT: "SENT"
} as const;
export type SendStatus = (typeof SendStatus)[keyof typeof SendStatus];
export const SigningStatus = {
    NOT_SIGNED: "NOT_SIGNED",
    SIGNED: "SIGNED",
    REJECTED: "REJECTED"
} as const;
export type SigningStatus = (typeof SigningStatus)[keyof typeof SigningStatus];
export const RecipientRole = {
    CC: "CC",
    SIGNER: "SIGNER",
    VIEWER: "VIEWER",
    APPROVER: "APPROVER",
    ASSISTANT: "ASSISTANT"
} as const;
export type RecipientRole = (typeof RecipientRole)[keyof typeof RecipientRole];
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
    DROPDOWN: "DROPDOWN"
} as const;
export type FieldType = (typeof FieldType)[keyof typeof FieldType];
export const OrganisationType = {
    PERSONAL: "PERSONAL",
    ORGANISATION: "ORGANISATION"
} as const;
export type OrganisationType = (typeof OrganisationType)[keyof typeof OrganisationType];
export const OrganisationGroupType = {
    INTERNAL_ORGANISATION: "INTERNAL_ORGANISATION",
    INTERNAL_TEAM: "INTERNAL_TEAM",
    CUSTOM: "CUSTOM"
} as const;
export type OrganisationGroupType = (typeof OrganisationGroupType)[keyof typeof OrganisationGroupType];
export const OrganisationMemberRole = {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    MEMBER: "MEMBER"
} as const;
export type OrganisationMemberRole = (typeof OrganisationMemberRole)[keyof typeof OrganisationMemberRole];
export const TeamMemberRole = {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    MEMBER: "MEMBER"
} as const;
export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];
export const OrganisationMemberInviteStatus = {
    ACCEPTED: "ACCEPTED",
    PENDING: "PENDING",
    DECLINED: "DECLINED"
} as const;
export type OrganisationMemberInviteStatus = (typeof OrganisationMemberInviteStatus)[keyof typeof OrganisationMemberInviteStatus];
export const TemplateType = {
    PUBLIC: "PUBLIC",
    PRIVATE: "PRIVATE"
} as const;
export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];
export const BackgroundJobStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED"
} as const;
export type BackgroundJobStatus = (typeof BackgroundJobStatus)[keyof typeof BackgroundJobStatus];
export const BackgroundJobTaskStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED"
} as const;
export type BackgroundJobTaskStatus = (typeof BackgroundJobTaskStatus)[keyof typeof BackgroundJobTaskStatus];
export const EmailDomainStatus = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE"
} as const;
export type EmailDomainStatus = (typeof EmailDomainStatus)[keyof typeof EmailDomainStatus];
export const SSOProvider = {
    SAML2: "SAML2",
    OIDC: "OIDC"
} as const;
export type SSOProvider = (typeof SSOProvider)[keyof typeof SSOProvider];
export const SSOConfigStatus = {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    ERROR: "ERROR"
} as const;
export type SSOConfigStatus = (typeof SSOConfigStatus)[keyof typeof SSOConfigStatus];
export const SSOAuditEventType = {
    CONFIG_CREATED: "CONFIG_CREATED",
    CONFIG_UPDATED: "CONFIG_UPDATED",
    CONFIG_DELETED: "CONFIG_DELETED",
    CONFIG_ACTIVATED: "CONFIG_ACTIVATED",
    CONFIG_DEACTIVATED: "CONFIG_DEACTIVATED",
    LOGIN_INITIATED: "LOGIN_INITIATED",
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
    LOGOUT_INITIATED: "LOGOUT_INITIATED",
    LOGOUT_SUCCESS: "LOGOUT_SUCCESS",
    USER_PROVISIONED: "USER_PROVISIONED",
    USER_UPDATED: "USER_UPDATED",
    ASSERTION_RECEIVED: "ASSERTION_RECEIVED",
    TOKEN_RECEIVED: "TOKEN_RECEIVED"
} as const;
export type SSOAuditEventType = (typeof SSOAuditEventType)[keyof typeof SSOAuditEventType];
export type Account = {
    id: string;
    createdAt: Generated<Timestamp>;
    userId: number;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token: string | null;
    access_token: string | null;
    expires_at: number | null;
    created_at: number | null;
    ext_expires_in: number | null;
    token_type: string | null;
    scope: string | null;
    id_token: string | null;
    session_state: string | null;
    password: string | null;
};
export type AnonymousVerificationToken = {
    id: string;
    token: string;
    expiresAt: Timestamp;
    createdAt: Generated<Timestamp>;
};
export type ApiToken = {
    id: Generated<number>;
    name: string;
    token: string;
    algorithm: Generated<ApiTokenAlgorithm>;
    expires: Timestamp | null;
    createdAt: Generated<Timestamp>;
    userId: number | null;
    teamId: number;
};
export type AvatarImage = {
    id: string;
    bytes: string;
};
export type BackgroundJob = {
    id: string;
    status: Generated<BackgroundJobStatus>;
    payload: unknown | null;
    retried: Generated<number>;
    maxRetries: Generated<number>;
    jobId: string;
    name: string;
    version: string;
    submittedAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    completedAt: Timestamp | null;
    lastRetriedAt: Timestamp | null;
};
export type BackgroundJobTask = {
    id: string;
    name: string;
    status: Generated<BackgroundJobTaskStatus>;
    result: unknown | null;
    retried: Generated<number>;
    maxRetries: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    completedAt: Timestamp | null;
    jobId: string;
};
export type Counter = {
    id: string;
    value: number;
};
export type DocumentAuditLog = {
    id: string;
    envelopeId: string;
    createdAt: Generated<Timestamp>;
    type: string;
    data: unknown;
    name: string | null;
    email: string | null;
    userId: number | null;
    userAgent: string | null;
    ipAddress: string | null;
};
export type DocumentData = {
    id: string;
    type: DocumentDataType;
    data: string;
    initialData: string;
};
export type DocumentMeta = {
    id: string;
    subject: string | null;
    message: string | null;
    timezone: Generated<string | null>;
    dateFormat: Generated<string | null>;
    redirectUrl: string | null;
    signingOrder: Generated<DocumentSigningOrder>;
    allowDictateNextSigner: Generated<boolean>;
    typedSignatureEnabled: Generated<boolean>;
    uploadSignatureEnabled: Generated<boolean>;
    drawSignatureEnabled: Generated<boolean>;
    language: Generated<string>;
    distributionMethod: Generated<DocumentDistributionMethod>;
    /**
     * [DocumentEmailSettings] @zod.custom.use(ZDocumentEmailSettingsSchema)
     */
    emailSettings: unknown | null;
    emailReplyTo: string | null;
    emailId: string | null;
};
export type DocumentShareLink = {
    id: Generated<number>;
    email: string;
    slug: string;
    envelopeId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type EmailDomain = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    status: Generated<EmailDomainStatus>;
    selector: string;
    domain: string;
    publicKey: string;
    privateKey: string;
    organisationId: string;
};
export type Envelope = {
    id: string;
    secondaryId: string;
    /**
     * @zod.string.describe("A custom external ID you can use to identify the document.")
     */
    externalId: string | null;
    type: EnvelopeType;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    completedAt: Timestamp | null;
    deletedAt: Timestamp | null;
    title: string;
    status: Generated<DocumentStatus>;
    source: DocumentSource;
    /**
     * @zod.string.describe("The token for viewing the document using the QR code on the certificate.")
     */
    qrToken: string | null;
    internalVersion: number;
    useLegacyFieldInsertion: Generated<boolean>;
    /**
     * [DocumentAuthOptions] @zod.custom.use(ZDocumentAuthOptionsSchema)
     */
    authOptions: unknown | null;
    /**
     * [DocumentFormValues] @zod.custom.use(ZDocumentFormValuesSchema)
     */
    formValues: unknown | null;
    visibility: Generated<DocumentVisibility>;
    templateType: Generated<TemplateType>;
    publicTitle: Generated<string>;
    publicDescription: Generated<string>;
    templateId: number | null;
    /**
     * @zod.number.describe("The ID of the user that created this document.")
     */
    userId: number;
    teamId: number;
    folderId: string | null;
    documentMetaId: string;
};
export type EnvelopeAttachment = {
    id: string;
    /**
     * [EnvelopeAttachmentType] @zod.custom.use(ZEnvelopeAttachmentTypeSchema)
     */
    type: string;
    label: string;
    data: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    envelopeId: string;
};
export type EnvelopeItem = {
    id: string;
    title: string;
    order: number;
    documentDataId: string;
    envelopeId: string;
};
export type Field = {
    id: Generated<number>;
    secondaryId: string;
    envelopeId: string;
    envelopeItemId: string;
    recipientId: number;
    type: FieldType;
    /**
     * @zod.number.describe("The page number of the field on the document. Starts from 1.")
     */
    page: number;
    positionX: Generated<string>;
    positionY: Generated<string>;
    width: Generated<string>;
    height: Generated<string>;
    customText: string;
    inserted: boolean;
    /**
     * [FieldMeta] @zod.custom.use(ZFieldMetaNotOptionalSchema)
     */
    fieldMeta: unknown | null;
};
export type Folder = {
    id: string;
    name: string;
    userId: number;
    teamId: number;
    pinned: Generated<boolean>;
    parentId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    visibility: Generated<DocumentVisibility>;
    type: FolderType;
};
export type Organisation = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    type: OrganisationType;
    name: string;
    url: string;
    avatarImageId: string | null;
    customerId: string | null;
    organisationClaimId: string;
    ownerUserId: number;
    organisationGlobalSettingsId: string;
    organisationAuthenticationPortalId: string;
};
export type OrganisationAuthenticationPortal = {
    id: string;
    enabled: Generated<boolean>;
    clientId: Generated<string>;
    clientSecret: Generated<string>;
    wellKnownUrl: Generated<string>;
    defaultOrganisationRole: Generated<OrganisationMemberRole>;
    autoProvisionUsers: Generated<boolean>;
    allowedDomains: Generated<string[]>;
    jitProvisioning: unknown | null;
    attributeMapping: unknown | null;
    samlEnabled: Generated<boolean>;
    samlEntityId: string | null;
    samlAcsUrl: string | null;
    samlSloUrl: string | null;
    samlCertificate: string | null;
    samlPrivateKey: string | null;
    oidcScopes: Generated<string[]>;
    oidcValidateIssuer: Generated<boolean>;
    oidcClockTolerance: Generated<number>;
};
export type OrganisationClaim = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    originalSubscriptionClaimId: string | null;
    teamCount: number;
    memberCount: number;
    envelopeItemCount: number;
    /**
     * [ClaimFlags] @zod.custom.use(ZClaimFlagsSchema)
     */
    flags: unknown;
};
export type OrganisationEmail = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    email: string;
    emailName: string;
    emailDomainId: string;
    organisationId: string;
};
export type OrganisationGlobalSettings = {
    id: string;
    documentVisibility: Generated<DocumentVisibility>;
    documentLanguage: Generated<string>;
    includeSenderDetails: Generated<boolean>;
    includeSigningCertificate: Generated<boolean>;
    includeAuditLog: Generated<boolean>;
    documentTimezone: string | null;
    documentDateFormat: Generated<string>;
    typedSignatureEnabled: Generated<boolean>;
    uploadSignatureEnabled: Generated<boolean>;
    drawSignatureEnabled: Generated<boolean>;
    emailId: string | null;
    emailReplyTo: string | null;
    /**
     * [DocumentEmailSettings] @zod.custom.use(ZDocumentEmailSettingsSchema)
     */
    emailDocumentSettings: unknown;
    brandingEnabled: Generated<boolean>;
    brandingLogo: Generated<string>;
    brandingUrl: Generated<string>;
    brandingCompanyDetails: Generated<string>;
    aiFeaturesEnabled: Generated<boolean>;
};
export type OrganisationGroup = {
    id: string;
    name: string | null;
    type: OrganisationGroupType;
    organisationRole: OrganisationMemberRole;
    organisationId: string;
};
export type OrganisationGroupMember = {
    id: string;
    groupId: string;
    organisationMemberId: string;
};
export type OrganisationMember = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    userId: number;
    organisationId: string;
};
export type OrganisationMemberInvite = {
    id: string;
    createdAt: Generated<Timestamp>;
    email: string;
    token: string;
    status: Generated<OrganisationMemberInviteStatus>;
    organisationId: string;
    organisationRole: OrganisationMemberRole;
};
export type Passkey = {
    id: string;
    userId: number;
    name: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    lastUsedAt: Timestamp | null;
    /**
     * @zod.custom.use(z.instanceof(Uint8Array))
     */
    credentialId: Buffer;
    /**
     * @zod.custom.use(z.instanceof(Uint8Array))
     */
    credentialPublicKey: Buffer;
    counter: string;
    credentialDeviceType: string;
    credentialBackedUp: boolean;
    transports: string[];
};
export type PasswordResetToken = {
    id: Generated<number>;
    token: string;
    createdAt: Generated<Timestamp>;
    expiry: Timestamp;
    userId: number;
};
export type Recipient = {
    id: Generated<number>;
    envelopeId: string;
    email: string;
    name: Generated<string>;
    token: string;
    documentDeletedAt: Timestamp | null;
    expired: Timestamp | null;
    signedAt: Timestamp | null;
    /**
     * [RecipientAuthOptions] @zod.custom.use(ZRecipientAuthOptionsSchema)
     */
    authOptions: unknown | null;
    /**
     * @zod.number.describe("The order in which the recipient should sign the document. Only works if the document is set to sequential signing.")
     */
    signingOrder: number | null;
    rejectionReason: string | null;
    role: Generated<RecipientRole>;
    readStatus: Generated<ReadStatus>;
    signingStatus: Generated<SigningStatus>;
    sendStatus: Generated<SendStatus>;
};
export type Session = {
    id: string;
    sessionToken: string;
    userId: number;
    ipAddress: string | null;
    userAgent: string | null;
    expiresAt: Timestamp;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type Signature = {
    id: Generated<number>;
    created: Generated<Timestamp>;
    recipientId: number;
    fieldId: number;
    signatureImageAsBase64: string | null;
    typedSignature: string | null;
};
export type SiteSettings = {
    id: string;
    enabled: Generated<boolean>;
    data: unknown;
    lastModifiedByUserId: number | null;
    lastModifiedAt: Generated<Timestamp>;
};
export type SSOAuditEvent = {
    id: string;
    organisationId: string;
    ssoConfigId: string | null;
    userId: number | null;
    event: SSOAuditEventType;
    details: unknown;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: Generated<Timestamp>;
};
export type SSOConfiguration = {
    id: string;
    organisationId: string;
    name: string;
    description: string | null;
    provider: SSOProvider;
    domains: Generated<string[]>;
    isDefault: Generated<boolean>;
    status: Generated<SSOConfigStatus>;
    config: unknown;
    createdBy: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    lastUsed: Timestamp | null;
    organisationAuthenticationPortalId: string;
};
export type SSOSession = {
    id: string;
    organisationId: string;
    ssoConfigId: string;
    userId: number;
    provider: SSOProvider;
    sessionIndex: string | null;
    nameID: string | null;
    subject: string | null;
    createdAt: Generated<Timestamp>;
    expiresAt: Timestamp;
    lastActivity: Generated<Timestamp>;
};
export type Subscription = {
    id: Generated<number>;
    status: Generated<SubscriptionStatus>;
    planId: string;
    priceId: string;
    periodEnd: Timestamp | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    cancelAtPeriodEnd: Generated<boolean>;
    customerId: string;
    organisationId: string;
};
export type SubscriptionClaim = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    name: string;
    locked: Generated<boolean>;
    teamCount: number;
    memberCount: number;
    envelopeItemCount: number;
    /**
     * [ClaimFlags] @zod.custom.use(ZClaimFlagsSchema)
     */
    flags: unknown;
};
export type Team = {
    id: Generated<number>;
    name: string;
    url: string;
    createdAt: Generated<Timestamp>;
    avatarImageId: string | null;
    organisationId: string;
    teamGlobalSettingsId: string;
};
export type TeamEmail = {
    teamId: number;
    createdAt: Generated<Timestamp>;
    name: string;
    email: string;
};
export type TeamEmailVerification = {
    teamId: number;
    name: string;
    email: string;
    token: string;
    completed: Generated<boolean>;
    expiresAt: Timestamp;
    createdAt: Generated<Timestamp>;
};
export type TeamGlobalSettings = {
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
    /**
     * [DocumentEmailSettingsNullable] @zod.custom.use(ZDocumentEmailSettingsSchema)
     */
    emailDocumentSettings: unknown | null;
    brandingEnabled: boolean | null;
    brandingLogo: string | null;
    brandingUrl: string | null;
    brandingCompanyDetails: string | null;
    aiFeaturesEnabled: boolean | null;
};
export type TeamGroup = {
    id: string;
    organisationGroupId: string;
    teamRole: TeamMemberRole;
    teamId: number;
};
export type TeamProfile = {
    id: string;
    enabled: Generated<boolean>;
    teamId: number;
    bio: string | null;
};
export type TemplateDirectLink = {
    id: string;
    envelopeId: string;
    token: string;
    createdAt: Generated<Timestamp>;
    enabled: boolean;
    directTemplateRecipientId: number;
};
export type User = {
    id: Generated<number>;
    name: string | null;
    email: string;
    emailVerified: Timestamp | null;
    password: string | null;
    source: string | null;
    signature: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    lastSignedIn: Generated<Timestamp>;
    roles: Generated<Role[]>;
    identityProvider: Generated<IdentityProvider>;
    avatarImageId: string | null;
    disabled: Generated<boolean>;
    twoFactorSecret: string | null;
    twoFactorEnabled: Generated<boolean>;
    twoFactorBackupCodes: string | null;
    ssoProvisioned: Generated<boolean>;
    ssoConfigId: string | null;
    firstName: string | null;
    lastName: string | null;
    department: string | null;
    title: string | null;
    phone: string | null;
};
export type UserSecurityAuditLog = {
    id: Generated<number>;
    userId: number;
    createdAt: Generated<Timestamp>;
    type: UserSecurityAuditLogType;
    userAgent: string | null;
    ipAddress: string | null;
};
export type VerificationToken = {
    id: Generated<number>;
    secondaryId: string;
    identifier: string;
    token: string;
    completed: Generated<boolean>;
    expires: Timestamp;
    createdAt: Generated<Timestamp>;
    metadata: unknown | null;
    userId: number;
};
export type Webhook = {
    id: string;
    webhookUrl: string;
    eventTriggers: WebhookTriggerEvents[];
    secret: string | null;
    enabled: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    userId: number;
    teamId: number;
};
export type WebhookCall = {
    id: string;
    status: WebhookCallStatus;
    url: string;
    event: WebhookTriggerEvents;
    requestBody: unknown;
    responseCode: number;
    responseHeaders: unknown | null;
    responseBody: unknown | null;
    createdAt: Generated<Timestamp>;
    webhookId: string;
};
export type DB = {
    Account: Account;
    AnonymousVerificationToken: AnonymousVerificationToken;
    ApiToken: ApiToken;
    AvatarImage: AvatarImage;
    BackgroundJob: BackgroundJob;
    BackgroundJobTask: BackgroundJobTask;
    Counter: Counter;
    DocumentAuditLog: DocumentAuditLog;
    DocumentData: DocumentData;
    DocumentMeta: DocumentMeta;
    DocumentShareLink: DocumentShareLink;
    EmailDomain: EmailDomain;
    Envelope: Envelope;
    EnvelopeAttachment: EnvelopeAttachment;
    EnvelopeItem: EnvelopeItem;
    Field: Field;
    Folder: Folder;
    Organisation: Organisation;
    OrganisationAuthenticationPortal: OrganisationAuthenticationPortal;
    OrganisationClaim: OrganisationClaim;
    OrganisationEmail: OrganisationEmail;
    OrganisationGlobalSettings: OrganisationGlobalSettings;
    OrganisationGroup: OrganisationGroup;
    OrganisationGroupMember: OrganisationGroupMember;
    OrganisationMember: OrganisationMember;
    OrganisationMemberInvite: OrganisationMemberInvite;
    Passkey: Passkey;
    PasswordResetToken: PasswordResetToken;
    Recipient: Recipient;
    Session: Session;
    Signature: Signature;
    SiteSettings: SiteSettings;
    SSOAuditEvent: SSOAuditEvent;
    SSOConfiguration: SSOConfiguration;
    SSOSession: SSOSession;
    Subscription: Subscription;
    SubscriptionClaim: SubscriptionClaim;
    Team: Team;
    TeamEmail: TeamEmail;
    TeamEmailVerification: TeamEmailVerification;
    TeamGlobalSettings: TeamGlobalSettings;
    TeamGroup: TeamGroup;
    TeamProfile: TeamProfile;
    TemplateDirectLink: TemplateDirectLink;
    User: User;
    UserSecurityAuditLog: UserSecurityAuditLog;
    VerificationToken: VerificationToken;
    Webhook: Webhook;
    WebhookCall: WebhookCall;
};
