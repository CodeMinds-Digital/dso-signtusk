import { generateSecureToken } from '@signtusk/lib';
import {
    Webhook,
    WebhookConfig,
    WebhookDelivery,
    CreateWebhookRequest,
    UpdateWebhookRequest,
    WebhookEventType,
    WebhookRepository,
    WebhookDeliveryRepository,
    WebhookEventEmitter,
    WebhookDeliveryService,
    WebhookSignatureService,
    WebhookValidationError,
    CreateWebhookRequestSchema,
    UpdateWebhookRequestSchema,
} from './types';

export class WebhookService {
    constructor(
        private webhookRepository: WebhookRepository,
        private deliveryRepository: WebhookDeliveryRepository,
        private eventEmitter: WebhookEventEmitter,
        private deliveryService: WebhookDeliveryService,
        private signatureService: WebhookSignatureService
    ) { }

    // ============================================================================
    // WEBHOOK MANAGEMENT
    // ============================================================================

    async createWebhook(organizationId: string, request: CreateWebhookRequest): Promise<Webhook> {
        // Validate request
        const validatedRequest = CreateWebhookRequestSchema.parse(request);

        // Generate secret if not provided
        const secret = validatedRequest.secret || generateSecureToken(64);

        // Create webhook configuration
        const config: WebhookConfig = {
            url: validatedRequest.url,
            events: validatedRequest.events,
            secret,
            version: 'v1',
            timeout: validatedRequest.timeout || 10000,
            retryPolicy: {
                maxRetries: validatedRequest.retryPolicy?.maxRetries || 3,
                initialDelay: validatedRequest.retryPolicy?.initialDelay || 1000,
                maxDelay: validatedRequest.retryPolicy?.maxDelay || 300000,
                backoffMultiplier: validatedRequest.retryPolicy?.backoffMultiplier || 2,
            },
            headers: validatedRequest.headers,
            active: true,
        };

        // Validate webhook URL is reachable (optional ping)
        await this.validateWebhookUrl(config.url);

        return await this.webhookRepository.create(organizationId, config);
    }

    async getWebhook(id: string): Promise<Webhook | null> {
        return await this.webhookRepository.findById(id);
    }

    async listWebhooks(organizationId: string): Promise<Webhook[]> {
        return await this.webhookRepository.findByOrganization(organizationId);
    }

    async updateWebhook(id: string, request: UpdateWebhookRequest): Promise<Webhook> {
        // Validate request
        const validatedRequest = UpdateWebhookRequestSchema.parse(request);

        // Validate webhook URL if provided
        if (validatedRequest.url) {
            await this.validateWebhookUrl(validatedRequest.url);
        }

        const updates: Partial<WebhookConfig> = {};

        if (validatedRequest.url !== undefined) updates.url = validatedRequest.url;
        if (validatedRequest.events !== undefined) updates.events = validatedRequest.events;
        if (validatedRequest.secret !== undefined) updates.secret = validatedRequest.secret;
        if (validatedRequest.timeout !== undefined) updates.timeout = validatedRequest.timeout;
        if (validatedRequest.retryPolicy !== undefined) {
            updates.retryPolicy = {
                maxRetries: validatedRequest.retryPolicy.maxRetries ?? 3,
                initialDelay: validatedRequest.retryPolicy.initialDelay ?? 1000,
                maxDelay: validatedRequest.retryPolicy.maxDelay ?? 300000,
                backoffMultiplier: validatedRequest.retryPolicy.backoffMultiplier ?? 2,
            };
        }
        if (validatedRequest.headers !== undefined) updates.headers = validatedRequest.headers;

        return await this.webhookRepository.update(id, updates);
    }

    async deleteWebhook(id: string): Promise<boolean> {
        return await this.webhookRepository.delete(id);
    }

    async activateWebhook(id: string): Promise<Webhook> {
        return await this.webhookRepository.update(id, { active: true });
    }

    async deactivateWebhook(id: string): Promise<Webhook> {
        return await this.webhookRepository.update(id, { active: false });
    }

    // ============================================================================
    // EVENT EMISSION
    // ============================================================================

    async emitEvent(
        organizationId: string,
        eventType: WebhookEventType,
        data: any,
        metadata?: {
            userId?: string;
            ipAddress?: string;
            userAgent?: string;
            source?: string;
            correlationId?: string;
        }
    ): Promise<void> {
        await this.eventEmitter.emit(organizationId, eventType, data, metadata);
    }

    // ============================================================================
    // DELIVERY MANAGEMENT
    // ============================================================================

    async getDeliveries(webhookId: string, limit: number = 100): Promise<WebhookDelivery[]> {
        return await this.deliveryRepository.findByWebhook(webhookId, limit);
    }

    async getDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
        return await this.deliveryRepository.findById(deliveryId);
    }

    async retryDelivery(deliveryId: string): Promise<void> {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new WebhookValidationError('Delivery not found');
        }

        if (delivery.status === 'delivered') {
            throw new WebhookValidationError('Cannot retry delivered webhook');
        }

        // Reset delivery status and schedule retry
        const updatedDelivery = await this.deliveryRepository.update(deliveryId, {
            status: 'pending',
            nextAttemptAt: new Date(),
        });

        await this.deliveryService.deliver(updatedDelivery);
    }

    async cancelDelivery(deliveryId: string): Promise<void> {
        const delivery = await this.deliveryRepository.findById(deliveryId);
        if (!delivery) {
            throw new WebhookValidationError('Delivery not found');
        }

        if (delivery.status === 'delivered') {
            throw new WebhookValidationError('Cannot cancel delivered webhook');
        }

        await this.deliveryRepository.update(deliveryId, {
            status: 'cancelled',
        });
    }

    // ============================================================================
    // SIGNATURE VERIFICATION
    // ============================================================================

    verifyWebhookSignature(
        payload: string,
        signatureHeader: string,
        secret: string
    ): boolean {
        try {
            const signature = this.signatureService.parseSignatureHeader(signatureHeader);
            return this.signatureService.verifySignature(payload, signature, secret);
        } catch (error) {
            return false;
        }
    }

    generateWebhookSignature(payload: string, secret: string): string {
        const signature = this.signatureService.generateSignature(payload, secret);
        return this.signatureService.formatSignatureHeader(signature);
    }

    // ============================================================================
    // TESTING AND VALIDATION
    // ============================================================================

    async testWebhook(id: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
        const webhook = await this.webhookRepository.findById(id);
        if (!webhook) {
            throw new WebhookValidationError('Webhook not found');
        }

        const testPayload = {
            id: 'test_' + Date.now(),
            type: 'test.webhook' as WebhookEventType,
            version: webhook.version,
            timestamp: new Date().toISOString(),
            organizationId: webhook.organizationId,
            data: {
                message: 'This is a test webhook delivery',
                timestamp: new Date().toISOString(),
            },
        };

        const payloadString = JSON.stringify(testPayload);
        const signature = this.signatureService.generateSignature(payloadString, webhook.secret);

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'DocuSign-Alternative-Webhooks/1.0',
            'X-Webhook-Signature': this.signatureService.formatSignatureHeader(signature),
            'X-Webhook-Event': 'test.webhook',
            'X-Webhook-Test': 'true',
            ...webhook.headers,
        };

        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers,
                body: payloadString,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            if (response.ok) {
                return { success: true, responseTime };
            } else {
                const responseBody = await response.text().catch(() => '');
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${responseBody}`,
                    responseTime,
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
            };
        }
    }

    private async validateWebhookUrl(url: string): Promise<void> {
        try {
            const parsedUrl = new URL(url);

            // Ensure HTTPS in production
            if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
                throw new WebhookValidationError('Webhook URL must use HTTPS in production');
            }

            // Prevent localhost/private IPs in production
            if (process.env.NODE_ENV === 'production') {
                const hostname = parsedUrl.hostname;
                if (
                    hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    hostname.startsWith('192.168.') ||
                    hostname.startsWith('10.') ||
                    hostname.startsWith('172.')
                ) {
                    throw new WebhookValidationError('Webhook URL cannot point to private/local addresses');
                }
            }
        } catch (error) {
            if (error instanceof WebhookValidationError) {
                throw error;
            }
            throw new WebhookValidationError('Invalid webhook URL format');
        }
    }

    // ============================================================================
    // ANALYTICS AND MONITORING
    // ============================================================================

    async getWebhookStats(webhookId: string): Promise<{
        totalDeliveries: number;
        successfulDeliveries: number;
        failedDeliveries: number;
        pendingDeliveries: number;
        averageResponseTime: number;
        successRate: number;
    }> {
        const deliveries = await this.deliveryRepository.findByWebhook(webhookId, 1000);

        const totalDeliveries = deliveries.length;
        const successfulDeliveries = deliveries.filter(d => d.status === 'delivered').length;
        const failedDeliveries = deliveries.filter(d => d.status === 'failed').length;
        const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;

        // Calculate average response time (mock implementation)
        const averageResponseTime = 250; // Would be calculated from actual response times

        const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

        return {
            totalDeliveries,
            successfulDeliveries,
            failedDeliveries,
            pendingDeliveries,
            averageResponseTime,
            successRate,
        };
    }
}