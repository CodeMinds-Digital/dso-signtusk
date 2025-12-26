import { z } from 'zod';

// ============================================================================
// REMINDER SYSTEM TYPES
// ============================================================================

export enum ReminderType {
    INITIAL = 'initial',
    FOLLOW_UP = 'follow_up',
    URGENT = 'urgent',
    FINAL = 'final',
    ESCALATION = 'escalation'
}

export enum ReminderChannel {
    EMAIL = 'email',
    SMS = 'sms',
    PUSH = 'push',
    IN_APP = 'in_app'
}

export enum ReminderStatus {
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export enum EscalationLevel {
    NONE = 'none',
    SUPERVISOR = 'supervisor',
    MANAGER = 'manager',
    ADMIN = 'admin'
}

// ============================================================================
// REMINDER CONFIGURATION SCHEMAS
// ============================================================================

export const ReminderConfigSchema = z.object({
    enabled: z.boolean().default(true),
    channels: z.array(z.nativeEnum(ReminderChannel)).default([ReminderChannel.EMAIL]),
    schedule: z.object({
        initialDelay: z.number().min(0).default(24), // hours
        intervals: z.array(z.number().min(1)).default([72, 168, 336]), // hours: 3 days, 1 week, 2 weeks
        maxReminders: z.number().min(1).max(10).default(3),
        businessHoursOnly: z.boolean().default(true),
        timezone: z.string().default('UTC'),
        excludeWeekends: z.boolean().default(true),
    }),
    escalation: z.object({
        enabled: z.boolean().default(true),
        afterReminders: z.number().min(1).default(2),
        levels: z.array(z.nativeEnum(EscalationLevel)).default([EscalationLevel.SUPERVISOR]),
        notifyManagement: z.boolean().default(true),
    }),
    personalization: z.object({
        useRecipientName: z.boolean().default(true),
        includeProgress: z.boolean().default(true),
        customMessage: z.string().optional(),
        urgencyIndicators: z.boolean().default(true),
    }),
    optimization: z.object({
        adaptiveScheduling: z.boolean().default(true),
        channelOptimization: z.boolean().default(true),
        timeOptimization: z.boolean().default(true),
        contentOptimization: z.boolean().default(true),
    }),
});

export type ReminderConfig = z.infer<typeof ReminderConfigSchema>;

// ============================================================================
// REMINDER JOB PAYLOADS
// ============================================================================

export interface ScheduleReminderJob {
    signingRequestId: string;
    recipientId: string;
    reminderType: ReminderType;
    scheduledAt: Date;
    config: ReminderConfig;
    metadata?: Record<string, any>;
}

export interface SendReminderJob {
    reminderId: string;
    signingRequestId: string;
    recipientId: string;
    reminderType: ReminderType;
    channels: ReminderChannel[];
    content: ReminderContent;
    metadata?: Record<string, any>;
}

export interface EscalateReminderJob {
    signingRequestId: string;
    recipientId: string;
    escalationLevel: EscalationLevel;
    reminderHistory: ReminderHistoryEntry[];
    metadata?: Record<string, any>;
}

export interface OptimizeReminderJob {
    organizationId: string;
    analysisType: 'effectiveness' | 'timing' | 'channels' | 'content';
    timeRange: {
        start: Date;
        end: Date;
    };
    metadata?: Record<string, any>;
}

// ============================================================================
// REMINDER CONTENT AND DELIVERY
// ============================================================================

export interface ReminderContent {
    subject: string;
    message: string;
    actionUrl: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    personalization: {
        recipientName: string;
        documentTitle: string;
        senderName: string;
        organizationName: string;
        daysRemaining?: number;
        progressPercentage?: number;
    };
    branding?: {
        logoUrl?: string;
        primaryColor?: string;
        organizationName?: string;
    };
}

export interface ReminderDeliveryResult {
    channel: ReminderChannel;
    status: 'success' | 'failed' | 'pending';
    deliveredAt?: Date;
    errorMessage?: string;
    deliveryId?: string;
    metadata?: Record<string, any>;
}

export interface ReminderHistoryEntry {
    id: string;
    type: ReminderType;
    channels: ReminderChannel[];
    scheduledAt: Date;
    sentAt?: Date;
    deliveryResults: ReminderDeliveryResult[];
    effectiveness?: {
        opened: boolean;
        clicked: boolean;
        responded: boolean;
        responseTime?: number; // minutes
    };
}

// ============================================================================
// REMINDER ANALYTICS AND OPTIMIZATION
// ============================================================================

export interface ReminderAnalytics {
    organizationId: string;
    timeRange: {
        start: Date;
        end: Date;
    };
    metrics: {
        totalReminders: number;
        deliveryRate: number;
        openRate: number;
        clickRate: number;
        responseRate: number;
        averageResponseTime: number; // hours
        escalationRate: number;
        channelEffectiveness: Record<ReminderChannel, {
            deliveryRate: number;
            openRate: number;
            clickRate: number;
            responseRate: number;
        }>;
        timeEffectiveness: Record<string, number>; // hour of day -> response rate
        typeEffectiveness: Record<ReminderType, {
            responseRate: number;
            averageResponseTime: number;
        }>;
    };
    recommendations: ReminderOptimizationRecommendation[];
}

export interface ReminderOptimizationRecommendation {
    id: string;
    type: 'schedule' | 'channel' | 'content' | 'timing';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    expectedImprovement: {
        metric: string;
        value: number;
        unit: string;
    };
    implementation: {
        action: string;
        parameters: Record<string, any>;
        effort: 'low' | 'medium' | 'high';
    };
}

// ============================================================================
// INTELLIGENT SCHEDULING TYPES
// ============================================================================

export interface IntelligentSchedulingContext {
    recipient: {
        id: string;
        email: string;
        timezone?: string;
        preferredContactHours?: {
            start: number; // 0-23
            end: number; // 0-23
        };
        historicalResponsePatterns?: {
            bestDayOfWeek: number; // 0-6 (Sunday-Saturday)
            bestHourOfDay: number; // 0-23
            averageResponseTime: number; // hours
            preferredChannel: ReminderChannel;
        };
    };
    document: {
        id: string;
        title: string;
        urgency: 'low' | 'medium' | 'high' | 'critical';
        complexity: 'simple' | 'medium' | 'complex';
        estimatedSigningTime: number; // minutes
    };
    organization: {
        id: string;
        timezone: string;
        businessHours: {
            start: number; // 0-23
            end: number; // 0-23
        };
        workDays: number[]; // 0-6 (Sunday-Saturday)
    };
    context: {
        currentReminders: number;
        daysUntilExpiration?: number;
        isUrgent: boolean;
        hasEscalated: boolean;
    };
}

export interface OptimalReminderSchedule {
    reminders: Array<{
        type: ReminderType;
        scheduledAt: Date;
        channels: ReminderChannel[];
        confidence: number; // 0-1
        reasoning: string;
    }>;
    escalation?: {
        scheduledAt: Date;
        level: EscalationLevel;
        confidence: number;
        reasoning: string;
    };
    metadata: {
        algorithm: string;
        version: string;
        factors: Record<string, any>;
    };
}

// ============================================================================
// MULTI-CHANNEL DELIVERY TYPES
// ============================================================================

export interface EmailReminderPayload {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    trackingEnabled: boolean;
    priority: 'low' | 'normal' | 'high';
}

export interface SMSReminderPayload {
    to: string;
    message: string;
    shortUrl: string;
    trackingEnabled: boolean;
}

export interface PushReminderPayload {
    userId: string;
    title: string;
    body: string;
    data: Record<string, any>;
    badge?: number;
    sound?: string;
}

export interface InAppReminderPayload {
    userId: string;
    type: 'notification' | 'banner' | 'modal';
    title: string;
    message: string;
    actionUrl: string;
    priority: 'low' | 'medium' | 'high';
    expiresAt?: Date;
}

// ============================================================================
// ESCALATION MANAGEMENT TYPES
// ============================================================================

export interface EscalationRule {
    id: string;
    organizationId: string;
    name: string;
    conditions: {
        reminderCount: number;
        timeElapsed: number; // hours
        documentUrgency?: 'low' | 'medium' | 'high' | 'critical';
        recipientRole?: string;
    };
    actions: EscalationAction[];
    isActive: boolean;
}

export interface EscalationAction {
    type: 'notify_supervisor' | 'notify_manager' | 'notify_admin' | 'change_channel' | 'increase_frequency';
    parameters: Record<string, any>;
    delay?: number; // minutes
}

export interface EscalationNotification {
    recipientId: string;
    escalationLevel: EscalationLevel;
    signingRequestId: string;
    documentTitle: string;
    originalRecipient: {
        name: string;
        email: string;
    };
    reminderHistory: ReminderHistoryEntry[];
    suggestedActions: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ScheduleReminderJobSchema = z.object({
    signingRequestId: z.string(),
    recipientId: z.string(),
    reminderType: z.nativeEnum(ReminderType),
    scheduledAt: z.date(),
    config: ReminderConfigSchema,
    metadata: z.record(z.any()).optional(),
});

export const SendReminderJobSchema = z.object({
    reminderId: z.string(),
    signingRequestId: z.string(),
    recipientId: z.string(),
    reminderType: z.nativeEnum(ReminderType),
    channels: z.array(z.nativeEnum(ReminderChannel)),
    content: z.object({
        subject: z.string(),
        message: z.string(),
        actionUrl: z.string().url(),
        urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']),
        personalization: z.object({
            recipientName: z.string(),
            documentTitle: z.string(),
            senderName: z.string(),
            organizationName: z.string(),
            daysRemaining: z.number().optional(),
            progressPercentage: z.number().min(0).max(100).optional(),
        }),
        branding: z.object({
            logoUrl: z.string().url().optional(),
            primaryColor: z.string().optional(),
            organizationName: z.string().optional(),
        }).optional(),
    }),
    metadata: z.record(z.any()).optional(),
});

export const EscalateReminderJobSchema = z.object({
    signingRequestId: z.string(),
    recipientId: z.string(),
    escalationLevel: z.nativeEnum(EscalationLevel),
    reminderHistory: z.array(z.object({
        id: z.string(),
        type: z.nativeEnum(ReminderType),
        channels: z.array(z.nativeEnum(ReminderChannel)),
        scheduledAt: z.date(),
        sentAt: z.date().optional(),
        deliveryResults: z.array(z.object({
            channel: z.nativeEnum(ReminderChannel),
            status: z.enum(['success', 'failed', 'pending']),
            deliveredAt: z.date().optional(),
            errorMessage: z.string().optional(),
            deliveryId: z.string().optional(),
            metadata: z.record(z.any()).optional(),
        })),
        effectiveness: z.object({
            opened: z.boolean(),
            clicked: z.boolean(),
            responded: z.boolean(),
            responseTime: z.number().optional(),
        }).optional(),
    })),
    metadata: z.record(z.any()).optional(),
});

export const OptimizeReminderJobSchema = z.object({
    organizationId: z.string(),
    analysisType: z.enum(['effectiveness', 'timing', 'channels', 'content']),
    timeRange: z.object({
        start: z.date(),
        end: z.date(),
    }),
    metadata: z.record(z.any()).optional(),
});