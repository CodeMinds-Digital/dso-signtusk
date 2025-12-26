import {
    SMSService,
    SMSConfig,
    SMSProvider,
    NotificationDeliveryResult,
    NotificationStatus,
    NotificationChannel,
    SMSError
} from '../types';
import { TwilioSMSProvider } from './providers/twilio';
import { AWSSNSProvider } from './providers/aws-sns';
import { VonageSMSProvider } from './providers/vonage';
import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * SMS Service Implementation
 * Provides SMS functionality with multiple provider support and delivery tracking
 */
export class SMSServiceImpl implements SMSService {
    private providers: Map<SMSProvider, any> = new Map();
    private defaultProvider: SMSProvider;
    private logger: Logger;

    constructor(
        configs: Array<{ provider: SMSProvider; config: SMSConfig }>,
        logger: Logger,
        defaultProvider?: SMSProvider
    ) {
        this.logger = logger.child({ service: 'sms' });

        // Initialize providers
        for (const { provider, config } of configs) {
            this.initializeProvider(provider, config);
        }

        // Set default provider
        this.defaultProvider = defaultProvider || configs[0]?.provider;
        if (!this.defaultProvider) {
            throw new SMSError('No SMS provider configured');
        }

        this.logger.info(`SMS service initialized with ${configs.length} providers`);
    }

    private initializeProvider(provider: SMSProvider, config: SMSConfig): void {
        try {
            switch (provider) {
                case SMSProvider.TWILIO:
                    this.providers.set(provider, new TwilioSMSProvider(config, this.logger));
                    break;
                case SMSProvider.AWS_SNS:
                    this.providers.set(provider, new AWSSNSProvider(config, this.logger));
                    break;
                case SMSProvider.VONAGE:
                    this.providers.set(provider, new VonageSMSProvider(config, this.logger));
                    break;
                default:
                    throw new SMSError(`Unsupported SMS provider: ${provider}`);
            }
            this.logger.info(`Initialized SMS provider: ${provider}`);
        } catch (error) {
            this.logger.error({ error, provider }, 'Failed to initialize SMS provider');
            throw new SMSError(`Failed to initialize SMS provider ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendSMS(
        to: string,
        message: string,
        from?: string,
        provider?: SMSProvider
    ): Promise<NotificationDeliveryResult> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance) {
            throw new SMSError(`SMS provider ${selectedProvider} not configured`);
        }

        const deliveryResult: NotificationDeliveryResult = {
            id: uuidv4(),
            notificationId: uuidv4(),
            channel: NotificationChannel.SMS,
            status: NotificationStatus.PENDING,
            providerId: selectedProvider,
            retryCount: 0,
            metadata: {
                to,
                from,
                messageLength: message.length,
                provider: selectedProvider
            }
        };

        try {
            // Validate phone number
            if (!this.isValidPhoneNumber(to)) {
                throw new SMSError(`Invalid phone number: ${to}`);
            }

            // Validate message length
            if (message.length > 1600) {
                throw new SMSError('Message too long. Maximum length is 1600 characters.');
            }

            this.logger.info({
                to: this.maskPhoneNumber(to),
                provider: selectedProvider,
                messageLength: message.length
            }, 'Sending SMS');

            const result = await providerInstance.send(to, message, from);

            deliveryResult.status = NotificationStatus.SENT;
            deliveryResult.providerResponse = result;
            deliveryResult.metadata.sentAt = new Date();

            this.logger.info({
                deliveryId: deliveryResult.id,
                provider: selectedProvider,
                status: 'sent'
            }, 'SMS sent successfully');

            return deliveryResult;

        } catch (error) {
            deliveryResult.status = NotificationStatus.FAILED;
            deliveryResult.failureReason = error instanceof Error ? error.message : 'Unknown error';
            deliveryResult.metadata.failedAt = new Date();

            this.logger.error({
                error,
                deliveryId: deliveryResult.id,
                provider: selectedProvider
            }, 'Failed to send SMS');

            throw new SMSError(`Failed to send SMS: ${deliveryResult.failureReason}`, {
                deliveryResult,
                originalError: error
            });
        }
    }

    async getDeliveryStatus(messageId: string, provider?: SMSProvider): Promise<NotificationStatus> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance) {
            throw new SMSError(`SMS provider ${selectedProvider} not configured`);
        }

        try {
            const status = await providerInstance.getStatus(messageId);
            this.logger.debug({ messageId, provider: selectedProvider, status }, 'Retrieved SMS delivery status');
            return status;
        } catch (error) {
            this.logger.error({ error, messageId, provider: selectedProvider }, 'Failed to get SMS delivery status');
            throw new SMSError(`Failed to get delivery status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
        try {
            return this.isValidPhoneNumber(phoneNumber);
        } catch (error) {
            this.logger.error({ error, phoneNumber: this.maskPhoneNumber(phoneNumber) }, 'Phone number validation failed');
            return false;
        }
    }

    async sendBulkSMS(
        recipients: Array<{ to: string; message: string; from?: string }>,
        provider?: SMSProvider
    ): Promise<NotificationDeliveryResult[]> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance) {
            throw new SMSError(`SMS provider ${selectedProvider} not configured`);
        }

        this.logger.info({
            recipientCount: recipients.length,
            provider: selectedProvider
        }, 'Sending bulk SMS');

        const results: NotificationDeliveryResult[] = [];

        // Process in batches to avoid overwhelming the provider
        const batchSize = 100;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            const batchPromises = batch.map(async (recipient) => {
                try {
                    return await this.sendSMS(recipient.to, recipient.message, recipient.from, selectedProvider);
                } catch (error) {
                    // Return failed result instead of throwing
                    return {
                        id: uuidv4(),
                        notificationId: uuidv4(),
                        channel: NotificationChannel.SMS,
                        status: NotificationStatus.FAILED,
                        providerId: selectedProvider,
                        failureReason: error instanceof Error ? error.message : 'Unknown error',
                        retryCount: 0,
                        metadata: {
                            to: recipient.to,
                            from: recipient.from,
                            messageLength: recipient.message.length,
                            provider: selectedProvider,
                            failedAt: new Date()
                        }
                    } as NotificationDeliveryResult;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Add delay between batches to respect rate limits
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const successCount = results.filter(r => r.status === NotificationStatus.SENT).length;
        const failureCount = results.length - successCount;

        this.logger.info({
            total: results.length,
            success: successCount,
            failed: failureCount,
            provider: selectedProvider
        }, 'Bulk SMS completed');

        return results;
    }

    private isValidPhoneNumber(phoneNumber: string): boolean {
        // Basic E.164 format validation
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phoneNumber);
    }

    private maskPhoneNumber(phoneNumber: string): string {
        if (phoneNumber.length <= 4) return phoneNumber;
        return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
    }

    /**
     * Get provider health status
     */
    async getProviderHealth(): Promise<Record<SMSProvider, boolean>> {
        const health: Record<string, boolean> = {};

        for (const [provider, instance] of this.providers) {
            try {
                if (instance.healthCheck) {
                    health[provider as string] = await instance.healthCheck();
                } else {
                    health[provider as string] = true; // Assume healthy if no health check method
                }
            } catch (error) {
                this.logger.error({ error, provider }, 'Provider health check failed');
                health[provider as string] = false;
            }
        }

        return health as Record<SMSProvider, boolean>;
    }

    /**
     * Switch to a different provider (for failover scenarios)
     */
    switchProvider(provider: SMSProvider): void {
        if (!this.providers.has(provider)) {
            throw new SMSError(`Provider ${provider} is not configured`);
        }

        this.defaultProvider = provider;
        this.logger.info({ newProvider: provider }, 'Switched SMS provider');
    }

    /**
     * Get current provider statistics
     */
    getProviderStats(): Record<SMSProvider, any> {
        const stats: Record<string, any> = {};

        for (const [provider, instance] of this.providers) {
            if (instance.getStats) {
                stats[provider] = instance.getStats();
            }
        }

        return stats as Record<SMSProvider, any>;
    }
}