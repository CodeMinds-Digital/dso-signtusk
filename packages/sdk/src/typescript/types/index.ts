/**
 * Type definitions for the Signtusk SDK
 */

export interface SDKConfiguration {
    /** API key for authentication */
    apiKey?: string;
    /** Base URL for the API */
    baseURL?: string;
    /** Environment (development, staging, production) */
    environment?: 'development' | 'staging' | 'production';
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Number of retry attempts */
    retries?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** OAuth configuration */
    oauth?: OAuthConfiguration;
    /** JWT configuration */
    jwt?: JWTConfiguration;
    /** Custom HTTP client */
    httpClient?: any;
}

export interface OAuthConfiguration {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes?: string[];
}

export interface JWTConfiguration {
    token: string;
}

export interface APIResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
    requestId: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export interface Document {
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    status: DocumentStatus;
    folderId?: string;
    organizationId: string;
    createdBy: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error' | 'deleted';

export interface DocumentUploadRequest {
    file: File | Buffer | NodeJS.ReadableStream;
    name: string;
    folderId?: string;
    metadata?: Record<string, any>;
}

export interface Template {
    id: string;
    name: string;
    description?: string;
    documentId: string;
    organizationId: string;
    createdBy: string;
    isPublic: boolean;
    fields: TemplateField[];
    recipients: TemplateRecipient[];
    workflow: WorkflowDefinition;
    createdAt: string;
    updatedAt: string;
}

export interface TemplateField {
    id: string;
    type: FieldType;
    position: FieldPosition;
    properties: FieldProperties;
    recipientRole: string;
    required: boolean;
}

export type FieldType = 'signature' | 'initial' | 'text' | 'date' | 'checkbox' | 'dropdown';

export interface FieldPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
}

export interface FieldProperties {
    placeholder?: string;
    defaultValue?: string;
    options?: string[];
    validation?: FieldValidation;
}

export interface FieldValidation {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
}

export interface TemplateRecipient {
    role: string;
    name?: string;
    email?: string;
    order: number;
    action: RecipientAction;
}

export type RecipientAction = 'sign' | 'approve' | 'review' | 'receive';

export interface WorkflowDefinition {
    type: WorkflowType;
    steps: WorkflowStep[];
}

export type WorkflowType = 'sequential' | 'parallel' | 'conditional';

export interface WorkflowStep {
    id: string;
    recipients: string[];
    action: RecipientAction;
    condition?: WorkflowCondition;
    order: number;
}

export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value: any;
}

export interface SigningRequest {
    id: string;
    documentId: string;
    templateId?: string;
    organizationId: string;
    createdBy: string;
    status: SigningStatus;
    workflow: WorkflowExecution;
    recipients: Recipient[];
    signingUrl?: string;
    completedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

export type SigningStatus = 'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export interface WorkflowExecution {
    id: string;
    currentStep: number;
    steps: WorkflowStepExecution[];
    status: WorkflowStatus;
}

export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkflowStepExecution {
    id: string;
    stepId: string;
    status: WorkflowStepStatus;
    startedAt?: string;
    completedAt?: string;
    recipients: RecipientExecution[];
}

export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface RecipientExecution {
    recipientId: string;
    status: RecipientStatus;
    signedAt?: string;
    ipAddress?: string;
    userAgent?: string;
}

export type RecipientStatus = 'pending' | 'sent' | 'opened' | 'signed' | 'declined';

export interface Recipient {
    id: string;
    email: string;
    name: string;
    role: string;
    order: number;
    action: RecipientAction;
    status: RecipientStatus;
    signingUrl?: string;
    accessCode?: string;
    phoneNumber?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Signature {
    id: string;
    fieldId: string;
    recipientId: string;
    type: SignatureType;
    data: string;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    biometricData?: BiometricData;
}

export type SignatureType = 'drawn' | 'typed' | 'uploaded' | 'digital';

export interface BiometricData {
    pressure: number[];
    velocity: number[];
    acceleration: number[];
    timestamp: number[];
}

export interface Organization {
    id: string;
    name: string;
    domain?: string;
    settings: OrganizationSettings;
    subscription: Subscription;
    branding: BrandingConfig;
    createdAt: string;
    updatedAt: string;
}

export interface OrganizationSettings {
    allowPublicTemplates: boolean;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    ipWhitelist?: string[];
}

export interface Subscription {
    id: string;
    plan: string;
    status: SubscriptionStatus;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    usage: UsageMetrics;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid';

export interface UsageMetrics {
    documentsUsed: number;
    documentsLimit: number;
    signaturesUsed: number;
    signaturesLimit: number;
}

export interface BrandingConfig {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    organizationId: string;
    roles: Role[];
    preferences: UserPreferences;
    securitySettings: SecuritySettings;
    createdAt: string;
    updatedAt: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
}

export interface UserPreferences {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
}

export interface SecuritySettings {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    loginAttempts: number;
    lockedUntil?: string;
}

export interface Webhook {
    id: string;
    organizationId: string;
    url: string;
    events: WebhookEvent[];
    secret: string;
    status: WebhookStatus;
    createdAt: string;
    updatedAt: string;
}

export type WebhookEvent =
    | 'document.uploaded'
    | 'document.signed'
    | 'document.completed'
    | 'signing.created'
    | 'signing.sent'
    | 'signing.completed'
    | 'signing.cancelled'
    | 'recipient.signed'
    | 'recipient.declined';

export type WebhookStatus = 'active' | 'inactive' | 'failed';

export interface WebhookDelivery {
    id: string;
    webhookId: string;
    event: WebhookEvent;
    payload: any;
    status: WebhookDeliveryStatus;
    attempts: number;
    lastAttempt: string;
    nextAttempt?: string;
    response?: WebhookResponse;
}

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'cancelled';

export interface WebhookResponse {
    status: number;
    headers: Record<string, string>;
    body: string;
}

export interface AnalyticsData {
    metric: string;
    value: number;
    timestamp: string;
    dimensions?: Record<string, string>;
}

export interface AnalyticsQuery {
    metrics: string[];
    dimensions?: string[];
    filters?: AnalyticsFilter[];
    dateRange: DateRange;
    granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsFilter {
    dimension: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
    value: any;
}

export interface DateRange {
    start: string;
    end: string;
}

export interface EventSubscription {
    event: string;
    callback: (data: any) => void;
}

export interface ListOptions {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: Record<string, any>;
}

export interface SearchOptions extends ListOptions {
    query?: string;
    fields?: string[];
}

export interface BulkOperation {
    id: string;
    type: BulkOperationType;
    status: BulkOperationStatus;
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    errors: BulkOperationError[];
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

export type BulkOperationType = 'upload' | 'send' | 'cancel' | 'delete' | 'update';

export type BulkOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BulkOperationError {
    itemId: string;
    error: string;
    details?: any;
}