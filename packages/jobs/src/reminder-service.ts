import {
    ReminderConfig,
    ReminderType,
    ReminderChannel,
    ScheduleReminderJob,
    SendReminderJob,
    EscalateReminderJob,
    OptimizeReminderJob,
    IntelligentSchedulingContext,
    OptimalReminderSchedule,
    ReminderAnalytics,
    EscalationLevel,
    ReminderContent,
    ReminderDeliveryResult
} from './reminder-types';
import { JobService, JobContext, JobResult } from './types';
import { generateId } from '@signtusk/lib';

/**
 * Automated Reminder Service
 * 
 * Implements intelligent reminder scheduling with:
 * - Multi-channel delivery (email, SMS, push)
 * - Escalation management with management notification
 * - Effectiveness tracking and optimization
 * - Adaptive scheduling based on user behavior
 */
export class AutomatedReminderService {
    constructor(
        private jobService: JobService,
        private databaseService: any, // TODO: Replace with proper database service type
        private emailService: any,    // TODO: Replace with proper email service type
        private smsService?: any,     // TODO: Replace with proper SMS service type
        private pushService?: any,     // TODO: Replace with proper push service type
        private analyticsService?: any // TODO: Replace with proper analytics service type
    ) {
        this.registerReminderJobs();
    }

    /**
     * Register all reminder-related job handlers
     */
    private registerReminderJobs(): void {
        // Schedule reminder job
        this.jobService.defineJob({
            name: 'schedule-reminder',
            handler: this.handleScheduleReminder.bind(this),
            config: {
                maxRetries: 3,
                retryDelay: 5000,
                priority: 7,
            },
        });

        // Send reminder job
        this.jobService.defineJob({
            name: 'send-reminder',
            handler: this.handleSendReminder.bind(this),
            config: {
                maxRetries: 5,
                retryDelay: 10000,
                priority: 8,
            },
        });

        // Escalate reminder job
        this.jobService.defineJob({
            name: 'escalate-reminder',
            handler: this.handleEscalateReminder.bind(this),
            config: {
                maxRetries: 3,
                retryDelay: 15000,
                priority: 9,
            },
        });
    }
    /**
     * Schedule intelligent reminders for a signing request
     */
    async scheduleReminders(
        signingRequestId: string,
        recipientId: string,
        config: ReminderConfig
    ): Promise<string[]> {
        try {
            // Get context for intelligent scheduling
            const context = await this.getSchedulingContext(signingRequestId, recipientId);

            // Generate optimal reminder schedule
            const schedule = await this.generateOptimalSchedule(context, config);

            const jobIds: string[] = [];

            // Schedule each reminder
            for (const reminder of schedule.reminders) {
                const jobId = await this.jobService.scheduleJob(
                    'schedule-reminder',
                    {
                        signingRequestId,
                        recipientId,
                        reminderType: reminder.type,
                        scheduledAt: reminder.scheduledAt,
                        config,
                        metadata: {
                            confidence: reminder.confidence,
                            reasoning: reminder.reasoning,
                            channels: reminder.channels,
                        },
                    } as ScheduleReminderJob,
                    reminder.scheduledAt
                );

                jobIds.push(jobId);
            }

            // Schedule escalation if configured
            if (schedule.escalation && config.escalation.enabled) {
                const escalationJobId = await this.jobService.scheduleJob(
                    'escalate-reminder',
                    {
                        signingRequestId,
                        recipientId,
                        escalationLevel: schedule.escalation.level,
                        reminderHistory: [],
                        metadata: {
                            confidence: schedule.escalation.confidence,
                            reasoning: schedule.escalation.reasoning,
                        },
                    } as EscalateReminderJob,
                    schedule.escalation.scheduledAt
                );

                jobIds.push(escalationJobId);
            }

            return jobIds;
        } catch (error) {
            console.error('Failed to schedule reminders:', error);
            throw error;
        }
    }

    /**
     * Handle schedule reminder job
     */
    private async handleScheduleReminder(
        payload: ScheduleReminderJob,
        context: JobContext
    ): Promise<JobResult> {
        try {
            // Check if signing request is still active
            const signingRequest = await this.databaseService.getSigningRequest(payload.signingRequestId);
            if (!signingRequest || signingRequest.status === 'COMPLETED' || signingRequest.status === 'CANCELLED') {
                return { success: true, data: { skipped: true, reason: 'Signing request no longer active' } };
            }

            // Check if recipient has already signed
            const recipient = await this.databaseService.getRecipient(payload.recipientId);
            if (!recipient || recipient.status === 'SIGNED' || recipient.status === 'COMPLETED') {
                return { success: true, data: { skipped: true, reason: 'Recipient already completed' } };
            }

            // Generate reminder content
            const content = await this.generateReminderContent(
                payload.signingRequestId,
                payload.recipientId,
                payload.reminderType,
                payload.config
            );

            // Determine optimal channels based on current context
            const optimalChannels = await this.determineOptimalChannels(
                payload.recipientId,
                payload.reminderType,
                payload.config
            );

            // Create reminder record
            const reminderId = await this.databaseService.createReminderSchedule({
                signingRequestId: payload.signingRequestId,
                recipientId: payload.recipientId,
                reminderType: payload.reminderType,
                scheduledAt: payload.scheduledAt,
                channels: optimalChannels,
                config: payload.config,
                content,
                metadata: payload.metadata,
            });

            // Schedule immediate send job
            const sendJobId = await this.jobService.enqueue('send-reminder', {
                reminderId,
                signingRequestId: payload.signingRequestId,
                recipientId: payload.recipientId,
                reminderType: payload.reminderType,
                channels: optimalChannels,
                content,
                metadata: payload.metadata,
            } as SendReminderJob);

            return {
                success: true,
                data: {
                    reminderId,
                    sendJobId,
                    channels: optimalChannels,
                    scheduledAt: payload.scheduledAt
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to schedule reminder: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Handle send reminder job - Multi-channel delivery
     */
    private async handleSendReminder(
        payload: SendReminderJob,
        context: JobContext
    ): Promise<JobResult> {
        try {
            const deliveryResults: ReminderDeliveryResult[] = [];

            // Send through each channel
            for (const channel of payload.channels) {
                try {
                    const result = await this.sendReminderThroughChannel(
                        channel,
                        payload.recipientId,
                        payload.content,
                        payload.metadata
                    );

                    deliveryResults.push(result);

                    // Record delivery in database
                    await this.databaseService.createReminderDelivery({
                        reminderScheduleId: payload.reminderId,
                        channel,
                        status: result.status === 'success' ? 'DELIVERED' : 'FAILED',
                        deliveredAt: result.deliveredAt,
                        errorMessage: result.errorMessage,
                        deliveryId: result.deliveryId,
                        trackingData: result.metadata || {},
                    });

                } catch (channelError) {
                    const errorResult: ReminderDeliveryResult = {
                        channel,
                        status: 'failed',
                        errorMessage: channelError instanceof Error ? channelError.message : 'Unknown error',
                    };

                    deliveryResults.push(errorResult);

                    // Record failed delivery
                    await this.databaseService.createReminderDelivery({
                        reminderScheduleId: payload.reminderId,
                        channel,
                        status: 'FAILED',
                        errorMessage: errorResult.errorMessage,
                    });
                }
            }

            // Update reminder status
            const hasSuccessfulDelivery = deliveryResults.some(r => r.status === 'success');
            await this.databaseService.updateReminderSchedule(payload.reminderId, {
                status: hasSuccessfulDelivery ? 'SENT' : 'FAILED',
                sentAt: hasSuccessfulDelivery ? new Date() : undefined,
            });

            // Record analytics event
            await this.recordAnalyticsEvent({
                reminderScheduleId: payload.reminderId,
                eventType: hasSuccessfulDelivery ? 'SENT' : 'FAILED',
                eventData: {
                    channels: payload.channels,
                    deliveryResults,
                    reminderType: payload.reminderType,
                },
            });

            return {
                success: hasSuccessfulDelivery,
                data: {
                    deliveryResults,
                    totalChannels: payload.channels.length,
                    successfulDeliveries: deliveryResults.filter(r => r.status === 'success').length,
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to send reminder: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Handle escalate reminder job - Management notification
     */
    private async handleEscalateReminder(
        payload: EscalateReminderJob,
        context: JobContext
    ): Promise<JobResult> {
        try {
            // Get escalation configuration
            const escalationConfig = await this.getEscalationConfiguration(
                payload.signingRequestId,
                payload.escalationLevel
            );

            // Get management contacts for notification
            const managementContacts = await this.getManagementContacts(
                payload.signingRequestId,
                payload.escalationLevel
            );

            // Create escalation record
            const escalationId = await this.databaseService.createReminderEscalation({
                signingRequestId: payload.signingRequestId,
                recipientId: payload.recipientId,
                escalationLevel: payload.escalationLevel,
                status: 'PROCESSING',
                triggeredAt: new Date(),
                notifiedUsers: managementContacts.map(c => c.id),
                actions: escalationConfig.actions,
                metadata: payload.metadata,
            });

            // Send notifications to management
            const notificationResults = [];
            for (const contact of managementContacts) {
                try {
                    const notificationResult = await this.sendEscalationNotification(
                        contact,
                        payload.signingRequestId,
                        payload.recipientId,
                        payload.escalationLevel,
                        payload.reminderHistory
                    );

                    notificationResults.push({
                        contactId: contact.id,
                        success: true,
                        result: notificationResult,
                    });
                } catch (notificationError) {
                    notificationResults.push({
                        contactId: contact.id,
                        success: false,
                        error: notificationError instanceof Error ? notificationError.message : 'Unknown error',
                    });
                }
            }

            // Execute escalation actions
            const actionResults = [];
            for (const action of escalationConfig.actions) {
                try {
                    const actionResult = await this.executeEscalationAction(
                        action,
                        payload.signingRequestId,
                        payload.recipientId
                    );

                    actionResults.push({
                        action: action.type,
                        success: true,
                        result: actionResult,
                    });
                } catch (actionError) {
                    actionResults.push({
                        action: action.type,
                        success: false,
                        error: actionError instanceof Error ? actionError.message : 'Unknown error',
                    });
                }
            }

            // Update escalation status
            const hasFailures = notificationResults.some(r => !r.success) || actionResults.some(r => !r.success);
            await this.databaseService.updateReminderEscalation(escalationId, {
                status: hasFailures ? 'FAILED' : 'COMPLETED',
                processedAt: new Date(),
            });

            // Record analytics event
            await this.recordAnalyticsEvent({
                eventType: 'ESCALATED',
                eventData: {
                    escalationLevel: payload.escalationLevel,
                    notificationResults,
                    actionResults,
                    signingRequestId: payload.signingRequestId,
                    recipientId: payload.recipientId,
                },
            });

            return {
                success: !hasFailures,
                data: {
                    escalationId,
                    notificationResults,
                    actionResults,
                    managementContactsNotified: managementContacts.length,
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to escalate reminder: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Send reminder through specific channel
     */
    private async sendReminderThroughChannel(
        channel: ReminderChannel,
        recipientId: string,
        content: ReminderContent,
        metadata?: Record<string, any>
    ): Promise<ReminderDeliveryResult> {
        const startTime = Date.now();

        try {
            switch (channel) {
                case ReminderChannel.EMAIL:
                    return await this.sendEmailReminder(recipientId, content, metadata);

                case ReminderChannel.SMS:
                    return await this.sendSMSReminder(recipientId, content, metadata);

                case ReminderChannel.PUSH:
                    return await this.sendPushReminder(recipientId, content, metadata);

                case ReminderChannel.IN_APP:
                    return await this.sendInAppReminder(recipientId, content, metadata);

                default:
                    throw new Error(`Unsupported reminder channel: ${channel}`);
            }
        } catch (error) {
            return {
                channel,
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                metadata: {
                    ...metadata,
                    processingTime: Date.now() - startTime,
                },
            };
        }
    }

    /**
     * Send email reminder
     */
    private async sendEmailReminder(
        recipientId: string,
        content: ReminderContent,
        metadata?: Record<string, any>
    ): Promise<ReminderDeliveryResult> {
        const recipient = await this.databaseService.getRecipient(recipientId);
        if (!recipient) {
            throw new Error('Recipient not found');
        }

        const emailResult = await this.emailService.sendEmail({
            to: recipient.email,
            subject: content.subject,
            templateName: 'signing-reminder',
            templateData: {
                recipientName: content.personalization.recipientName,
                documentTitle: content.personalization.documentTitle,
                senderName: content.personalization.senderName,
                organizationName: content.personalization.organizationName,
                actionUrl: content.actionUrl,
                urgencyLevel: content.urgencyLevel,
                daysRemaining: content.personalization.daysRemaining,
                progressPercentage: content.personalization.progressPercentage,
                message: content.message,
                branding: content.branding,
            },
            trackingEnabled: true,
            priority: content.urgencyLevel === 'critical' ? 'high' : 'normal',
        });

        return {
            channel: ReminderChannel.EMAIL,
            status: emailResult.success ? 'success' : 'failed',
            deliveredAt: emailResult.success ? new Date() : undefined,
            deliveryId: emailResult.messageId,
            errorMessage: emailResult.success ? undefined : emailResult.error,
            metadata: {
                ...metadata,
                trackingId: emailResult.trackingId,
                provider: emailResult.provider,
            },
        };
    }

    /**
     * Send SMS reminder
     */
    private async sendSMSReminder(
        recipientId: string,
        content: ReminderContent,
        metadata?: Record<string, any>
    ): Promise<ReminderDeliveryResult> {
        if (!this.smsService) {
            throw new Error('SMS service not configured');
        }

        const recipient = await this.databaseService.getRecipient(recipientId);
        if (!recipient || !recipient.phoneNumber) {
            throw new Error('Recipient phone number not available');
        }

        // Generate short URL for SMS
        const shortUrl = await this.generateShortUrl(content.actionUrl, recipientId);

        // Create concise SMS message
        const smsMessage = `${content.personalization.organizationName}: Please sign "${content.personalization.documentTitle}". ${shortUrl}`;

        const smsResult = await this.smsService.sendSMS({
            to: recipient.phoneNumber,
            message: smsMessage,
            trackingEnabled: true,
        });

        return {
            channel: ReminderChannel.SMS,
            status: smsResult.success ? 'success' : 'failed',
            deliveredAt: smsResult.success ? new Date() : undefined,
            deliveryId: smsResult.messageId,
            errorMessage: smsResult.success ? undefined : smsResult.error,
            metadata: {
                ...metadata,
                shortUrl,
                messageLength: smsMessage.length,
            },
        };
    }

    /**
     * Send push notification reminder
     */
    private async sendPushReminder(
        recipientId: string,
        content: ReminderContent,
        metadata?: Record<string, any>
    ): Promise<ReminderDeliveryResult> {
        if (!this.pushService) {
            throw new Error('Push notification service not configured');
        }

        const recipient = await this.databaseService.getRecipient(recipientId);
        if (!recipient || !recipient.userId) {
            throw new Error('Recipient user ID not available for push notification');
        }

        const pushResult = await this.pushService.sendPushNotification({
            userId: recipient.userId,
            title: `Document Signature Required`,
            body: `Please sign "${content.personalization.documentTitle}"`,
            data: {
                type: 'signing_reminder',
                signingRequestId: recipient.signingRequestId,
                recipientId: recipientId,
                actionUrl: content.actionUrl,
                urgencyLevel: content.urgencyLevel,
            },
            badge: 1,
            sound: content.urgencyLevel === 'critical' ? 'urgent.wav' : 'default.wav',
        });

        return {
            channel: ReminderChannel.PUSH,
            status: pushResult.success ? 'success' : 'failed',
            deliveredAt: pushResult.success ? new Date() : undefined,
            deliveryId: pushResult.notificationId,
            errorMessage: pushResult.success ? undefined : pushResult.error,
            metadata: {
                ...metadata,
                deviceCount: pushResult.deviceCount,
            },
        };
    }

    /**
     * Send in-app reminder
     */
    private async sendInAppReminder(
        recipientId: string,
        content: ReminderContent,
        metadata?: Record<string, any>
    ): Promise<ReminderDeliveryResult> {
        const recipient = await this.databaseService.getRecipient(recipientId);
        if (!recipient || !recipient.userId) {
            throw new Error('Recipient user ID not available for in-app notification');
        }

        const notificationResult = await this.databaseService.createInAppNotification({
            userId: recipient.userId,
            type: content.urgencyLevel === 'critical' ? 'modal' : 'notification',
            title: 'Document Signature Required',
            message: `Please sign "${content.personalization.documentTitle}"`,
            actionUrl: content.actionUrl,
            priority: content.urgencyLevel === 'critical' ? 'high' : 'medium',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            metadata: {
                signingRequestId: recipient.signingRequestId,
                recipientId: recipientId,
                reminderType: 'signing_reminder',
            },
        });

        return {
            channel: ReminderChannel.IN_APP,
            status: 'success',
            deliveredAt: new Date(),
            deliveryId: notificationResult.id,
            metadata: {
                ...metadata,
                notificationType: notificationResult.type,
            },
        };
    }
    /**
     * Get scheduling context for intelligent reminder planning
     */
    private async getSchedulingContext(
        signingRequestId: string,
        recipientId: string
    ): Promise<IntelligentSchedulingContext> {
        const [signingRequest, recipient, organization] = await Promise.all([
            this.databaseService.getSigningRequest(signingRequestId),
            this.databaseService.getRecipient(recipientId),
            this.databaseService.getOrganization(signingRequestId), // Get org from signing request
        ]);

        const document = await this.databaseService.getDocument(signingRequest.documentId);
        const user = recipient.userId ? await this.databaseService.getUser(recipient.userId) : null;

        // Get recipient's historical response patterns
        const historicalPatterns = await this.databaseService.getRecipientHistoricalPatterns(recipientId);

        // Calculate document complexity and urgency
        const complexity = this.calculateDocumentComplexity(document);
        const urgency = this.calculateDocumentUrgency(signingRequest, document);

        return {
            recipient: {
                id: recipientId,
                email: recipient.email,
                timezone: user?.timezone || organization.timezone,
                preferredContactHours: user?.preferredContactHours,
                historicalResponsePatterns: historicalPatterns,
            },
            document: {
                id: document.id,
                title: document.name,
                urgency,
                complexity,
                estimatedSigningTime: this.estimateSigningTime(document),
            },
            organization: {
                id: organization.id,
                timezone: organization.timezone || 'UTC',
                businessHours: organization.businessHours || { start: 9, end: 17 },
                workDays: organization.workDays || [1, 2, 3, 4, 5], // Monday-Friday
            },
            context: {
                currentReminders: await this.databaseService.countActiveReminders(recipientId),
                daysUntilExpiration: signingRequest.expiresAt
                    ? Math.ceil((new Date(signingRequest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : undefined,
                isUrgent: urgency === 'high' || urgency === 'critical',
                hasEscalated: await this.databaseService.hasEscalated(signingRequestId, recipientId),
            },
        };
    }

    /**
     * Generate optimal reminder schedule using intelligent scheduler
     */
    private async generateOptimalSchedule(
        context: IntelligentSchedulingContext,
        config: ReminderConfig
    ): Promise<OptimalReminderSchedule> {
        const { IntelligentReminderScheduler } = await import('./intelligent-scheduler');
        const scheduler = new IntelligentReminderScheduler(this.databaseService, this.analyticsService);
        return await scheduler.generateOptimalSchedule(context, config);
    }

    /**
     * Generate reminder content based on context and personalization
     */
    private async generateReminderContent(
        signingRequestId: string,
        recipientId: string,
        reminderType: ReminderType,
        config: ReminderConfig
    ): Promise<ReminderContent> {
        const [signingRequest, recipient, document, sender] = await Promise.all([
            this.databaseService.getSigningRequest(signingRequestId),
            this.databaseService.getRecipient(recipientId),
            this.databaseService.getDocument(signingRequestId),
            this.databaseService.getUser(signingRequestId), // Get sender from signing request
        ]);

        const organization = await this.databaseService.getOrganization(signingRequest.organizationId);

        // Get template for this reminder type
        const template = await this.databaseService.getReminderTemplate(
            organization.id,
            reminderType,
            ReminderChannel.EMAIL // Default to email template
        );

        // Calculate urgency level
        const urgencyLevel = this.calculateUrgencyLevel(reminderType, signingRequest);

        // Calculate progress percentage
        const progressPercentage = await this.calculateProgressPercentage(signingRequestId);

        // Calculate days remaining
        const daysRemaining = signingRequest.expiresAt
            ? Math.ceil((new Date(signingRequest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : undefined;

        // Generate action URL with tracking
        const actionUrl = await this.generateActionUrl(signingRequestId, recipientId);

        // Generate personalized subject and message
        const subject = this.personalizeContent(
            template?.subject || this.getDefaultSubject(reminderType),
            {
                recipientName: recipient.name,
                documentTitle: document.name,
                senderName: sender.name,
                organizationName: organization.name,
                urgencyLevel,
                daysRemaining,
            }
        );

        const message = this.personalizeContent(
            template?.content || this.getDefaultMessage(reminderType),
            {
                recipientName: recipient.name,
                documentTitle: document.name,
                senderName: sender.name,
                organizationName: organization.name,
                urgencyLevel,
                daysRemaining,
                progressPercentage,
            }
        );

        return {
            subject,
            message,
            actionUrl,
            urgencyLevel,
            personalization: {
                recipientName: recipient.name,
                documentTitle: document.name,
                senderName: sender.name,
                organizationName: organization.name,
                daysRemaining,
                progressPercentage,
            },
            branding: organization.branding ? {
                logoUrl: organization.branding.logoUrl,
                primaryColor: organization.branding.primaryColor,
                organizationName: organization.name,
            } : undefined,
        };
    }

    /**
     * Determine optimal channels based on recipient preferences and effectiveness
     */
    private async determineOptimalChannels(
        recipientId: string,
        reminderType: ReminderType,
        config: ReminderConfig
    ): Promise<ReminderChannel[]> {
        // Get recipient preferences
        const recipient = await this.databaseService.getRecipient(recipientId);
        const user = recipient.userId ? await this.databaseService.getUser(recipient.userId) : null;
        const preferences = user ? await this.databaseService.getReminderPreferences(user.id) : null;

        // Get historical effectiveness for this recipient
        const effectiveness = await this.databaseService.getRecipientChannelEffectiveness(recipientId);

        // Start with configured channels
        let channels = [...config.channels];

        // Apply user preferences if available
        if (preferences?.preferredChannels?.length > 0) {
            channels = preferences.preferredChannels.filter((channel: ReminderChannel) =>
                config.channels.includes(channel)
            );
        }

        // Optimize based on effectiveness data
        if (effectiveness && Object.keys(effectiveness).length > 0) {
            channels.sort((a, b) => (effectiveness[b] || 0) - (effectiveness[a] || 0));
        }

        // Ensure we have at least one channel
        if (channels.length === 0) {
            channels = [ReminderChannel.EMAIL];
        }

        // Add additional channels for urgent reminders
        if (reminderType === ReminderType.URGENT || reminderType === ReminderType.FINAL) {
            const additionalChannels = config.channels.filter(channel => !channels.includes(channel));
            if (additionalChannels.length > 0) {
                channels.push(additionalChannels[0]); // Add one more channel
            }
        }

        return channels;
    }

    /**
     * Get escalation configuration for the organization
     */
    private async getEscalationConfiguration(
        signingRequestId: string,
        escalationLevel: EscalationLevel
    ): Promise<any> {
        const signingRequest = await this.databaseService.getSigningRequest(signingRequestId);
        const organization = await this.databaseService.getOrganization(signingRequest.organizationId);

        // Get organization's escalation rules
        const escalationRules = await this.databaseService.getEscalationRules(organization.id);

        // Find matching rule or use default
        const rule = escalationRules.find((r: any) =>
            r.conditions.escalationLevel === escalationLevel
        ) || this.getDefaultEscalationRule(escalationLevel);

        return rule;
    }

    /**
     * Get management contacts for escalation notifications
     */
    private async getManagementContacts(
        signingRequestId: string,
        escalationLevel: EscalationLevel
    ): Promise<any[]> {
        const signingRequest = await this.databaseService.getSigningRequest(signingRequestId);
        const organization = await this.databaseService.getOrganization(signingRequest.organizationId);

        // Get users with appropriate roles for this escalation level
        const roleMap = {
            [EscalationLevel.NONE]: [],
            [EscalationLevel.SUPERVISOR]: ['supervisor', 'team_lead'],
            [EscalationLevel.MANAGER]: ['manager', 'director'],
            [EscalationLevel.ADMIN]: ['admin', 'owner'],
        };

        const roles = roleMap[escalationLevel] || ['admin'];
        const contacts = await this.databaseService.getUsersByRoles(organization.id, roles);

        return contacts;
    }

    /**
     * Send escalation notification to management
     */
    private async sendEscalationNotification(
        contact: any,
        signingRequestId: string,
        recipientId: string,
        escalationLevel: EscalationLevel,
        reminderHistory: any[]
    ): Promise<any> {
        const [signingRequest, recipient, document] = await Promise.all([
            this.databaseService.getSigningRequest(signingRequestId),
            this.databaseService.getRecipient(recipientId),
            this.databaseService.getDocument(signingRequestId),
        ]);

        const escalationNotification = {
            recipientId: contact.id,
            escalationLevel,
            signingRequestId,
            documentTitle: document.name,
            originalRecipient: {
                name: recipient.name,
                email: recipient.email,
            },
            reminderHistory,
            suggestedActions: this.generateSuggestedActions(escalationLevel, reminderHistory),
        };

        return await this.emailService.sendEmail({
            to: contact.email,
            subject: `Escalation Required: Document Signing Delayed - ${document.name}`,
            templateName: 'escalation-notification',
            templateData: escalationNotification,
            priority: 'high',
        });
    }

    /**
     * Execute escalation action
     */
    private async executeEscalationAction(
        action: any,
        signingRequestId: string,
        recipientId: string
    ): Promise<any> {
        switch (action.type) {
            case 'notify_supervisor':
                return await this.notifySupervisor(signingRequestId, recipientId, action.parameters);

            case 'change_channel':
                return await this.changeReminderChannel(signingRequestId, recipientId, action.parameters);

            case 'increase_frequency':
                return await this.increaseReminderFrequency(signingRequestId, recipientId, action.parameters);

            default:
                throw new Error(`Unknown escalation action: ${action.type}`);
        }
    }

    /**
     * Helper methods for content generation and personalization
     */
    private calculateDocumentComplexity(document: any): 'simple' | 'medium' | 'complex' {
        const fieldCount = document.fields?.length || 0;
        const pageCount = document.pageCount || 1;

        if (fieldCount <= 3 && pageCount <= 2) return 'simple';
        if (fieldCount <= 10 && pageCount <= 5) return 'medium';
        return 'complex';
    }

    private calculateDocumentUrgency(signingRequest: any, document: any): 'low' | 'medium' | 'high' | 'critical' {
        const daysUntilExpiration = signingRequest.expiresAt
            ? Math.ceil((new Date(signingRequest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

        if (daysUntilExpiration !== null) {
            if (daysUntilExpiration <= 1) return 'critical';
            if (daysUntilExpiration <= 3) return 'high';
            if (daysUntilExpiration <= 7) return 'medium';
        }

        // Check for urgency indicators in document metadata
        const urgencyKeywords = ['urgent', 'asap', 'immediate', 'critical'];
        const hasUrgencyKeywords = urgencyKeywords.some(keyword =>
            document.name.toLowerCase().includes(keyword) ||
            (signingRequest.message && signingRequest.message.toLowerCase().includes(keyword))
        );

        return hasUrgencyKeywords ? 'high' : 'low';
    }

    private estimateSigningTime(document: any): number {
        const fieldCount = document.fields?.length || 0;
        const pageCount = document.pageCount || 1;

        // Base time: 2 minutes per page + 1 minute per field
        return Math.max(5, (pageCount * 2) + (fieldCount * 1));
    }

    private calculateUrgencyLevel(
        reminderType: ReminderType,
        signingRequest: any
    ): 'low' | 'medium' | 'high' | 'critical' {
        const baseUrgency = this.calculateDocumentUrgency(signingRequest, {});

        // Escalate urgency based on reminder type
        const urgencyMap = {
            [ReminderType.INITIAL]: baseUrgency,
            [ReminderType.FOLLOW_UP]: baseUrgency === 'low' ? 'medium' : baseUrgency,
            [ReminderType.URGENT]: baseUrgency === 'low' ? 'high' : baseUrgency,
            [ReminderType.FINAL]: baseUrgency === 'low' ? 'high' : 'critical',
            [ReminderType.ESCALATION]: 'critical',
        };

        return (urgencyMap[reminderType] || baseUrgency) as 'low' | 'medium' | 'high' | 'critical';
    }

    private async calculateProgressPercentage(signingRequestId: string): Promise<number> {
        const recipients = await this.databaseService.getRecipients(signingRequestId);
        const signedCount = recipients.filter((r: any) => r.status === 'SIGNED').length;

        return recipients.length > 0 ? Math.round((signedCount / recipients.length) * 100) : 0;
    }

    private async generateActionUrl(signingRequestId: string, recipientId: string): Promise<string> {
        const recipient = await this.databaseService.getRecipient(recipientId);
        const baseUrl = process.env.APP_URL || 'https://app.docusign-alternative.com';

        // Generate tracking parameters
        const trackingId = generateId();
        await this.databaseService.createUrlTracking({
            recipientId,
            signingRequestId,
            trackingId,
            createdAt: new Date(),
        });

        return `${baseUrl}/sign/${recipient.accessToken}?tracking=${trackingId}`;
    }

    private personalizeContent(template: string, variables: Record<string, any>): string {
        let content = template;

        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
        });

        return content;
    }

    private getDefaultSubject(reminderType: ReminderType): string {
        const subjects = {
            [ReminderType.INITIAL]: 'Please sign: {{documentTitle}}',
            [ReminderType.FOLLOW_UP]: 'Reminder: Please sign {{documentTitle}}',
            [ReminderType.URGENT]: 'Urgent: Please sign {{documentTitle}}',
            [ReminderType.FINAL]: 'Final Notice: Please sign {{documentTitle}}',
            [ReminderType.ESCALATION]: 'Critical: Immediate action required for {{documentTitle}}',
        };

        return subjects[reminderType] || subjects[ReminderType.INITIAL];
    }

    private getDefaultMessage(reminderType: ReminderType): string {
        const messages = {
            [ReminderType.INITIAL]: 'Hi {{recipientName}}, {{senderName}} has sent you "{{documentTitle}}" to sign. Please review and sign the document at your earliest convenience.',
            [ReminderType.FOLLOW_UP]: 'Hi {{recipientName}}, this is a friendly reminder that "{{documentTitle}}" is still waiting for your signature. Please take a moment to review and sign.',
            [ReminderType.URGENT]: 'Hi {{recipientName}}, "{{documentTitle}}" requires your urgent attention. {{daysRemaining}} days remaining until expiration.',
            [ReminderType.FINAL]: 'Hi {{recipientName}}, this is the final reminder for "{{documentTitle}}". Please sign immediately to avoid delays.',
            [ReminderType.ESCALATION]: 'Hi {{recipientName}}, "{{documentTitle}}" is overdue and has been escalated. Immediate action is required.',
        };

        return messages[reminderType] || messages[ReminderType.INITIAL];
    }

    private getDefaultEscalationRule(escalationLevel: EscalationLevel): any {
        return {
            actions: [
                {
                    type: 'notify_supervisor',
                    parameters: { immediate: true },
                },
                {
                    type: 'increase_frequency',
                    parameters: { multiplier: 2 },
                },
            ],
        };
    }

    private generateSuggestedActions(escalationLevel: EscalationLevel, reminderHistory: any[]): string[] {
        const actions = [
            'Contact the recipient directly via phone',
            'Send a personalized message explaining the urgency',
            'Consider extending the deadline if appropriate',
        ];

        if (escalationLevel === EscalationLevel.ADMIN) {
            actions.push('Review and potentially reassign the document');
            actions.push('Consider alternative signing methods');
        }

        return actions;
    }

    private async generateShortUrl(longUrl: string, recipientId: string): Promise<string> {
        // In production, integrate with a URL shortening service
        const shortId = generateId().substring(0, 8);

        await this.databaseService.createShortUrl({
            shortId,
            longUrl,
            recipientId,
            createdAt: new Date(),
        });

        const baseUrl = process.env.SHORT_URL_BASE || 'https://dsalt.co';
        return `${baseUrl}/${shortId}`;
    }

    // Placeholder methods for escalation actions
    private async notifySupervisor(signingRequestId: string, recipientId: string, parameters: any): Promise<any> {
        // Implementation for supervisor notification
        return { action: 'supervisor_notified', parameters };
    }

    private async changeReminderChannel(signingRequestId: string, recipientId: string, parameters: any): Promise<any> {
        // Implementation for changing reminder channel
        return { action: 'channel_changed', parameters };
    }

    private async increaseReminderFrequency(signingRequestId: string, recipientId: string, parameters: any): Promise<any> {
        // Implementation for increasing reminder frequency
        return { action: 'frequency_increased', parameters };
    }

    /**
     * Record analytics event
     */
    private async recordAnalyticsEvent(eventData: {
        reminderScheduleId?: string;
        eventType: string;
        eventData: any;
    }): Promise<void> {
        if (this.analyticsService) {
            await this.analyticsService.recordEvent(eventData);
        } else {
            // Fallback to database logging if analytics service is not available
            await this.databaseService.createReminderAnalyticsEvent({
                reminderScheduleId: eventData.reminderScheduleId,
                eventType: eventData.eventType,
                eventData: eventData.eventData,
                timestamp: new Date(),
            });
        }
    }
}