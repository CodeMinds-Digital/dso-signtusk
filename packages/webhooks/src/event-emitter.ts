import { generateId } from '@signtusk/lib';
import {
    WebhookEventEmitter,
    WebhookEventType,
    WebhookEventPayload,
    WebhookRepository,
    WebhookDeliveryRepository,
    WebhookDeliveryService,
    WebhookValidationError,
} from './types';

export class DefaultWebhookEventEmitter implements WebhookEventEmitter {
    constructor(
        private webhookRepository: WebhookRepository,
        private deliveryRepository: WebhookDeliveryRepository,
        private deliveryService: WebhookDeliveryService,
        private version: string = 'v1'
    ) { }

    async emit(
        organizationId: string,
        eventType: WebhookEventType,
        data: any,
        metadata?: any
    ): Promise<void> {
        try {
            // Find all active webhooks for this organization and event type
            const webhooks = await this.webhookRepository.findByEvent(organizationId, eventType);

            if (webhooks.length === 0) {
                // No webhooks configured for this event type
                return;
            }

            // Create event payload
            const eventPayload: WebhookEventPayload = {
                id: generateId(),
                type: eventType,
                version: this.version,
                timestamp: new Date().toISOString(),
                organizationId,
                data: this.sanitizeData(data),
                metadata: metadata ? this.sanitizeMetadata(metadata) : undefined,
            };

            // Create deliveries for each webhook
            const deliveryPromises = webhooks.map(async (webhook) => {
                try {
                    const delivery = await this.deliveryRepository.create({
                        webhookId: webhook.id,
                        eventType,
                        payload: eventPayload,
                        status: 'pending',
                        attempts: 0,
                        maxRetries: webhook.retryPolicy.maxRetries,
                        nextAttemptAt: new Date(), // Deliver immediately
                    });

                    // Queue for delivery
                    await this.deliveryService.deliver(delivery);
                } catch (error) {
                    console.error(`Failed to create delivery for webhook ${webhook.id}:`, error);
                }
            });

            await Promise.allSettled(deliveryPromises);
        } catch (error) {
            throw new WebhookValidationError(
                'Failed to emit webhook event',
                {
                    organizationId,
                    eventType,
                    error: error instanceof Error ? error.message : 'Unknown error',
                }
            );
        }
    }

    private sanitizeData(data: any): any {
        if (data === null || data === undefined) {
            return {};
        }

        if (typeof data !== 'object') {
            return { value: data };
        }

        // Remove sensitive fields
        const sensitiveFields = [
            'password',
            'secret',
            'token',
            'key',
            'apiKey',
            'privateKey',
            'accessToken',
            'refreshToken',
            'sessionToken',
        ];

        const sanitized = { ...data };

        const removeSensitiveFields = (obj: any): any => {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            if (Array.isArray(obj)) {
                return obj.map(removeSensitiveFields);
            }

            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();
                const isSensitive = sensitiveFields.some(field =>
                    lowerKey.includes(field.toLowerCase())
                );

                if (isSensitive) {
                    result[key] = '[REDACTED]';
                } else if (typeof value === 'object') {
                    result[key] = removeSensitiveFields(value);
                } else {
                    result[key] = value;
                }
            }
            return result;
        };

        return removeSensitiveFields(sanitized);
    }

    private sanitizeMetadata(metadata: any): any {
        const allowedFields = [
            'userId',
            'ipAddress',
            'userAgent',
            'source',
            'correlationId',
        ];

        if (!metadata || typeof metadata !== 'object') {
            return {};
        }

        const sanitized: any = {};
        for (const field of allowedFields) {
            if (metadata[field] !== undefined) {
                sanitized[field] = metadata[field];
            }
        }

        return sanitized;
    }
}

// Event emitter with batching support for high-volume scenarios
export class BatchedWebhookEventEmitter implements WebhookEventEmitter {
    private eventQueue: Array<{
        organizationId: string;
        eventType: WebhookEventType;
        data: any;
        metadata?: any;
    }> = [];

    private batchTimer?: NodeJS.Timeout;
    private readonly batchSize: number;
    private readonly batchTimeout: number;

    constructor(
        private baseEmitter: WebhookEventEmitter,
        batchSize: number = 100,
        batchTimeout: number = 1000 // 1 second
    ) {
        this.batchSize = batchSize;
        this.batchTimeout = batchTimeout;
    }

    async emit(
        organizationId: string,
        eventType: WebhookEventType,
        data: any,
        metadata?: any
    ): Promise<void> {
        this.eventQueue.push({
            organizationId,
            eventType,
            data,
            metadata,
        });

        // Process batch if we've reached the batch size
        if (this.eventQueue.length >= this.batchSize) {
            await this.processBatch();
        } else {
            // Set timer to process batch after timeout
            this.scheduleBatchProcessing();
        }
    }

    async flush(): Promise<void> {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = undefined;
        }

        if (this.eventQueue.length > 0) {
            await this.processBatch();
        }
    }

    private scheduleBatchProcessing(): void {
        if (this.batchTimer) {
            return; // Timer already scheduled
        }

        this.batchTimer = setTimeout(async () => {
            this.batchTimer = undefined;
            await this.processBatch();
        }, this.batchTimeout);
    }

    private async processBatch(): Promise<void> {
        if (this.eventQueue.length === 0) {
            return;
        }

        const batch = this.eventQueue.splice(0, this.batchSize);

        // Process events in parallel
        const promises = batch.map(event =>
            this.baseEmitter.emit(
                event.organizationId,
                event.eventType,
                event.data,
                event.metadata
            ).catch(error => {
                console.error('Failed to emit batched webhook event:', error);
            })
        );

        await Promise.allSettled(promises);
    }
}