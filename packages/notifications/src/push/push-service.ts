import {
    PushNotificationService,
    PushConfig,
    PushProvider,
    NotificationDeliveryResult,
    NotificationStatus,
    NotificationChannel,
    PushPayload,
    PushNotificationError
} from '../types';
import { FirebasePushProvider } from './providers/firebase';
import { WebPushProvider } from './providers/web-push';
import { APNSProvider } from './providers/apns';
import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * Push Notification Service Implementation
 * Provides push notification functionality with multiple provider support and delivery tracking
 */
export class PushNotificationServiceImpl implements PushNotificationService {
    private providers: Map<PushProvider, any> = new Map();
    private defaultProvider: PushProvider;
    private logger: Logger;

    constructor(
        configs: Array<{ provider: PushProvider; config: PushConfig }>,
        logger: Logger,
        defaultProvider?: PushProvider
    ) {
        this.logger = logger.child({ service: 'push' });

        // Initialize providers
        for (const { provider, config } of configs) {
            this.initializeProvider(provider, config);
        }

        // Set default provider
        this.defaultProvider = defaultProvider || configs[0]?.provider;
        if (!this.defaultProvider) {
            throw new PushNotificationError('No push notification provider configured');
        }

        this.logger.info(`Push notification service initialized with ${configs.length} providers`);
    }

    private initializeProvider(provider: PushProvider, config: PushConfig): void {
        try {
            switch (provider) {
                case PushProvider.FIREBASE:
                    this.providers.set(provider, new FirebasePushProvider(config, this.logger));
                    break;
                case PushProvider.WEB_PUSH:
                    this.providers.set(provider, new WebPushProvider(config, this.logger));
                    break;
                case PushProvider.APNS:
                    this.providers.set(provider, new APNSProvider(config, this.logger));
                    break;
                default:
                    throw new PushNotificationError(`Unsupported push provider: ${provider}`);
            }
            this.logger.info(`Initialized push provider: ${provider}`);
        } catch (error) {
            this.logger.error({ error, provider }, 'Failed to initialize push provider');
            throw new PushNotificationError(`Failed to initialize push provider ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendPush(
        token: string,
        payload: PushPayload,
        provider?: PushProvider
    ): Promise<NotificationDeliveryResult> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance) {
            throw new PushNotificationError(`Push provider ${selectedProvider} not configured`);
        }

        const deliveryResult: NotificationDeliveryResult = {
            id: uuidv4(),
            notificationId: uuidv4(),
            channel: NotificationChannel.PUSH,
            status: NotificationStatus.PENDING,
            providerId: selectedProvider,
            retryCount: 0,
            metadata: {
                token: this.maskToken(token),
                title: payload.title,
                provider: selectedProvider,
                payloadSize: JSON.stringify(payload).length
            }
        };

        try {
            // Validate token format
            if (!this.isValidToken(token)) {
                throw new PushNotificationError(`Invalid push token format`);
            }

            // Validate payload
            this.validatePayload(payload);

            this.logger.info({
                token: this.maskToken(token),
                provider: selectedProvider,
                title: payload.title
            }, 'Sending push notification');

            const result = await providerInstance.send(token, payload);

            deliveryResult.status = NotificationStatus.SENT;
            deliveryResult.providerResponse = result;
            deliveryResult.metadata.sentAt = new Date();

            this.logger.info({
                deliveryId: deliveryResult.id,
                provider: selectedProvider,
                status: 'sent'
            }, 'Push notification sent successfully');

            return deliveryResult;

        } catch (error) {
            deliveryResult.status = NotificationStatus.FAILED;
            deliveryResult.failureReason = error instanceof Error ? error.message : 'Unknown error';
            deliveryResult.metadata.failedAt = new Date();

            this.logger.error({
                error,
                deliveryId: deliveryResult.id,
                provider: selectedProvider
            }, 'Failed to send push notification');

            throw new PushNotificationError(`Failed to send push notification: ${deliveryResult.failureReason}`, {
                deliveryResult,
                originalError: error
            });
        }
    }

    async sendBulkPush(
        tokens: string[],
        payload: PushPayload,
        provider?: PushProvider
    ): Promise<NotificationDeliveryResult[]> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance) {
            throw new PushNotificationError(`Push provider ${selectedProvider} not configured`);
        }

        this.logger.info({
            tokenCount: tokens.length,
            provider: selectedProvider,
            title: payload.title
        }, 'Sending bulk push notifications');

        const results: NotificationDeliveryResult[] = [];

        // Process in batches to avoid overwhelming the provider
        const batchSize = 500; // Firebase FCM supports up to 500 tokens per batch
        for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);

            try {
                if (providerInstance.sendBulk) {
                    // Use provider's bulk send if available
                    const batchResults = await providerInstance.sendBulk(batch, payload);
                    results.push(...batchResults);
                } else {
                    // Fall back to individual sends
                    const batchPromises = batch.map(async (token) => {
                        try {
                            return await this.sendPush(token, payload, selectedProvider);
                        } catch (error) {
                            return {
                                id: uuidv4(),
                                notificationId: uuidv4(),
                                channel: NotificationChannel.PUSH,
                                status: NotificationStatus.FAILED,
                                providerId: selectedProvider,
                                failureReason: error instanceof Error ? error.message : 'Unknown error',
                                retryCount: 0,
                                metadata: {
                                    token: this.maskToken(token),
                                    title: payload.title,
                                    provider: selectedProvider,
                                    failedAt: new Date()
                                }
                            } as NotificationDeliveryResult;
                        }
                    });

                    const batchResults = await Promise.all(batchPromises);
                    results.push(...batchResults);
                }

                // Add delay between batches to respect rate limits
                if (i + batchSize < tokens.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                this.logger.error({ error, batchSize: batch.length }, 'Batch push notification failed');

                // Add failed results for the entire batch
                const failedResults = batch.map(token => ({
                    id: uuidv4(),
                    notificationId: uuidv4(),
                    channel: NotificationChannel.PUSH,
                    status: NotificationStatus.FAILED,
                    providerId: selectedProvider,
                    failureReason: error instanceof Error ? error.message : 'Batch failed',
                    retryCount: 0,
                    metadata: {
                        token: this.maskToken(token),
                        title: payload.title,
                        provider: selectedProvider,
                        failedAt: new Date()
                    }
                } as NotificationDeliveryResult));

                results.push(...failedResults);
            }
        }

        const successCount = results.filter(r => r.status === NotificationStatus.SENT).length;
        const failureCount = results.length - successCount;

        this.logger.info({
            total: results.length,
            success: successCount,
            failed: failureCount,
            provider: selectedProvider
        }, 'Bulk push notifications completed');

        return results;
    }

    async validateToken(token: string, provider?: PushProvider): Promise<boolean> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance) {
            return false;
        }

        try {
            if (providerInstance.validateToken) {
                return await providerInstance.validateToken(token);
            }
            return this.isValidToken(token);
        } catch (error) {
            this.logger.error({ error, token: this.maskToken(token) }, 'Token validation failed');
            return false;
        }
    }

    async subscribeToTopic(token: string, topic: string, provider?: PushProvider): Promise<boolean> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance || !providerInstance.subscribeToTopic) {
            throw new PushNotificationError(`Topic subscription not supported by provider ${selectedProvider}`);
        }

        try {
            const result = await providerInstance.subscribeToTopic(token, topic);
            this.logger.info({
                token: this.maskToken(token),
                topic,
                provider: selectedProvider
            }, 'Subscribed to topic');
            return result;
        } catch (error) {
            this.logger.error({ error, token: this.maskToken(token), topic }, 'Failed to subscribe to topic');
            throw new PushNotificationError(`Failed to subscribe to topic: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async unsubscribeFromTopic(token: string, topic: string, provider?: PushProvider): Promise<boolean> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance || !providerInstance.unsubscribeFromTopic) {
            throw new PushNotificationError(`Topic unsubscription not supported by provider ${selectedProvider}`);
        }

        try {
            const result = await providerInstance.unsubscribeFromTopic(token, topic);
            this.logger.info({
                token: this.maskToken(token),
                topic,
                provider: selectedProvider
            }, 'Unsubscribed from topic');
            return result;
        } catch (error) {
            this.logger.error({ error, token: this.maskToken(token), topic }, 'Failed to unsubscribe from topic');
            throw new PushNotificationError(`Failed to unsubscribe from topic: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private isValidToken(token: string): boolean {
        // Basic token validation - should be non-empty and reasonable length
        return !!token && token.length > 10 && token.length < 4096;
    }

    private validatePayload(payload: PushPayload): void {
        if (!payload.title || payload.title.trim().length === 0) {
            throw new PushNotificationError('Push notification title is required');
        }

        if (!payload.body || payload.body.trim().length === 0) {
            throw new PushNotificationError('Push notification body is required');
        }

        if (payload.title.length > 100) {
            throw new PushNotificationError('Push notification title too long (max 100 characters)');
        }

        if (payload.body.length > 500) {
            throw new PushNotificationError('Push notification body too long (max 500 characters)');
        }

        // Validate payload size (approximate)
        const payloadSize = JSON.stringify(payload).length;
        if (payloadSize > 4096) {
            throw new PushNotificationError('Push notification payload too large (max 4KB)');
        }
    }

    private maskToken(token: string): string {
        if (token.length <= 8) return token;
        return token.slice(0, 4) + '...' + token.slice(-4);
    }

    /**
     * Get provider health status
     */
    async getProviderHealth(): Promise<Record<PushProvider, boolean>> {
        const health: Record<string, boolean> = {};

        for (const [provider, instance] of this.providers) {
            try {
                if (instance.healthCheck) {
                    health[provider as string] = await instance.healthCheck();
                } else {
                    health[provider as string] = true;
                }
            } catch (error) {
                this.logger.error({ error, provider }, 'Provider health check failed');
                health[provider as string] = false;
            }
        }

        return health as Record<PushProvider, boolean>;
    }

    /**
     * Switch to a different provider
     */
    switchProvider(provider: PushProvider): void {
        if (!this.providers.has(provider)) {
            throw new PushNotificationError(`Provider ${provider} is not configured`);
        }

        this.defaultProvider = provider;
        this.logger.info({ newProvider: provider }, 'Switched push provider');
    }

    /**
     * Get provider statistics
     */
    getProviderStats(): Record<PushProvider, any> {
        const stats: Record<string, any> = {};

        for (const [provider, instance] of this.providers) {
            if (instance.getStats) {
                stats[provider] = instance.getStats();
            }
        }

        return stats as Record<PushProvider, any>;
    }

    /**
     * Send push notification to topic (if supported by provider)
     */
    async sendToTopic(topic: string, payload: PushPayload, provider?: PushProvider): Promise<NotificationDeliveryResult> {
        const selectedProvider = provider || this.defaultProvider;
        const providerInstance = this.providers.get(selectedProvider);

        if (!providerInstance || !providerInstance.sendToTopic) {
            throw new PushNotificationError(`Topic messaging not supported by provider ${selectedProvider}`);
        }

        const deliveryResult: NotificationDeliveryResult = {
            id: uuidv4(),
            notificationId: uuidv4(),
            channel: NotificationChannel.PUSH,
            status: NotificationStatus.PENDING,
            providerId: selectedProvider,
            retryCount: 0,
            metadata: {
                topic,
                title: payload.title,
                provider: selectedProvider,
                payloadSize: JSON.stringify(payload).length
            }
        };

        try {
            this.validatePayload(payload);

            this.logger.info({
                topic,
                provider: selectedProvider,
                title: payload.title
            }, 'Sending push notification to topic');

            const result = await providerInstance.sendToTopic(topic, payload);

            deliveryResult.status = NotificationStatus.SENT;
            deliveryResult.providerResponse = result;
            deliveryResult.metadata.sentAt = new Date();

            return deliveryResult;

        } catch (error) {
            deliveryResult.status = NotificationStatus.FAILED;
            deliveryResult.failureReason = error instanceof Error ? error.message : 'Unknown error';
            deliveryResult.metadata.failedAt = new Date();

            this.logger.error({ error, topic, provider: selectedProvider }, 'Failed to send push notification to topic');
            throw new PushNotificationError(`Failed to send push notification to topic: ${deliveryResult.failureReason}`);
        }
    }
}