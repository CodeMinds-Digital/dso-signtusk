import { randomBytes } from 'node:crypto';

// Main service exports
export { NotificationServiceImpl } from './notification-service';
export { SMSServiceImpl } from './sms/sms-service';
export { PushNotificationServiceImpl } from './push/push-service';
export { EmailTemplateServiceImpl } from './templates/email-template-service';
export { NotificationSchedulerImpl } from './scheduler/notification-scheduler';
export { AnalyticsServiceImpl } from './analytics/analytics-service';

// Import for internal use
import { NotificationServiceImpl } from './notification-service';
import { SMSServiceImpl } from './sms/sms-service';
import { PushNotificationServiceImpl } from './push/push-service';

// SMS Provider exports
export { TwilioSMSProvider } from './sms/providers/twilio';
export { AWSSNSProvider } from './sms/providers/aws-sns';
export { VonageSMSProvider } from './sms/providers/vonage';

// Push Provider exports
export { FirebasePushProvider } from './push/providers/firebase';
export { WebPushProvider } from './push/providers/web-push';
export { APNSProvider } from './push/providers/apns';

// Template Renderer exports
export { HandlebarsRenderer } from './templates/renderers/handlebars';
export { ReactEmailRenderer } from './templates/renderers/react-email';
export { MustacheRenderer } from './templates/renderers/mustache';

// Type exports
export type {
    // Core types
    NotificationConfig,
    NotificationSchedule,
    NotificationDeliveryResult,
    CommunicationAnalytics,
    EngagementMetrics,
    TemplatePerformanceMetrics,
    AnalyticsFilters,
    AnalyticsReport,

    // Configuration types
    SMSConfig,
    PushConfig,
    EmailTemplateCustomization,
    NotificationPreferences,

    // Service interfaces
    NotificationService,
    SMSService,
    PushNotificationService,
    EmailTemplateService,
    NotificationScheduler,
    AnalyticsService,
    NotificationPreferencesService,
    TemplateBuilderService,

    // Template types
    TemplateComponent,
    TemplateLayout,
    PushPayload,

    // Enum types
    NotificationChannel,
    NotificationPriority,
    NotificationStatus,
    SMSProvider,
    PushProvider,
    TemplateEngine
} from './types';

// Schema exports for validation
export {
    NotificationConfigSchema,
    SMSConfigSchema,
    PushConfigSchema,
    EmailTemplateCustomizationSchema,
    NotificationScheduleSchema,
    NotificationDeliveryResultSchema,
    CommunicationAnalyticsSchema,
    NotificationPreferencesSchema
} from './types';

// Error exports
export {
    NotificationError,
    SMSError,
    PushNotificationError,
    TemplateError,
    SchedulingError
} from './types';

// Factory function for creating notification service
export function createNotificationService(config: {
    smsConfigs?: Array<{ provider: any; config: any }>;
    pushConfigs?: Array<{ provider: any; config: any }>;
    emailService?: any;
    logger: any;
}): NotificationServiceImpl {
    const services: any = {};

    // Initialize SMS service if configured
    if (config.smsConfigs && config.smsConfigs.length > 0) {
        services.smsService = new SMSServiceImpl(config.smsConfigs, config.logger);
    }

    // Initialize push service if configured
    if (config.pushConfigs && config.pushConfigs.length > 0) {
        services.pushService = new PushNotificationServiceImpl(config.pushConfigs, config.logger);
    }

    // Add email service if provided
    if (config.emailService) {
        services.emailService = config.emailService;
    }

    return new NotificationServiceImpl(services, config.logger);
}

// Utility functions
export function validatePhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function formatPhoneNumber(phoneNumber: string, format: 'e164' | 'national' | 'international' = 'e164'): string {
    // Simplified phone number formatting - in production, use a proper library like libphonenumber
    if (format === 'e164') {
        return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    }
    return phoneNumber;
}

export function generateUnsubscribeToken(): string {
    return randomBytes(32).toString('hex');
}

export function maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) return data;
    return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

// Template helpers
export const templateHelpers = {
    formatDate: (date: Date, format?: string) => {
        if (!date) return '';
        return date.toLocaleDateString();
    },

    formatCurrency: (amount: number, currency: string = 'USD') => {
        if (typeof amount !== 'number') return '';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    truncate: (str: string, length: number = 100) => {
        if (!str || typeof str !== 'string') return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    },

    capitalize: (str: string) => {
        if (!str || typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
};

// Constants
export const NOTIFICATION_LIMITS = {
    SMS_MAX_LENGTH: 1600,
    PUSH_TITLE_MAX_LENGTH: 100,
    PUSH_BODY_MAX_LENGTH: 500,
    PUSH_PAYLOAD_MAX_SIZE: 4096,
    EMAIL_SUBJECT_MAX_LENGTH: 200,
    TEMPLATE_NAME_MAX_LENGTH: 100,
    BATCH_SIZE_DEFAULT: 100,
    RETRY_MAX_ATTEMPTS: 3,
    RATE_LIMIT_DEFAULT: 1000 // per minute
};

export const DEFAULT_STYLES = {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    backgroundColor: '#ffffff'
};

// Version info
export const VERSION = '1.0.0';