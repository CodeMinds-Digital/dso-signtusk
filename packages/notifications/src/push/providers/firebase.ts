import { PushConfig, NotificationStatus, PushPayload, PushNotificationError, NotificationDeliveryResult, NotificationChannel } from '../../types';
import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * Firebase Cloud Messaging (FCM) Push Provider Implementation
 * Note: This is a stub implementation. Full Firebase Admin SDK integration would be needed in production.
 */
export class FirebasePushProvider {
    private config: PushConfig;
    private logger: Logger;
    private stats = {
        sent: 0,
        failed: 0,
        lastError: null as string | null,
        lastSuccess: null as Date | null
    };

    constructor(config: PushConfig, logger: Logger) {
        this.config = config;
        this.logger = logger.child({ provider: 'firebase' });

        if (!config.serviceAccountKey || !config.projectId) {
            throw new PushNotificationError('Firebase service account key and project ID are required');
        }

        try {
            // In production, initialize Firebase Admin SDK here
            // const admin = require('firebase-admin');
            // const serviceAccount = JSON.parse(config.serviceAccountKey);
            // admin.initializeApp({
            //     credential: admin.credential.cert(serviceAccount),
            //     projectId: config.projectId
            // });

            this.logger.info('Firebase push provider initialized');
        } catch (error) {
            this.logger.error({ error }, 'Failed to initialize Firebase');
            throw new PushNotificationError(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async send(token: string, payload: PushPayload): Promise<any> {
        try {
            this.logger.debug({
                token: this.maskToken(token),
                title: payload.title
            }, 'Sending push notification via Firebase');

            // Stub implementation - would use Firebase Admin SDK in production
            const messageId = `fcm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Simulate Firebase message format
            const message = {
                token,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    image: payload.image
                },
                data: payload.data || {},
                android: payload.sound ? {
                    notification: {
                        sound: payload.sound
                    }
                } : undefined,
                apns: payload.sound ? {
                    payload: {
                        aps: {
                            sound: payload.sound
                        }
                    }
                } : undefined,
                webpush: {
                    notification: {
                        icon: payload.icon,
                        badge: payload.badge,
                        tag: payload.tag,
                        requireInteraction: payload.requireInteraction,
                        silent: payload.silent,
                        timestamp: payload.timestamp,
                        vibrate: payload.vibrate,
                        actions: payload.actions
                    }
                }
            };

            // In production: const response = await admin.messaging().send(message);

            this.stats.sent++;
            this.stats.lastSuccess = new Date();

            this.logger.info({ messageId }, 'Push notification sent via Firebase');

            return {
                messageId,
                status: NotificationStatus.SENT,
                providerId: 'firebase',
                providerResponse: {
                    name: `projects/${this.config.projectId}/messages/${messageId}`,
                    messageId
                }
            };

        } catch (error: any) {
            this.stats.failed++;
            this.stats.lastError = error.message;

            this.logger.error({
                error,
                token: this.maskToken(token)
            }, 'Failed to send push notification via Firebase');

            // Map Firebase-specific errors
            if (error.code === 'messaging/invalid-registration-token') {
                throw new PushNotificationError('Invalid registration token');
            } else if (error.code === 'messaging/registration-token-not-registered') {
                throw new PushNotificationError('Registration token is not registered');
            } else if (error.code === 'messaging/invalid-payload') {
                throw new PushNotificationError('Invalid message payload');
            }

            throw new PushNotificationError(`Firebase push failed: ${error.message}`, {
                code: error.code,
                details: error.details
            });
        }
    }

    async sendBulk(tokens: string[], payload: PushPayload): Promise<NotificationDeliveryResult[]> {
        try {
            this.logger.debug({
                tokenCount: tokens.length,
                title: payload.title
            }, 'Sending bulk push notifications via Firebase');

            // Stub implementation - would use Firebase Admin SDK multicast in production
            const results: NotificationDeliveryResult[] = [];

            for (const token of tokens) {
                try {
                    const result = await this.send(token, payload);
                    results.push({
                        id: uuidv4(),
                        notificationId: uuidv4(),
                        channel: NotificationChannel.PUSH,
                        status: NotificationStatus.SENT,
                        providerId: 'firebase',
                        providerResponse: result,
                        retryCount: 0,
                        metadata: {
                            token: this.maskToken(token),
                            title: payload.title,
                            sentAt: new Date()
                        }
                    });
                } catch (error) {
                    results.push({
                        id: uuidv4(),
                        notificationId: uuidv4(),
                        channel: NotificationChannel.PUSH,
                        status: NotificationStatus.FAILED,
                        providerId: 'firebase',
                        failureReason: error instanceof Error ? error.message : 'Unknown error',
                        retryCount: 0,
                        metadata: {
                            token: this.maskToken(token),
                            title: payload.title,
                            failedAt: new Date()
                        }
                    });
                }
            }

            return results;

        } catch (error: any) {
            this.logger.error({ error, tokenCount: tokens.length }, 'Bulk push notification failed');
            throw new PushNotificationError(`Firebase bulk push failed: ${error.message}`);
        }
    }

    async validateToken(token: string): Promise<boolean> {
        try {
            // In production, use Firebase Admin SDK to validate token
            // const response = await admin.messaging().send({ token }, true);
            return token.length > 10; // Stub validation
        } catch (error) {
            return false;
        }
    }

    async subscribeToTopic(token: string, topic: string): Promise<boolean> {
        try {
            this.logger.debug({
                token: this.maskToken(token),
                topic
            }, 'Subscribing to topic via Firebase');

            // In production: await admin.messaging().subscribeToTopic([token], topic);

            this.logger.info({ topic }, 'Subscribed to topic via Firebase');
            return true;

        } catch (error: any) {
            this.logger.error({ error, topic }, 'Failed to subscribe to topic via Firebase');
            throw new PushNotificationError(`Failed to subscribe to topic: ${error.message}`);
        }
    }

    async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
        try {
            this.logger.debug({
                token: this.maskToken(token),
                topic
            }, 'Unsubscribing from topic via Firebase');

            // In production: await admin.messaging().unsubscribeFromTopic([token], topic);

            this.logger.info({ topic }, 'Unsubscribed from topic via Firebase');
            return true;

        } catch (error: any) {
            this.logger.error({ error, topic }, 'Failed to unsubscribe from topic via Firebase');
            throw new PushNotificationError(`Failed to unsubscribe from topic: ${error.message}`);
        }
    }

    async sendToTopic(topic: string, payload: PushPayload): Promise<any> {
        try {
            this.logger.debug({
                topic,
                title: payload.title
            }, 'Sending push notification to topic via Firebase');

            // Stub implementation
            const messageId = `fcm-topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            this.stats.sent++;
            this.stats.lastSuccess = new Date();

            return {
                messageId,
                status: NotificationStatus.SENT,
                providerId: 'firebase',
                providerResponse: {
                    name: `projects/${this.config.projectId}/messages/${messageId}`,
                    messageId
                }
            };

        } catch (error: any) {
            this.stats.failed++;
            this.stats.lastError = error.message;
            this.logger.error({ error, topic }, 'Failed to send push notification to topic via Firebase');
            throw new PushNotificationError(`Firebase topic push failed: ${error.message}`);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            // In production, make a test call to Firebase
            return true;
        } catch (error) {
            this.logger.error({ error }, 'Firebase health check failed');
            return false;
        }
    }

    getStats() {
        return {
            ...this.stats,
            provider: 'firebase',
            successRate: this.stats.sent + this.stats.failed > 0
                ? (this.stats.sent / (this.stats.sent + this.stats.failed)) * 100
                : 0
        };
    }

    private maskToken(token: string): string {
        if (token.length <= 8) return token;
        return token.slice(0, 4) + '...' + token.slice(-4);
    }
}