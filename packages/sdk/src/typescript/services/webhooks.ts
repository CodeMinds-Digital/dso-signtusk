/**
 * Webhook service for managing webhooks
 */

import { BaseService } from './base';
import { Webhook, WebhookDelivery, PaginatedResponse, ListOptions } from '../types';
import { verifyWebhookSignature } from '../utils';

export class WebhookService extends BaseService {
    async createWebhook(data: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Webhook> {
        return this.create<Webhook>('/v1/webhooks', data);
    }

    async getWebhook(webhookId: string): Promise<Webhook> {
        return this.get<Webhook>(`/v1/webhooks/${webhookId}`);
    }

    async listWebhooks(options: ListOptions = {}): Promise<PaginatedResponse<Webhook>> {
        return this.list<Webhook>('/v1/webhooks', options);
    }

    async updateWebhook(webhookId: string, updates: Partial<Webhook>): Promise<Webhook> {
        return this.update<Webhook>(`/v1/webhooks/${webhookId}`, updates);
    }

    async deleteWebhook(webhookId: string): Promise<void> {
        return this.delete(`/v1/webhooks/${webhookId}`);
    }

    async test(webhookId: string): Promise<{ success: boolean; response?: any; error?: string }> {
        return this.create<{ success: boolean; response?: any; error?: string }>(
            `/v1/webhooks/${webhookId}/test`,
            {}
        );
    }

    async getDeliveries(webhookId: string, options: ListOptions = {}): Promise<PaginatedResponse<WebhookDelivery>> {
        return this.list<WebhookDelivery>(`/v1/webhooks/${webhookId}/deliveries`, options);
    }

    async retryDelivery(webhookId: string, deliveryId: string): Promise<void> {
        return this.create<void>(`/v1/webhooks/${webhookId}/deliveries/${deliveryId}/retry`, {});
    }

    verifySignature(payload: string, signature: string, secret: string): boolean {
        return verifyWebhookSignature(payload, signature, secret);
    }
}