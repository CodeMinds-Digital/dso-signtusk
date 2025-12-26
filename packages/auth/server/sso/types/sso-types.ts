import { z } from 'zod';

// ============================================================================
// ENTERPRISE SSO TYPES
// ============================================================================

/**
 * Enterprise Single Sign-On (SSO) types for SAML 2.0 and OIDC integration
 * with identity provider support and just-in-time provisioning
 */

// SSO provider types
export enum SSOProvider {
    SAML2 = 'SAML2',
    OIDC = 'OIDC'
}

// SSO configuration status
export enum SSOConfigStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ERROR = 'ERROR'
}

// SAML binding types
export enum SAMLBinding {
    HTTP_POST = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    HTTP_REDIRECT = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
}

// SAML name ID formats
export enum SAMLNameIDFormat {
    EMAIL = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    PERSISTENT = 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    TRANSIENT = 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    UNSPECIFIED = 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'
}

// Just-in-time provisioning settings
export const JITProvisioningSchema = z.object({
    enabled: z.boolean().default(false),
    createUsers: z.boolean().default(true),
    updateUsers: z.boolean().default(true),
    defaultRoles: z.array(z.string()).default([]),
    defaultTeams: z.array(z.string()).default([]),
    attributeMapping: z.object({
        email: z.string().default('email'),
        firstName: z.string().default('firstName'),
        lastName: z.string().default('lastName'),
        displayName: z.string().default('displayName'),
        department: z.string().optional(),
        title: z.string().optional(),
        phone: z.string().optional()
    }).default({
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
        displayName: 'displayName'
    }),
    roleMapping: z.record(z.string(), z.array(z.string())).default({}),
    teamMapping: z.record(z.string(), z.array(z.string())).default({})
});

// SAML 2.0 configuration schema
export const SAML2ConfigSchema = z.object({
    // Identity Provider settings
    idpEntityId: z.string().min(1),
    idpSSOUrl: z.string().url(),
    idpSLOUrl: z.string().url().optional(),
    idpCertificate: z.string().min(1), // X.509 certificate in PEM format

    // Service Provider settings
    spEntityId: z.string().min(1),
    spAcsUrl: z.string().url(), // Assertion Consumer Service URL
    spSLOUrl: z.string().url().optional(), // Single Logout URL

    // SAML settings
    nameIDFormat: z.nativeEnum(SAMLNameIDFormat).default(SAMLNameIDFormat.EMAIL),
    binding: z.nativeEnum(SAMLBinding).default(SAMLBinding.HTTP_POST),
    signRequests: z.boolean().default(true),
    wantAssertionsSigned: z.boolean().default(true),
    wantResponseSigned: z.boolean().default(true),

    // Certificate settings for signing
    spPrivateKey: z.string().optional(), // Private key in PEM format
    spCertificate: z.string().optional(), // Certificate in PEM format

    // Attribute mapping
    attributeMapping: z.object({
        email: z.string().default('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'),
        firstName: z.string().default('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'),
        lastName: z.string().default('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'),
        displayName: z.string().default('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'),
        groups: z.string().optional(),
        department: z.string().optional(),
        title: z.string().optional()
    }).default({
        email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
        lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
        displayName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
    }),

    // JIT provisioning
    jitProvisioning: JITProvisioningSchema.default({})
});

// OIDC SSO configuration schema
export const OIDCSSOConfigSchema = z.object({
    // Provider discovery
    issuer: z.string().url(),
    discoveryUrl: z.string().url().optional(), // .well-known/openid_configuration

    // Client credentials
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),

    // Endpoints (auto-discovered if not provided)
    authorizationEndpoint: z.string().url().optional(),
    tokenEndpoint: z.string().url().optional(),
    userInfoEndpoint: z.string().url().optional(),
    jwksUri: z.string().url().optional(),
    endSessionEndpoint: z.string().url().optional(),

    // OIDC settings
    scopes: z.array(z.string()).default(['openid', 'email', 'profile']),
    responseType: z.string().default('code'),
    responseMode: z.string().optional(),

    // Security settings
    pkceEnabled: z.boolean().default(true),
    validateIssuer: z.boolean().default(true),
    validateAudience: z.boolean().default(true),
    clockTolerance: z.number().default(60), // seconds

    // Attribute mapping
    attributeMapping: z.object({
        email: z.string().default('email'),
        firstName: z.string().default('given_name'),
        lastName: z.string().default('family_name'),
        displayName: z.string().default('name'),
        groups: z.string().optional(),
        department: z.string().optional(),
        title: z.string().optional()
    }).default({
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        displayName: 'name'
    }),

    // JIT provisioning
    jitProvisioning: JITProvisioningSchema.default({})
});

// SSO configuration creation schema
export const SSOConfigCreationSchema = z.object({
    organisationId: z.string().min(1),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    provider: z.nativeEnum(SSOProvider),
    domains: z.array(z.string().email()).min(1), // Email domains that should use this SSO
    isDefault: z.boolean().default(false), // Default SSO for organization
    config: z.union([SAML2ConfigSchema, OIDCSSOConfigSchema])
});

// SSO configuration update schema
export const SSOConfigUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    domains: z.array(z.string().email()).optional(),
    isDefault: z.boolean().optional(),
    status: z.nativeEnum(SSOConfigStatus).optional(),
    config: z.union([SAML2ConfigSchema.partial(), OIDCSSOConfigSchema.partial()]).optional()
});

// SSO authentication request schema
export const SSOAuthRequestSchema = z.object({
    organisationId: z.string().min(1),
    email: z.string().email().optional(),
    domain: z.string().optional(),
    redirectUrl: z.string().url().optional(),
    state: z.string().optional()
});

// Type exports
export type JITProvisioning = z.infer<typeof JITProvisioningSchema>;
export type SAML2Config = z.infer<typeof SAML2ConfigSchema>;
export type OIDCSSOConfig = z.infer<typeof OIDCSSOConfigSchema>;
export type SSOConfigCreationData = z.infer<typeof SSOConfigCreationSchema>;
export type SSOConfigUpdateData = z.infer<typeof SSOConfigUpdateSchema>;
export type SSOAuthRequest = z.infer<typeof SSOAuthRequestSchema>;

// SSO configuration interface
export interface SSOConfiguration {
    id: string;
    organisationId: string;
    name: string;
    description?: string;
    provider: SSOProvider;
    domains: string[];
    isDefault: boolean;
    status: SSOConfigStatus;
    config: SAML2Config | OIDCSSOConfig;
    metadata?: Record<string, any>; // Provider-specific metadata
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    lastUsed?: Date;
}

// SSO authentication result
export interface SSOAuthResult {
    success: boolean;
    user?: {
        id: string;
        email: string;
        name: string;
        isNewUser: boolean;
    };
    sessionToken?: string;
    redirectUrl?: string;
    error?: string;
    errorCode?: SSOErrorCode;
}

// SSO error codes
export enum SSOErrorCode {
    INVALID_REQUEST = 'invalid_request',
    INVALID_RESPONSE = 'invalid_response',
    INVALID_ASSERTION = 'invalid_assertion',
    INVALID_SIGNATURE = 'invalid_signature',
    EXPIRED_ASSERTION = 'expired_assertion',
    INVALID_AUDIENCE = 'invalid_audience',
    INVALID_ISSUER = 'invalid_issuer',
    MISSING_ATTRIBUTES = 'missing_attributes',
    PROVISIONING_FAILED = 'provisioning_failed',
    CONFIGURATION_ERROR = 'configuration_error',
    PROVIDER_ERROR = 'provider_error'
}

// SAML assertion interface
export interface SAMLAssertion {
    id: string;
    issuer: string;
    subject: string;
    audience: string;
    notBefore: Date;
    notOnOrAfter: Date;
    sessionIndex?: string;
    attributes: Record<string, string | string[]>;
    nameID: string;
    nameIDFormat: string;
}

// OIDC token set interface
export interface OIDCTokenSet {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresIn: number;
    scope?: string;
}

// OIDC user info interface
export interface OIDCUserInfo {
    sub: string;
    email: string;
    emailVerified?: boolean;
    name?: string;
    givenName?: string;
    familyName?: string;
    picture?: string;
    locale?: string;
    [key: string]: any; // Additional claims
}

// SSO session interface
export interface SSOSession {
    id: string;
    organisationId: string;
    ssoConfigId: string;
    userId: string;
    provider: SSOProvider;
    sessionIndex?: string; // SAML session index
    nameID?: string; // SAML name ID
    subject?: string; // OIDC subject
    createdAt: Date;
    expiresAt: Date;
    lastActivity: Date;
}

// SSO audit event interface
export interface SSOAuditEvent {
    id: string;
    organisationId: string;
    ssoConfigId: string;
    userId?: number;
    event: SSOAuditEventType;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

// SSO audit event types
export enum SSOAuditEventType {
    CONFIG_CREATED = 'CONFIG_CREATED',
    CONFIG_UPDATED = 'CONFIG_UPDATED',
    CONFIG_DELETED = 'CONFIG_DELETED',
    CONFIG_ACTIVATED = 'CONFIG_ACTIVATED',
    CONFIG_DEACTIVATED = 'CONFIG_DEACTIVATED',
    LOGIN_INITIATED = 'LOGIN_INITIATED',
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILED = 'LOGIN_FAILED',
    LOGOUT_INITIATED = 'LOGOUT_INITIATED',
    LOGOUT_SUCCESS = 'LOGOUT_SUCCESS',
    USER_PROVISIONED = 'USER_PROVISIONED',
    USER_UPDATED = 'USER_UPDATED',
    ASSERTION_RECEIVED = 'ASSERTION_RECEIVED',
    TOKEN_RECEIVED = 'TOKEN_RECEIVED'
}

// SSO statistics interface
export interface SSOStatistics {
    organisationId: string;
    ssoConfigId: string;
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    newUsersProvisioned: number;
    lastLogin?: Date;
    averageLoginTime: number; // milliseconds
    generatedAt: Date;
}

// SSO metadata interface for SAML
export interface SAMLMetadata {
    entityId: string;
    acsUrl: string;
    sloUrl?: string;
    certificate?: string;
    nameIDFormats: string[];
    bindings: string[];
}

// SSO discovery result
export interface SSODiscoveryResult {
    hasSSOConfig: boolean;
    ssoConfigs: Array<{
        id: string;
        name: string;
        provider: SSOProvider;
        loginUrl: string;
    }>;
    defaultConfig?: {
        id: string;
        name: string;
        provider: SSOProvider;
        loginUrl: string;
    };
}

// SSO validation result
export interface SSOValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: SAMLMetadata;
}