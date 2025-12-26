import { JobService } from '@signtusk/jobs';
import {
    WebhookDelivery,
    WebhookDeliveryService,
    WebhookDeliveryRepository,
    WebhookRepository,
    WebhookDeliveryError,
    WebhookSignatureService,
} from './types';

export class HttpWebhookDeliveryService implements WebhookDeliveryService {
    constructor(
        private deliveryRepository: WebhookDeliveryRepository,
        private webhookRepository: WebhookRepository,
        private signatureService: WebhookSignatureService,
        private jobService: JobService,
        private httpClient: typeof fetch = fetch
    ) {
        // Define the webhook delivery job
        this.jobService.defineJob({
            name: 'webhook-delivery',
            handler: this.processDelivery.bind(this),
            config: {
                maxRetries: 0, // We handle retries ourselves
                concurrency: 10,
            },
        });

        // Define the retry processing job
        this.jobService.defineJob({
            name: 'webhook-retry-processor',
            handler: async () => {
                await this.processRetries();
                return { success: true };
            },
            config: {
                maxRetries: 1,
                concurrency: 1,
            },
        });
    }

    async deliver(delivery: WebhookDelivery): Promise<void> {
        // Queue the delivery job
        await this.jobService.enqueue('webhook-delivery', {
            deliveryId: delivery.id,
        });
    }

    async scheduleRetry(delivery: WebhookDelivery): Promise<void> {
        const webhook = await this.webhookRepository.findById(delivery.webhookId);
        if (!webhook) {
            throw new WebhookDeliveryError('Webhook not found for delivery');
        }

        // Calculate next retry time using exponential backoff
        const nextAttemptAt = this.calculateNextRetryTime(
            delivery.attempts,
            webhook.retryPolicy.initialDelay,
            webhook.retryPolicy.maxDelay,
            webhook.retryPolicy.backoffMultiplier
        );

        // Update delivery with next attempt time
        await this.deliveryRepository.update(delivery.id, {
            status: 'pending',
            nextAttemptAt,
        });
    }

    async processRetries(): Promise<void> {
        const pendingDeliveries = await this.deliveryRepository.findPendingRetries(50);

        for (const delivery of pendingDeliveries) {
            try {
                await this.deliver(delivery);
            } catch (error) {
                console.error(`Failed to schedule retry for delivery ${delivery.id}:`, error);
            }
        }
    }

    private async processDelivery(payload: { deliveryId: string }): Promise<{ success: boolean; error?: string }> {
        try {
            const delivery = await this.deliveryRepository.findById(payload.deliveryId);
            if (!delivery) {
                return { success: false, error: 'Delivery not found' };
            }

            const webhook = await this.webhookRepository.findById(delivery.webhookId);
            if (!webhook) {
                return { success: false, error: 'Webhook not found' };
            }

            if (!webhook.active) {
                return { success: false, error: 'Webhook is inactive' };
            }

            // Increment attempt count
            const updatedDelivery = await this.deliveryRepository.update(delivery.id, {
                attempts: delivery.attempts + 1,
                lastAttemptAt: new Date(),
            });

            // Prepare payload
            const payloadString = JSON.stringify(delivery.payload);

            // Generate signature
            const signature = this.signatureService.generateSignature(payloadString, webhook.secret);

            // Prepare headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'DocuSign-Alternative-Webhooks/1.0',
                'X-Webhook-Signature': this.signatureService.formatSignatureHeader(signature),
                'X-Webhook-Event': delivery.eventType,
                'X-Webhook-Delivery': delivery.id,
                ...webhook.headers,
            };

            // Make HTTP request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

            try {
                const response = await this.httpClient(webhook.url, {
                    method: 'POST',
                    headers,
                    body: payloadString,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const responseBody = await response.text().catch(() => '');
                const responseHeaders: Record<string, string> = {};
                response.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });

                if (response.ok) {
                    // Success - mark as delivered
                    await this.deliveryRepository.markAsDelivered(
                        delivery.id,
                        response.status,
                        responseBody,
                        responseHeaders
                    );
                    return { success: true };
                } else {
                    // HTTP error - check if we should retry
                    const shouldRetry = this.shouldRetryHttpError(response.status) &&
                        updatedDelivery.attempts < webhook.retryPolicy.maxRetries;

                    if (shouldRetry) {
                        await this.scheduleRetry(updatedDelivery);
                        return { success: false, error: `HTTP ${response.status}: ${responseBody}` };
                    } else {
                        await this.deliveryRepository.markAsFailed(
                            delivery.id,
                            `HTTP ${response.status}: ${responseBody}`,
                            response.status,
                            responseBody
                        );
                        return { success: false, error: `HTTP ${response.status}: ${responseBody}` };
                    }
                }
            } catch (error) {
                clearTimeout(timeoutId);

                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const shouldRetry = updatedDelivery.attempts < webhook.retryPolicy.maxRetries;

                if (shouldRetry) {
                    await this.scheduleRetry(updatedDelivery);
                    return { success: false, error: errorMessage };
                } else {
                    await this.deliveryRepository.markAsFailed(delivery.id, errorMessage);
                    return { success: false, error: errorMessage };
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    private calculateNextRetryTime(
        attempts: number,
        initialDelay: number,
        maxDelay: number,
        backoffMultiplier: number
    ): Date {
        const delay = Math.min(
            initialDelay * Math.pow(backoffMultiplier, attempts),
            maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const finalDelay = delay + jitter;

        return new Date(Date.now() + finalDelay);
    }

    private shouldRetryHttpError(status: number): boolean {
        // Retry on server errors and rate limiting
        return status >= 500 || status === 429 || status === 408;
    }
}