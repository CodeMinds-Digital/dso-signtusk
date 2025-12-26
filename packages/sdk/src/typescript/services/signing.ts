/**
 * Signing service for managing signature workflows
 */

import { BaseService } from './base';
import {
    SigningRequest,
    Recipient,
    WorkflowDefinition,
    PaginatedResponse,
    ListOptions
} from '../types';

export interface CreateSigningRequestData {
    documentId?: string;
    templateId?: string;
    recipients: Omit<Recipient, 'id' | 'status' | 'createdAt' | 'updatedAt'>[];
    workflow?: WorkflowDefinition;
    title?: string;
    message?: string;
    expiresAt?: string;
    reminderSettings?: {
        enabled: boolean;
        firstReminderDays: number;
        intervalDays: number;
        maxReminders: number;
    };
}

export class SigningService extends BaseService {
    /**
     * Create a new signing request
     */
    async createSigningRequest(data: CreateSigningRequestData): Promise<SigningRequest> {
        return super.create<SigningRequest>('/v1/signing/requests', data);
    }

    /**
     * Create signing request from template
     */
    async createFromTemplate(data: {
        templateId: string;
        recipients: { role: string; email: string; name: string }[];
        title?: string;
        message?: string;
        expiresAt?: string;
    }): Promise<SigningRequest> {
        return this.create<SigningRequest>('/v1/signing/requests/from-template', data);
    }

    /**
     * Get signing request by ID
     */
    async getSigningRequest(requestId: string): Promise<SigningRequest> {
        return this.get<SigningRequest>(`/v1/signing/requests/${requestId}`);
    }

    /**
     * List signing requests
     */
    async listSigningRequests(options: ListOptions = {}): Promise<PaginatedResponse<SigningRequest>> {
        return this.list<SigningRequest>('/v1/signing/requests', options);
    }

    /**
     * Send signing request to recipients
     */
    async send(requestId: string): Promise<SigningRequest> {
        return this.create<SigningRequest>(`/v1/signing/requests/${requestId}/send`, {});
    }

    /**
     * Cancel signing request
     */
    async cancel(requestId: string, reason?: string): Promise<SigningRequest> {
        return this.patch<SigningRequest>(`/v1/signing/requests/${requestId}/cancel`, { reason });
    }

    /**
     * Get signing status
     */
    async getStatus(requestId: string): Promise<{
        status: string;
        completedRecipients: number;
        totalRecipients: number;
        currentStep: number;
        totalSteps: number;
    }> {
        return this.get<{
            status: string;
            completedRecipients: number;
            totalRecipients: number;
            currentStep: number;
            totalSteps: number;
        }>(`/v1/signing/requests/${requestId}/status`);
    }

    /**
     * Get signing URL for a recipient
     */
    async getSigningUrl(requestId: string, recipientId: string): Promise<{ url: string; expiresAt: string }> {
        return this.get<{ url: string; expiresAt: string }>(
            `/v1/signing/requests/${requestId}/recipients/${recipientId}/signing-url`
        );
    }

    /**
     * Add recipient to signing request
     */
    async addRecipient(
        requestId: string,
        recipient: Omit<Recipient, 'id' | 'status' | 'createdAt' | 'updatedAt'>
    ): Promise<Recipient> {
        return this.create<Recipient>(`/v1/signing/requests/${requestId}/recipients`, recipient);
    }

    /**
     * Update recipient
     */
    async updateRecipient(
        requestId: string,
        recipientId: string,
        updates: Partial<Pick<Recipient, 'email' | 'name' | 'phoneNumber' | 'accessCode'>>
    ): Promise<Recipient> {
        return this.patch<Recipient>(
            `/v1/signing/requests/${requestId}/recipients/${recipientId}`,
            updates
        );
    }

    /**
     * Remove recipient from signing request
     */
    async removeRecipient(requestId: string, recipientId: string): Promise<void> {
        return this.delete(`/v1/signing/requests/${requestId}/recipients/${recipientId}`);
    }

    /**
     * Resend invitation to recipient
     */
    async resendInvitation(requestId: string, recipientId: string): Promise<void> {
        return this.create<void>(
            `/v1/signing/requests/${requestId}/recipients/${recipientId}/resend`,
            {}
        );
    }

    /**
     * Get completed document with signatures
     */
    async getCompletedDocument(requestId: string): Promise<Buffer> {
        const response = await this.client.get(
            `/v1/signing/requests/${requestId}/completed-document`,
            { responseType: 'arraybuffer' }
        );
        return Buffer.from(response.data);
    }

    /**
     * Get certificate of completion
     */
    async getCertificate(requestId: string): Promise<Buffer> {
        const response = await this.client.get(
            `/v1/signing/requests/${requestId}/certificate`,
            { responseType: 'arraybuffer' }
        );
        return Buffer.from(response.data);
    }

    /**
     * Get audit trail
     */
    async getAuditTrail(requestId: string): Promise<{
        events: Array<{
            timestamp: string;
            event: string;
            actor: string;
            details: Record<string, any>;
        }>;
    }> {
        return this.get<{
            events: Array<{
                timestamp: string;
                event: string;
                actor: string;
                details: Record<string, any>;
            }>;
        }>(`/v1/signing/requests/${requestId}/audit-trail`);
    }

    /**
     * Bulk send signing requests
     */
    async bulkSend(requestIds: string[]): Promise<{
        sent: string[];
        failed: Array<{ id: string; error: string }>;
    }> {
        return this.create<{
            sent: string[];
            failed: Array<{ id: string; error: string }>;
        }>('/v1/signing/requests/bulk-send', { requestIds });
    }

    /**
     * Bulk cancel signing requests
     */
    async bulkCancel(requestIds: string[], reason?: string): Promise<{
        cancelled: string[];
        failed: Array<{ id: string; error: string }>;
    }> {
        return this.create<{
            cancelled: string[];
            failed: Array<{ id: string; error: string }>;
        }>('/v1/signing/requests/bulk-cancel', { requestIds, reason });
    }

    /**
     * Set reminder schedule
     */
    async setReminders(requestId: string, settings: {
        enabled: boolean;
        firstReminderDays: number;
        intervalDays: number;
        maxReminders: number;
    }): Promise<void> {
        return this.patch<void>(`/v1/signing/requests/${requestId}/reminders`, settings);
    }

    /**
     * Send manual reminder
     */
    async sendReminder(requestId: string, recipientId?: string, message?: string): Promise<void> {
        return this.create<void>(`/v1/signing/requests/${requestId}/send-reminder`, {
            recipientId,
            message
        });
    }
}