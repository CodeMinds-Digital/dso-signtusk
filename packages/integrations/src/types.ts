import { z } from 'zod';

// Base Integration Types
export enum IntegrationType {
    ZAPIER = 'zapier',
    MICROSOFT_365 = 'microsoft_365',
    GOOGLE_WORKSPACE = 'google_workspace',
    SALESFORCE = 'salesforce',
}

export enum IntegrationStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ERROR = 'error',
    PENDING = 'pending',
}

export enum SyncDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
    BIDIRECTIONAL = 'bidirectional',
}

// Base Integration Configuration Schema
export const BaseIntegrationConfigSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    type: z.nativeEnum(IntegrationType),
    name: z.string(),
    description: z.string().optional(),
    status: z.nativeEnum(IntegrationStatus),
    syncDirection: z.nativeEnum(SyncDirection),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastSyncAt: z.date().optional(),
    errorMessage: z.string().optional(),
});

export type BaseIntegrationConfig = z.infer<typeof BaseIntegrationConfigSchema>;

// Zapier Integration Types
export const ZapierConfigSchema = BaseIntegrationConfigSchema.extend({
    type: z.literal(IntegrationType.ZAPIER),
    webhookUrl: z.string().url(),
    apiKey: z.string(),
    triggers: z.array(z.string()),
    actions: z.array(z.string()),
});

export type ZapierConfig = z.infer<typeof ZapierConfigSchema>;

// Microsoft 365 Integration Types
export const Microsoft365ConfigSchema = BaseIntegrationConfigSchema.extend({
    type: z.literal(IntegrationType.MICROSOFT_365),
    tenantId: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    sharepointSiteId: z.string().optional(),
    teamsChannelId: z.string().optional(),
    syncSharePoint: z.boolean().default(false),
    syncTeams: z.boolean().default(false),
});

export type Microsoft365Config = z.infer<typeof Microsoft365ConfigSchema>;

// Google Workspace Integration Types
export const GoogleWorkspaceConfigSchema = BaseIntegrationConfigSchema.extend({
    type: z.literal(IntegrationType.GOOGLE_WORKSPACE),
    clientId: z.string(),
    clientSecret: z.string(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    driveId: z.string().optional(),
    gmailEnabled: z.boolean().default(false),
    driveEnabled: z.boolean().default(false),
});

export type GoogleWorkspaceConfig = z.infer<typeof GoogleWorkspaceConfigSchema>;

// Salesforce Integration Types
export const SalesforceConfigSchema = BaseIntegrationConfigSchema.extend({
    type: z.literal(IntegrationType.SALESFORCE),
    instanceUrl: z.string().url(),
    clientId: z.string(),
    clientSecret: z.string(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    syncContacts: z.boolean().default(false),
    syncOpportunities: z.boolean().default(false),
    syncAccounts: z.boolean().default(false),
});

export type SalesforceConfig = z.infer<typeof SalesforceConfigSchema>;

// Union type for all integration configs
export type IntegrationConfig = ZapierConfig | Microsoft365Config | GoogleWorkspaceConfig | SalesforceConfig;

// Sync Event Types
export enum SyncEventType {
    DOCUMENT_CREATED = 'document_created',
    DOCUMENT_SIGNED = 'document_signed',
    DOCUMENT_COMPLETED = 'document_completed',
    DOCUMENT_DECLINED = 'document_declined',
    CONTACT_CREATED = 'contact_created',
    CONTACT_UPDATED = 'contact_updated',
}

export const SyncEventSchema = z.object({
    id: z.string(),
    integrationId: z.string(),
    eventType: z.nativeEnum(SyncEventType),
    entityId: z.string(),
    entityType: z.string(),
    data: z.record(z.any()),
    timestamp: z.date(),
    processed: z.boolean().default(false),
    error: z.string().optional(),
});

export type SyncEvent = z.infer<typeof SyncEventSchema>;

// Integration Error Types
export class IntegrationError extends Error {
    constructor(
        message: string,
        public readonly integrationType: IntegrationType,
        public readonly code?: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'IntegrationError';
    }
}

export class AuthenticationError extends IntegrationError {
    constructor(integrationType: IntegrationType, details?: any) {
        super('Authentication failed', integrationType, 'AUTH_FAILED', details);
        this.name = 'AuthenticationError';
    }
}

export class SyncError extends IntegrationError {
    constructor(integrationType: IntegrationType, message: string, details?: any) {
        super(`Sync failed: ${message}`, integrationType, 'SYNC_FAILED', details);
        this.name = 'SyncError';
    }
}

// Integration Service Interface
export interface IntegrationService {
    authenticate(config: IntegrationConfig): Promise<boolean>;
    sync(config: IntegrationConfig, events: SyncEvent[]): Promise<void>;
    validateConfig(config: Partial<IntegrationConfig>): Promise<boolean>;
    getStatus(config: IntegrationConfig): Promise<IntegrationStatus>;
    disconnect(config: IntegrationConfig): Promise<void>;
}

// Webhook payload types for different integrations
export interface ZapierWebhookPayload {
    trigger: string;
    data: Record<string, any>;
    timestamp: string;
}

export interface Microsoft365WebhookPayload {
    subscriptionId: string;
    changeType: string;
    resource: string;
    resourceData: Record<string, any>;
    clientState?: string;
}

export interface GoogleWorkspaceWebhookPayload {
    kind: string;
    id: string;
    resourceId: string;
    resourceUri: string;
    token?: string;
    expiration?: string;
}

export interface SalesforceWebhookPayload {
    sobjectType: string;
    eventType: string;
    replayId: number;
    data: {
        schema: string;
        payload: Record<string, any>;
        event: {
            replayId: number;
        };
    };
}