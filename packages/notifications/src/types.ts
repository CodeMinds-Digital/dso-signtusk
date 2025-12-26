import { z } from 'zod';

/**
 * Notification Channel Types
 */
export enum NotificationChannel {
    EMAIL = 'email',
    SMS = 'sms',
    PUSH = 'push',
    IN_APP = 'in_app',
    WEBHOOK = 'webhook'
}

/**
 * Notification Priority Levels
 */
export enum NotificationPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent'
}

/**
 * Notification Status
 */
export enum NotificationStatus {
    PENDING = 'pending',
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

/**
 * SMS Provider Types
 */
export enum SMSProvider {
    TWILIO = 'twilio',
    AWS_SNS = 'aws_sns',
    VONAGE = 'vonage'
}

/**
 * Push Notification Provider Types
 */
export enum PushProvider {
    FIREBASE = 'firebase',
    APNS = 'apns',
    WEB_PUSH = 'web_push'
}

/**
 * Template Engine Types
 */
export enum TemplateEngine {
    HANDLEBARS = 'handlebars',
    REACT_EMAIL = 'react_email',
    MUSTACHE = 'mustache'
}

/**
 * Base Notification Configuration
 */
export const NotificationConfigSchema = z.object({
    id: z.string(),
    userId: z.string(),
    organizationId: z.string().optional(),
    channel: z.nativeEnum(NotificationChannel),
    priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
    templateId: z.string(),
    templateData: z.record(z.any()).default({}),
    recipient: z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        pushToken: z.string().optional(),
        userId: z.string().optional(),
        name: z.string().optional()
    }),
    scheduledAt: z.date().optional(),
    expiresAt: z.date().optional(),
    metadata: z.record(z.any()).default({})
});

export type NotificationConfig = z.infer<typeof NotificationConfigSchema>;

/**
 * SMS Configuration
 */
export const SMSConfigSchema = z.object({
    provider: z.nativeEnum(SMSProvider),
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    fromNumber: z.string(),
    region: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional()
});

export type SMSConfig = z.infer<typeof SMSConfigSchema>;

/**
 * Push Notification Configuration
 */
export const PushConfigSchema = z.object({
    provider: z.nativeEnum(PushProvider),
    serviceAccountKey: z.string().optional(),
    projectId: z.string().optional(),
    vapidKeys: z.object({
        publicKey: z.string(),
        privateKey: z.string(),
        subject: z.string()
    }).optional(),
    apnsCertificate: z.string().optional(),
    apnsKey: z.string().optional(),
    apnsKeyId: z.string().optional(),
    apnsTeamId: z.string().optional(),
    bundleId: z.string().optional()
});

export type PushConfig = z.infer<typeof PushConfigSchema>;

/**
 * Email Template Customization
 */
export const EmailTemplateCustomizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    engine: z.nativeEnum(TemplateEngine),
    subject: z.string(),
    htmlTemplate: z.string(),
    textTemplate: z.string().optional(),
    variables: z.array(z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'boolean', 'date', 'object']),
        required: z.boolean().default(false),
        description: z.string().optional(),
        defaultValue: z.any().optional()
    })).default([]),
    styles: z.object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        fontSize: z.string().optional(),
        backgroundColor: z.string().optional(),
        headerImage: z.string().optional(),
        footerText: z.string().optional()
    }).optional(),
    organizationId: z.string().optional(),
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
});

export type EmailTemplateCustomization = z.infer<typeof EmailTemplateCustomizationSchema>;

/**
 * Notification Schedule Configuration
 */
export const NotificationScheduleSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    cronExpression: z.string().optional(),
    timezone: z.string().default('UTC'),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    isActive: z.boolean().default(true),
    notificationTemplate: NotificationConfigSchema.omit({ id: true, scheduledAt: true }),
    lastRun: z.date().optional(),
    nextRun: z.date().optional(),
    runCount: z.number().default(0),
    maxRuns: z.number().optional(),
    organizationId: z.string().optional(),
    createdBy: z.string(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
});

export type NotificationSchedule = z.infer<typeof NotificationScheduleSchema>;

/**
 * Notification Delivery Result
 */
export const NotificationDeliveryResultSchema = z.object({
    id: z.string(),
    notificationId: z.string(),
    channel: z.nativeEnum(NotificationChannel),
    status: z.nativeEnum(NotificationStatus),
    providerId: z.string().optional(),
    providerResponse: z.record(z.any()).optional(),
    deliveredAt: z.date().optional(),
    failureReason: z.string().optional(),
    retryCount: z.number().default(0),
    metadata: z.record(z.any()).default({})
});

export type NotificationDeliveryResult = z.infer<typeof NotificationDeliveryResultSchema>;

/**
 * Communication Analytics
 */
export const CommunicationAnalyticsSchema = z.object({
    id: z.string(),
    organizationId: z.string().optional(),
    userId: z.string().optional(),
    channel: z.nativeEnum(NotificationChannel),
    templateId: z.string().optional(),
    eventType: z.enum(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed']),
    timestamp: z.date(),
    metadata: z.record(z.any()).default({}),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    location: z.object({
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional()
    }).optional()
});

export type CommunicationAnalytics = z.infer<typeof CommunicationAnalyticsSchema>;

/**
 * Engagement Metrics
 */
export interface EngagementMetrics {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalComplained: number;
    totalUnsubscribed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
    unsubscribeRate: number;
    engagementScore: number;
}

/**
 * Template Performance Metrics
 */
export interface TemplatePerformanceMetrics {
    templateId: string;
    templateName: string;
    channel: NotificationChannel;
    metrics: EngagementMetrics;
    timeRange: {
        start: Date;
        end: Date;
    };
    trends: {
        period: string;
        metrics: EngagementMetrics;
    }[];
}

/**
 * Notification Service Interfaces
 */
export interface NotificationService {
    send(config: NotificationConfig): Promise<NotificationDeliveryResult>;
    schedule(schedule: NotificationSchedule): Promise<string>;
    cancel(notificationId: string): Promise<boolean>;
    getStatus(notificationId: string): Promise<NotificationStatus>;
    retry(notificationId: string): Promise<NotificationDeliveryResult>;
}

export interface SMSService {
    sendSMS(to: string, message: string, from?: string): Promise<NotificationDeliveryResult>;
    getDeliveryStatus(messageId: string): Promise<NotificationStatus>;
    validatePhoneNumber(phoneNumber: string): Promise<boolean>;
}

export interface PushNotificationService {
    sendPush(token: string, payload: PushPayload): Promise<NotificationDeliveryResult>;
    sendBulkPush(tokens: string[], payload: PushPayload): Promise<NotificationDeliveryResult[]>;
    validateToken(token: string): Promise<boolean>;
    subscribeToTopic(token: string, topic: string): Promise<boolean>;
    unsubscribeFromTopic(token: string, topic: string): Promise<boolean>;
}

export interface EmailTemplateService {
    createTemplate(template: EmailTemplateCustomization): Promise<string>;
    updateTemplate(id: string, template: Partial<EmailTemplateCustomization>): Promise<boolean>;
    deleteTemplate(id: string): Promise<boolean>;
    getTemplate(id: string): Promise<EmailTemplateCustomization | null>;
    listTemplates(organizationId?: string): Promise<EmailTemplateCustomization[]>;
    renderTemplate(templateId: string, data: Record<string, any>): Promise<{ html: string; text?: string; subject: string }>;
    previewTemplate(template: EmailTemplateCustomization, data: Record<string, any>): Promise<{ html: string; text?: string; subject: string }>;
}

export interface NotificationScheduler {
    schedule(schedule: NotificationSchedule): Promise<string>;
    updateSchedule(id: string, schedule: Partial<NotificationSchedule>): Promise<boolean>;
    deleteSchedule(id: string): Promise<boolean>;
    getSchedule(id: string): Promise<NotificationSchedule | null>;
    listSchedules(organizationId?: string): Promise<NotificationSchedule[]>;
    pauseSchedule(id: string): Promise<boolean>;
    resumeSchedule(id: string): Promise<boolean>;
}

export interface AnalyticsService {
    trackEvent(event: CommunicationAnalytics): Promise<void>;
    getEngagementMetrics(filters: AnalyticsFilters): Promise<EngagementMetrics>;
    getTemplatePerformance(templateId: string, timeRange: { start: Date; end: Date }): Promise<TemplatePerformanceMetrics>;
    getChannelPerformance(channel: NotificationChannel, timeRange: { start: Date; end: Date }): Promise<EngagementMetrics>;
    getUserEngagement(userId: string, timeRange: { start: Date; end: Date }): Promise<EngagementMetrics>;
    getOrganizationAnalytics(organizationId: string, timeRange: { start: Date; end: Date }): Promise<EngagementMetrics>;
    generateReport(filters: AnalyticsFilters): Promise<AnalyticsReport>;
}

/**
 * Push Notification Payload
 */
export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    sound?: string;
    data?: Record<string, any>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
    vibrate?: number[];
    image?: string;
}

/**
 * Analytics Filters
 */
export interface AnalyticsFilters {
    organizationId?: string;
    userId?: string;
    channel?: NotificationChannel;
    templateId?: string;
    timeRange: {
        start: Date;
        end: Date;
    };
    groupBy?: 'day' | 'week' | 'month';
}

/**
 * Analytics Report
 */
export interface AnalyticsReport {
    summary: EngagementMetrics;
    channelBreakdown: Record<NotificationChannel, EngagementMetrics>;
    templatePerformance: TemplatePerformanceMetrics[];
    trends: {
        period: string;
        metrics: EngagementMetrics;
    }[];
    topPerformingTemplates: {
        templateId: string;
        templateName: string;
        engagementScore: number;
    }[];
    recommendations: string[];
}

/**
 * Drag and Drop Template Builder Components
 */
export interface TemplateComponent {
    id: string;
    type: 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'header' | 'footer' | 'social';
    properties: Record<string, any>;
    styles: Record<string, any>;
    content?: string;
    children?: TemplateComponent[];
}

export interface TemplateLayout {
    id: string;
    name: string;
    components: TemplateComponent[];
    globalStyles: Record<string, any>;
    metadata: Record<string, any>;
}

/**
 * Template Builder Service
 */
export interface TemplateBuilderService {
    createLayout(layout: TemplateLayout): Promise<string>;
    updateLayout(id: string, layout: Partial<TemplateLayout>): Promise<boolean>;
    deleteLayout(id: string): Promise<boolean>;
    getLayout(id: string): Promise<TemplateLayout | null>;
    listLayouts(organizationId?: string): Promise<TemplateLayout[]>;
    renderLayout(layoutId: string, data: Record<string, any>): Promise<string>;
    exportLayout(layoutId: string, format: 'html' | 'json'): Promise<string>;
    importLayout(data: string, format: 'html' | 'json'): Promise<TemplateLayout>;
}

/**
 * Notification Preferences
 */
export const NotificationPreferencesSchema = z.object({
    userId: z.string(),
    organizationId: z.string().optional(),
    channels: z.record(z.nativeEnum(NotificationChannel), z.boolean()).default({}),
    categories: z.record(z.string(), z.boolean()).default({}),
    quietHours: z.object({
        enabled: z.boolean().default(false),
        start: z.string().optional(), // HH:mm format
        end: z.string().optional(),   // HH:mm format
        timezone: z.string().default('UTC')
    }).optional(),
    frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
    language: z.string().default('en'),
    unsubscribeToken: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

/**
 * Notification Preferences Service
 */
export interface NotificationPreferencesService {
    getPreferences(userId: string): Promise<NotificationPreferences | null>;
    updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean>;
    unsubscribe(token: string, channel?: NotificationChannel): Promise<boolean>;
    resubscribe(token: string, channel?: NotificationChannel): Promise<boolean>;
    checkPermission(userId: string, channel: NotificationChannel, category?: string): Promise<boolean>;
}

/**
 * Error Types
 */
export class NotificationError extends Error {
    constructor(
        message: string,
        public code: string,
        public channel?: NotificationChannel,
        public details?: any
    ) {
        super(message);
        this.name = 'NotificationError';
    }
}

export class SMSError extends NotificationError {
    constructor(message: string, details?: any) {
        super(message, 'SMS_ERROR', NotificationChannel.SMS, details);
        this.name = 'SMSError';
    }
}

export class PushNotificationError extends NotificationError {
    constructor(message: string, details?: any) {
        super(message, 'PUSH_ERROR', NotificationChannel.PUSH, details);
        this.name = 'PushNotificationError';
    }
}

export class TemplateError extends NotificationError {
    constructor(message: string, details?: any) {
        super(message, 'TEMPLATE_ERROR', undefined, details);
        this.name = 'TemplateError';
    }
}

export class SchedulingError extends NotificationError {
    constructor(message: string, details?: any) {
        super(message, 'SCHEDULING_ERROR', undefined, details);
        this.name = 'SchedulingError';
    }
}