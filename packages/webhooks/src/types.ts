import { z } from 'zod';

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export const WebhookEventTypeSchema = z.enum([
    // Document events
    'document.created',
    'document.updated',
    'document.deleted',
    'document.shared',
    'document.unshared',
    'document.viewed',
    'document.downloaded',

    // Signing events
    'signing_request.created',
    'signing_request.sent',
    'signing_request.completed',
    'signing_request.cancelled',
    'signing_request.expired',
    'signing_request.declined',

    // Recipient events
    'recipient.added',
    'recipient.removed',
    'recipient.viewed',
    'recipient.signed',
    'recipient.declined',
    'recipient.delegated',

    // Template events
    'template.created',
    'template.updated',
    'template.deleted',
    'template.shared',
    'template.used',

    // Organization events
    'organization.updated',
    'organization.member_added',
    'organization.member_removed',
    'organization.member_role_changed',

    // User events
    'user.created',
    'user.updated',
    'user.deleted',
    'user.activated',
    'user.deactivated',

    // Security events
    'security.login_failed',
    'security.account_locked',
    'security.suspicious_activity',
    'security.password_changed',
    'security.two_factor_enabled',
    'security.two_factor_disabled',

    // Integration events
    'integration.connected',
    'integration.disconnected',
    'integration.sync_completed',
    'integration.sync_failed',
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

// ============================================================================
// WEBHOOK CONFIGURATION
// ============================================================================

export const WebhookConfigSchema = z.object({
    url: z.string().url(),
    events: z.array(WebhookEventTypeSchema),
    secret: z.string().min(32),
    version: z.string().default('v1'),
    timeout: z.number().min(1000).max(30000).default(10000), // 1-30 seconds
    retryPolicy: z.object({
        maxRetries: z.number().min(0).max(10).default(3),
        initialDelay: z.number().min(1000).max(60000).default(1000), // 1-60 seconds
        maxDelay: z.number().min(1000).max(3600000).default(300000), // 1-3600 seconds
        backoffMultiplier: z.number().min(1).max(10).default(2),
    }).default({}),
    headers: z.record(z.string()).optional(),
    active: z.boolean().default(true),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

// ============================================================================
// WEBHOOK EVENT PAYLOAD
// ============================================================================

export const WebhookEventPayloadSchema = z.object({
    id: z.string(),
    type: WebhookEventTypeSchema,
    version: z.string(),
    timestamp: z.string().datetime(),
    organizationId: z.string(),
    data: z.record(z.any()),
    metadata: z.object({
        userId: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        source: z.string().optional(),
        correlationId: z.string().optional(),
    }).optional(),
});

export type WebhookEventPayload = z.infer<typeof WebhookEventPayloadSchema>;

// ============================================================================
// WEBHOOK DELIVERY
// ============================================================================

export const WebhookDeliveryStatusSchema = z.enum([
    'pending',
    'delivered',
    'failed',
    'cancelled',
]);

export type WebhookDeliveryStatus = z.infer<typeof WebhookDeliveryStatusSchema>;

export const WebhookDeliverySchema = z.object({
    id: z.string(),
    webhookId: z.string(),
    eventType: WebhookEventTypeSchema,
    payload: WebhookEventPayloadSchema,
    status: WebhookDeliveryStatusSchema,
    attempts: z.number().min(0),
    maxRetries: z.number().min(0),
    nextAttemptAt: z.date().optional(),
    lastAttemptAt: z.date().optional(),
    responseStatus: z.number().optional(),
    responseBody: z.string().optional(),
    responseHeaders: z.record(z.string()).optional(),
    error: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;

// ============================================================================
// WEBHOOK REGISTRATION
// ============================================================================

export const CreateWebhookRequestSchema = z.object({
    url: z.string().url(),
    events: z.array(WebhookEventTypeSchema).min(1),
    secret: z.string().min(32).optional(),
    timeout: z.number().min(1000).max(30000).optional(),
    retryPolicy: z.object({
        maxRetries: z.number().min(0).max(10).optional(),
        initialDelay: z.number().min(1000).max(60000).optional(),
        maxDelay: z.number().min(1000).max(3600000).optional(),
        backoffMultiplier: z.number().min(1).max(10).optional(),
    }).optional(),
    headers: z.record(z.string()).optional(),
});

export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;

export const UpdateWebhookRequestSchema = CreateWebhookRequestSchema.partial();
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;

export const WebhookSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    url: z.string().url(),
    events: z.array(WebhookEventTypeSchema),
    secret: z.string(),
    version: z.string(),
    timeout: z.number(),
    retryPolicy: z.object({
        maxRetries: z.number(),
        initialDelay: z.number(),
        maxDelay: z.number(),
        backoffMultiplier: z.number(),
    }),
    headers: z.record(z.string()).optional(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Webhook = z.infer<typeof WebhookSchema>;

// ============================================================================
// WEBHOOK SIGNATURE
// ============================================================================

export const WebhookSignatureSchema = z.object({
    timestamp: z.string(),
    signature: z.string(),
    algorithm: z.string().default('sha256'),
});

export type WebhookSignature = z.infer<typeof WebhookSignatureSchema>;

// ============================================================================
// WEBHOOK ERRORS
// ============================================================================

export class WebhookError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public details?: any
    ) {
        super(message);
        this.name = 'WebhookError';
    }
}

export class WebhookValidationError extends WebhookError {
    constructor(message: string, details?: any) {
        super(message, 'WEBHOOK_VALIDATION_ERROR', 400, details);
        this.name = 'WebhookValidationError';
    }
}

export class WebhookDeliveryError extends WebhookError {
    constructor(message: string, details?: any) {
        super(message, 'WEBHOOK_DELIVERY_ERROR', 500, details);
        this.name = 'WebhookDeliveryError';
    }
}

export class WebhookSignatureError extends WebhookError {
    constructor(message: string, details?: any) {
        super(message, 'WEBHOOK_SIGNATURE_ERROR', 401, details);
        this.name = 'WebhookSignatureError';
    }
}

// ============================================================================
// WEBHOOK SERVICE INTERFACES
// ============================================================================

export interface WebhookRepository {
    create(organizationId: string, config: WebhookConfig): Promise<Webhook>;
    findById(id: string): Promise<Webhook | null>;
    findByOrganization(organizationId: string): Promise<Webhook[]>;
    update(id: string, updates: Partial<WebhookConfig>): Promise<Webhook>;
    delete(id: string): Promise<boolean>;
    findByEvent(organizationId: string, eventType: WebhookEventType): Promise<Webhook[]>;
}

export interface WebhookDeliveryRepository {
    create(delivery: Omit<WebhookDelivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookDelivery>;
    findById(id: string): Promise<WebhookDelivery | null>;
    findByWebhook(webhookId: string, limit?: number): Promise<WebhookDelivery[]>;
    update(id: string, updates: Partial<WebhookDelivery>): Promise<WebhookDelivery>;
    findPendingRetries(limit?: number): Promise<WebhookDelivery[]>;
    markAsDelivered(id: string, responseStatus: number, responseBody?: string, responseHeaders?: Record<string, string>): Promise<void>;
    markAsFailed(id: string, error: string, responseStatus?: number, responseBody?: string): Promise<void>;
}

export interface WebhookEventEmitter {
    emit(organizationId: string, eventType: WebhookEventType, data: any, metadata?: any): Promise<void>;
}

export interface WebhookDeliveryService {
    deliver(delivery: WebhookDelivery): Promise<void>;
    scheduleRetry(delivery: WebhookDelivery): Promise<void>;
    processRetries(): Promise<void>;
}

export interface WebhookSignatureService {
    generateSignature(payload: string, secret: string, timestamp?: string): WebhookSignature;
    verifySignature(payload: string, signature: WebhookSignature, secret: string): boolean;
    parseSignatureHeader(header: string): WebhookSignature;
    formatSignatureHeader(signature: WebhookSignature): string;
}