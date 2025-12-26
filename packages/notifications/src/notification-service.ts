import {
    NotificationService,
    NotificationConfig,
    NotificationSchedule,
    NotificationDeliveryResult,
    NotificationStatus,
    NotificationChannel,
    NotificationError
} from './types';
import { SMSServiceImpl } from './sms/sms-service';
import { PushNotificationServiceImpl } from './push/push-service';
import { EmailTemplateServiceImpl } from './templates/email-template-service';
import { NotificationSchedulerImpl } from './scheduler/notification-scheduler';
import { AnalyticsServiceImpl } from './analytics/analytics-service';
import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main Notification Service Implementation
 * Orchestrates all notification channels and provides unified interface
 */
export class NotificationServiceImpl implements NotificationService {
    private smsService?: SMSServiceImpl;
    private pushService?: PushNotificationServiceImpl;
    private emailTemplateService: EmailTemplateServiceImpl;
    private scheduler: NotificationSchedulerImpl;
    private analytics: AnalyticsServiceImpl;
    private logger: Logger;
    private pendingNotifications: Map<string, NotificationConfig> = new Map();

    constructor(
        services: {
            smsService?: SMSServiceImpl;
            pushService?: PushNotificationServiceImpl;
            emailService?: any; // Would integrate with existing email service
        },
        logger: Logger
    ) {
        this.logger = logger.child({ service: 'notifications' });

        // Initialize services
        this.smsService = services.smsService;
        this.pushService = services.pushService;
        this.emailTemplateService = new EmailTemplateServiceImpl(logger);
        this.analytics = new AnalyticsServiceImpl(logger);
        this.scheduler = new NotificationSchedulerImpl(this, logger);

        this.logger.info('Notification service initialized');
    }

    async send(config: NotificationConfig): Promise<NotificationDeliveryResult> {
        try {
            // Validate configuration
            this.validateConfig(config);

            this.logger.info({
                notificationId: config.id,
                channel: config.channel,
                userId: config.userId,
                templateId: config.templateId
            }, 'Sending notification');

            // Track sent event
            await this.analytics.trackEvent({
                id: uuidv4(),
                organizationId: config.organizationId,
                userId: config.userId,
                channel: config.channel,
                templateId: config.templateId,
                eventType: 'sent',
                timestamp: new Date(),
                metadata: config.metadata
            });

            let result: NotificationDeliveryResult;

            // Route to appropriate service based on channel
            switch (config.channel) {
                case NotificationChannel.SMS:
                    result = await this.sendSMS(config);
                    break;
                case NotificationChannel.PUSH:
                    result = await this.sendPush(config);
                    break;
                case NotificationChannel.EMAIL:
                    result = await this.sendEmail(config);
                    break;
                case NotificationChannel.IN_APP:
                    result = await this.sendInApp(config);
                    break;
                case NotificationChannel.WEBHOOK:
                    result = await this.sendWebhook(config);
                    break;
                default:
                    throw new NotificationError(`Unsupported notification channel: ${config.channel}`, 'UNSUPPORTED_CHANNEL');
            }

            // Track delivery event if successful
            if (result.status === NotificationStatus.SENT || result.status === NotificationStatus.DELIVERED) {
                await this.analytics.trackEvent({
                    id: uuidv4(),
                    organizationId: config.organizationId,
                    userId: config.userId,
                    channel: config.channel,
                    templateId: config.templateId,
                    eventType: 'delivered',
                    timestamp: new Date(),
                    metadata: { ...config.metadata, deliveryId: result.id }
                });
            }

            this.logger.info({
                notificationId: config.id,
                deliveryId: result.id,
                status: result.status
            }, 'Notification sent successfully');

            return result;

        } catch (error) {
            this.logger.error({ error, notificationId: config.id }, 'Failed to send notification');

            // Track failure event
            try {
                await this.analytics.trackEvent({
                    id: uuidv4(),
                    organizationId: config.organizationId,
                    userId: config.userId,
                    channel: config.channel,
                    templateId: config.templateId,
                    eventType: 'bounced',
                    timestamp: new Date(),
                    metadata: {
                        ...config.metadata,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            } catch (analyticsError) {
                this.logger.error({ error: analyticsError }, 'Failed to track failure event');
            }

            throw new NotificationError(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SEND_FAILED');
        }
    }

    async schedule(schedule: NotificationSchedule): Promise<string> {
        try {
            return await this.scheduler.schedule(schedule);
        } catch (error) {
            this.logger.error({ error, scheduleName: schedule.name }, 'Failed to schedule notification');
            throw new NotificationError(`Failed to schedule notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SCHEDULE_FAILED');
        }
    }

    async cancel(notificationId: string): Promise<boolean> {
        try {
            // Check if notification is pending
            const pendingNotification = this.pendingNotifications.get(notificationId);
            if (pendingNotification) {
                this.pendingNotifications.delete(notificationId);

                this.logger.info({ notificationId }, 'Pending notification cancelled');
                return true;
            }

            // For scheduled notifications, delegate to scheduler
            // This is a simplified implementation - in production, you'd need to track
            // which notifications are scheduled vs immediate
            this.logger.info({ notificationId }, 'Notification cancellation requested');
            return false;

        } catch (error) {
            this.logger.error({ error, notificationId }, 'Failed to cancel notification');
            throw new NotificationError(`Failed to cancel notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'CANCEL_FAILED');
        }
    }

    async getStatus(notificationId: string): Promise<NotificationStatus> {
        try {
            // Check pending notifications
            if (this.pendingNotifications.has(notificationId)) {
                return NotificationStatus.PENDING;
            }

            // In production, this would query the database or cache for notification status
            this.logger.debug({ notificationId }, 'Getting notification status');
            return NotificationStatus.SENT; // Stub implementation

        } catch (error) {
            this.logger.error({ error, notificationId }, 'Failed to get notification status');
            throw new NotificationError(`Failed to get notification status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STATUS_FAILED');
        }
    }

    async retry(notificationId: string): Promise<NotificationDeliveryResult> {
        try {
            // In production, this would retrieve the original notification config and retry
            this.logger.info({ notificationId }, 'Retrying notification');

            throw new NotificationError('Retry functionality not implemented in stub', 'NOT_IMPLEMENTED');

        } catch (error) {
            this.logger.error({ error, notificationId }, 'Failed to retry notification');
            throw new NotificationError(`Failed to retry notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RETRY_FAILED');
        }
    }

    private async sendSMS(config: NotificationConfig): Promise<NotificationDeliveryResult> {
        if (!this.smsService) {
            throw new NotificationError('SMS service not configured', 'SERVICE_NOT_CONFIGURED');
        }

        if (!config.recipient.phone) {
            throw new NotificationError('Phone number is required for SMS notifications', 'MISSING_RECIPIENT');
        }

        // Render template if provided
        let message = config.templateData.message || 'Default SMS message';
        if (config.templateId) {
            // In production, render SMS template here
            message = `SMS: ${config.templateData.message || 'Notification'}`;
        }

        return await this.smsService.sendSMS(
            config.recipient.phone,
            message,
            config.templateData.from
        );
    }

    private async sendPush(config: NotificationConfig): Promise<NotificationDeliveryResult> {
        if (!this.pushService) {
            throw new NotificationError('Push service not configured', 'SERVICE_NOT_CONFIGURED');
        }

        if (!config.recipient.pushToken) {
            throw new NotificationError('Push token is required for push notifications', 'MISSING_RECIPIENT');
        }

        // Create push payload
        const payload = {
            title: config.templateData.title || 'Notification',
            body: config.templateData.body || 'You have a new notification',
            icon: config.templateData.icon,
            badge: config.templateData.badge,
            sound: config.templateData.sound,
            data: config.templateData.data || {},
            actions: config.templateData.actions,
            tag: config.templateData.tag,
            requireInteraction: config.templateData.requireInteraction,
            silent: config.templateData.silent,
            timestamp: Date.now(),
            vibrate: config.templateData.vibrate,
            image: config.templateData.image
        };

        return await this.pushService.sendPush(config.recipient.pushToken, payload);
    }

    private async sendEmail(config: NotificationConfig): Promise<NotificationDeliveryResult> {
        if (!config.recipient.email) {
            throw new NotificationError('Email address is required for email notifications', 'MISSING_RECIPIENT');
        }

        // Render email template
        let emailContent: {
            html: string;
            text?: string;
            subject: string;
        } = {
            html: config.templateData.html || '<p>Default email content</p>',
            text: config.templateData.text,
            subject: config.templateData.subject || 'Notification'
        };

        if (config.templateId) {
            emailContent = await this.emailTemplateService.renderTemplate(config.templateId, config.templateData);
        }

        // In production, integrate with existing email service
        const result: NotificationDeliveryResult = {
            id: uuidv4(),
            notificationId: config.id,
            channel: NotificationChannel.EMAIL,
            status: NotificationStatus.SENT,
            providerId: 'email-service',
            retryCount: 0,
            metadata: {
                to: config.recipient.email,
                subject: emailContent.subject,
                htmlLength: emailContent.html.length,
                sentAt: new Date()
            }
        };

        return result;
    }

    private async sendInApp(config: NotificationConfig): Promise<NotificationDeliveryResult> {
        // In-app notification implementation
        const result: NotificationDeliveryResult = {
            id: uuidv4(),
            notificationId: config.id,
            channel: NotificationChannel.IN_APP,
            status: NotificationStatus.SENT,
            providerId: 'in-app-service',
            retryCount: 0,
            metadata: {
                userId: config.recipient.userId,
                title: config.templateData.title,
                message: config.templateData.message,
                sentAt: new Date()
            }
        };

        return result;
    }

    private async sendWebhook(config: NotificationConfig): Promise<NotificationDeliveryResult> {
        // Webhook notification implementation
        const result: NotificationDeliveryResult = {
            id: uuidv4(),
            notificationId: config.id,
            channel: NotificationChannel.WEBHOOK,
            status: NotificationStatus.SENT,
            providerId: 'webhook-service',
            retryCount: 0,
            metadata: {
                url: config.templateData.webhookUrl,
                payload: config.templateData,
                sentAt: new Date()
            }
        };

        return result;
    }

    private validateConfig(config: NotificationConfig): void {
        if (!config.id) {
            throw new NotificationError('Notification ID is required', 'VALIDATION_ERROR');
        }

        if (!config.userId) {
            throw new NotificationError('User ID is required', 'VALIDATION_ERROR');
        }

        if (!Object.values(NotificationChannel).includes(config.channel)) {
            throw new NotificationError(`Invalid notification channel: ${config.channel}`, 'VALIDATION_ERROR');
        }

        if (!config.recipient) {
            throw new NotificationError('Recipient information is required', 'VALIDATION_ERROR');
        }

        // Channel-specific validation
        switch (config.channel) {
            case NotificationChannel.SMS:
                if (!config.recipient.phone) {
                    throw new NotificationError('Phone number is required for SMS notifications', 'VALIDATION_ERROR');
                }
                break;
            case NotificationChannel.PUSH:
                if (!config.recipient.pushToken) {
                    throw new NotificationError('Push token is required for push notifications', 'VALIDATION_ERROR');
                }
                break;
            case NotificationChannel.EMAIL:
                if (!config.recipient.email) {
                    throw new NotificationError('Email address is required for email notifications', 'VALIDATION_ERROR');
                }
                break;
            case NotificationChannel.IN_APP:
                if (!config.recipient.userId) {
                    throw new NotificationError('User ID is required for in-app notifications', 'VALIDATION_ERROR');
                }
                break;
        }
    }

    /**
     * Get service health status
     */
    async getHealthStatus(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }> {
        const services: Record<string, boolean> = {};
        let healthyCount = 0;
        let totalCount = 0;

        // Check SMS service
        if (this.smsService) {
            try {
                const smsHealth = await this.smsService.getProviderHealth();
                const smsHealthy = Object.values(smsHealth).some(h => h);
                services.sms = smsHealthy;
                if (smsHealthy) healthyCount++;
                totalCount++;
            } catch (error) {
                services.sms = false;
                totalCount++;
            }
        }

        // Check push service
        if (this.pushService) {
            try {
                const pushHealth = await this.pushService.getProviderHealth();
                const pushHealthy = Object.values(pushHealth).some(h => h);
                services.push = pushHealthy;
                if (pushHealthy) healthyCount++;
                totalCount++;
            } catch (error) {
                services.push = false;
                totalCount++;
            }
        }

        // Email template service is always healthy (in-memory)
        services.emailTemplates = true;
        healthyCount++;
        totalCount++;

        // Scheduler is always healthy (in-memory)
        services.scheduler = true;
        healthyCount++;
        totalCount++;

        // Analytics is always healthy (in-memory)
        services.analytics = true;
        healthyCount++;
        totalCount++;

        let overall: 'healthy' | 'degraded' | 'unhealthy';
        if (healthyCount === totalCount) {
            overall = 'healthy';
        } else if (healthyCount > totalCount / 2) {
            overall = 'degraded';
        } else {
            overall = 'unhealthy';
        }

        return {
            overall,
            services,
            lastCheck: new Date()
        };
    }

    /**
     * Get service statistics
     */
    getServiceStats(): {
        sms?: any;
        push?: any;
        scheduler: any;
        analytics: any;
    } {
        const stats: any = {};

        if (this.smsService) {
            stats.sms = this.smsService.getProviderStats();
        }

        if (this.pushService) {
            stats.push = this.pushService.getProviderStats();
        }

        stats.scheduler = this.scheduler.getSchedulerStats();

        // Analytics stats would be more complex in production
        stats.analytics = {
            totalEvents: 0, // Would come from analytics service
            lastEvent: null
        };

        return stats;
    }

    /**
     * Bulk send notifications
     */
    async bulkSend(configs: NotificationConfig[]): Promise<NotificationDeliveryResult[]> {
        const results: NotificationDeliveryResult[] = [];

        this.logger.info({ count: configs.length }, 'Starting bulk notification send');

        // Process in batches to avoid overwhelming services
        const batchSize = 100;
        for (let i = 0; i < configs.length; i += batchSize) {
            const batch = configs.slice(i, i + batchSize);

            const batchPromises = batch.map(async (config) => {
                try {
                    return await this.send(config);
                } catch (error) {
                    return {
                        id: uuidv4(),
                        notificationId: config.id,
                        channel: config.channel,
                        status: NotificationStatus.FAILED,
                        failureReason: error instanceof Error ? error.message : 'Unknown error',
                        retryCount: 0,
                        metadata: {
                            userId: config.userId,
                            failedAt: new Date()
                        }
                    } as NotificationDeliveryResult;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Add delay between batches
            if (i + batchSize < configs.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const successCount = results.filter(r => r.status === NotificationStatus.SENT || r.status === NotificationStatus.DELIVERED).length;
        const failureCount = results.length - successCount;

        this.logger.info({
            total: results.length,
            success: successCount,
            failed: failureCount
        }, 'Bulk notification send completed');

        return results;
    }

    // Expose sub-services for direct access if needed
    get sms() { return this.smsService; }
    get push() { return this.pushService; }
    get templates() { return this.emailTemplateService; }
    get schedulerService() { return this.scheduler; }
    get analyticsService() { return this.analytics; }
}