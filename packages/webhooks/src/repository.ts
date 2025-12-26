import { PrismaClient, DeliveryStatus } from '@signtusk/database';
import { generateId } from '@signtusk/lib';
import {
    Webhook,
    WebhookConfig,
    WebhookDelivery,
    WebhookDeliveryStatus,
    WebhookRepository,
    WebhookDeliveryRepository,
    WebhookEventType,
    WebhookValidationError,
} from './types';

export class PrismaWebhookRepository implements WebhookRepository {
    constructor(private prisma: PrismaClient) { }

    async create(organizationId: string, config: WebhookConfig): Promise<Webhook> {
        try {
            const webhook = await this.prisma.webhook.create({
                data: {
                    id: generateId(),
                    organizationId,
                    url: config.url,
                    events: config.events,
                    secret: config.secret,
                    status: config.active ? 'ACTIVE' : 'INACTIVE',
                },
            });

            return this.mapToWebhook(webhook, config);
        } catch (error) {
            throw new WebhookValidationError(
                'Failed to create webhook',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async findById(id: string): Promise<Webhook | null> {
        const webhook = await this.prisma.webhook.findUnique({
            where: { id },
        });

        if (!webhook) {
            return null;
        }

        return this.mapToWebhook(webhook);
    }

    async findByOrganization(organizationId: string): Promise<Webhook[]> {
        const webhooks = await this.prisma.webhook.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });

        return webhooks.map(webhook => this.mapToWebhook(webhook));
    }

    async update(id: string, updates: Partial<WebhookConfig>): Promise<Webhook> {
        try {
            const updateData: any = {};

            if (updates.url !== undefined) updateData.url = updates.url;
            if (updates.events !== undefined) updateData.events = updates.events;
            if (updates.secret !== undefined) updateData.secret = updates.secret;
            if (updates.active !== undefined) updateData.status = updates.active ? 'ACTIVE' : 'INACTIVE';

            const webhook = await this.prisma.webhook.update({
                where: { id },
                data: updateData,
            });

            return this.mapToWebhook(webhook, updates);
        } catch (error) {
            throw new WebhookValidationError(
                'Failed to update webhook',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.webhook.delete({
                where: { id },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async findByEvent(organizationId: string, eventType: WebhookEventType): Promise<Webhook[]> {
        const webhooks = await this.prisma.webhook.findMany({
            where: {
                organizationId,
                status: 'ACTIVE',
                events: {
                    array_contains: [eventType],
                },
            },
        });

        return webhooks.map(webhook => this.mapToWebhook(webhook));
    }

    private mapToWebhook(webhook: any, config?: Partial<WebhookConfig>): Webhook {
        return {
            id: webhook.id,
            organizationId: webhook.organizationId,
            url: webhook.url,
            events: Array.isArray(webhook.events) ? webhook.events : [],
            secret: webhook.secret,
            version: config?.version || 'v1',
            timeout: config?.timeout || 10000,
            retryPolicy: config?.retryPolicy || {
                maxRetries: 3,
                initialDelay: 1000,
                maxDelay: 300000,
                backoffMultiplier: 2,
            },
            headers: config?.headers,
            active: webhook.status === 'ACTIVE',
            createdAt: webhook.createdAt,
            updatedAt: webhook.updatedAt,
        };
    }
}

export class PrismaWebhookDeliveryRepository implements WebhookDeliveryRepository {
    constructor(private prisma: PrismaClient) { }

    async create(delivery: Omit<WebhookDelivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookDelivery> {
        try {
            const created = await this.prisma.webhookDelivery.create({
                data: {
                    id: generateId(),
                    webhookId: delivery.webhookId,
                    eventType: delivery.eventType,
                    payload: delivery.payload,
                    status: this.mapDeliveryStatusToPrisma(delivery.status),
                    attempts: delivery.attempts,
                    nextAttemptAt: delivery.nextAttemptAt,
                    lastAttemptAt: delivery.lastAttemptAt,
                    responseStatus: delivery.responseStatus,
                    responseBody: delivery.responseBody,
                },
            });

            return this.mapToWebhookDelivery(created, delivery);
        } catch (error) {
            throw new WebhookValidationError(
                'Failed to create webhook delivery',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async findById(id: string): Promise<WebhookDelivery | null> {
        const delivery = await this.prisma.webhookDelivery.findUnique({
            where: { id },
        });

        if (!delivery) {
            return null;
        }

        return this.mapToWebhookDelivery(delivery);
    }

    async findByWebhook(webhookId: string, limit: number = 100): Promise<WebhookDelivery[]> {
        const deliveries = await this.prisma.webhookDelivery.findMany({
            where: { webhookId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return deliveries.map(delivery => this.mapToWebhookDelivery(delivery));
    }

    async update(id: string, updates: Partial<WebhookDelivery>): Promise<WebhookDelivery> {
        try {
            const updateData: any = {};

            if (updates.status !== undefined) {
                updateData.status = this.mapDeliveryStatusToPrisma(updates.status);
            }
            if (updates.attempts !== undefined) updateData.attempts = updates.attempts;
            if (updates.nextAttemptAt !== undefined) updateData.nextAttemptAt = updates.nextAttemptAt;
            if (updates.lastAttemptAt !== undefined) updateData.lastAttemptAt = updates.lastAttemptAt;
            if (updates.responseStatus !== undefined) updateData.responseStatus = updates.responseStatus;
            if (updates.responseBody !== undefined) updateData.responseBody = updates.responseBody;

            const delivery = await this.prisma.webhookDelivery.update({
                where: { id },
                data: updateData,
            });

            return this.mapToWebhookDelivery(delivery, updates);
        } catch (error) {
            throw new WebhookValidationError(
                'Failed to update webhook delivery',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async findPendingRetries(limit: number = 100): Promise<WebhookDelivery[]> {
        const deliveries = await this.prisma.webhookDelivery.findMany({
            where: {
                status: 'PENDING',
                nextAttemptAt: {
                    lte: new Date(),
                },
            },
            orderBy: { nextAttemptAt: 'asc' },
            take: limit,
        });

        return deliveries.map(delivery => this.mapToWebhookDelivery(delivery));
    }

    async markAsDelivered(
        id: string,
        responseStatus: number,
        responseBody?: string,
        responseHeaders?: Record<string, string>
    ): Promise<void> {
        await this.prisma.webhookDelivery.update({
            where: { id },
            data: {
                status: 'DELIVERED',
                responseStatus,
                responseBody,
                lastAttemptAt: new Date(),
            },
        });
    }

    async markAsFailed(
        id: string,
        error: string,
        responseStatus?: number,
        responseBody?: string
    ): Promise<void> {
        await this.prisma.webhookDelivery.update({
            where: { id },
            data: {
                status: 'FAILED',
                responseStatus,
                responseBody,
                lastAttemptAt: new Date(),
            },
        });
    }

    private mapToWebhookDelivery(delivery: any, updates?: Partial<WebhookDelivery>): WebhookDelivery {
        return {
            id: delivery.id,
            webhookId: delivery.webhookId,
            eventType: delivery.eventType,
            payload: delivery.payload,
            status: this.mapDeliveryStatusFromPrisma(delivery.status),
            attempts: delivery.attempts,
            maxRetries: updates?.maxRetries || 3,
            nextAttemptAt: delivery.nextAttemptAt,
            lastAttemptAt: delivery.lastAttemptAt,
            responseStatus: delivery.responseStatus,
            responseBody: delivery.responseBody,
            responseHeaders: updates?.responseHeaders,
            error: updates?.error,
            createdAt: delivery.createdAt,
            updatedAt: delivery.updatedAt,
        };
    }

    private mapDeliveryStatusToPrisma(status: WebhookDeliveryStatus): DeliveryStatus {
        switch (status) {
            case 'pending': return DeliveryStatus.PENDING;
            case 'delivered': return DeliveryStatus.DELIVERED;
            case 'failed': return DeliveryStatus.FAILED;
            case 'cancelled': return DeliveryStatus.FAILED; // Map cancelled to failed
            default: return DeliveryStatus.PENDING;
        }
    }

    private mapDeliveryStatusFromPrisma(status: string): WebhookDeliveryStatus {
        switch (status) {
            case 'PENDING': return 'pending';
            case 'DELIVERED': return 'delivered';
            case 'FAILED': return 'failed';
            case 'BOUNCED': return 'failed'; // Map bounced to failed
            case 'SENT': return 'pending'; // Map sent to pending
            default: return 'pending';
        }
    }
}