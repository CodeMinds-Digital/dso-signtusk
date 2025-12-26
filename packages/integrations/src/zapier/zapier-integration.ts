import { BaseIntegration } from '../base-integration';
import {
    IntegrationConfig,
    IntegrationStatus,
    SyncEvent,
    ZapierConfig,
    ZapierWebhookPayload,
    IntegrationType,
    SyncEventType,
    AuthenticationError,
    SyncError
} from '../types';

export class ZapierIntegration extends BaseIntegration {
    private readonly ZAPIER_API_BASE = 'https://hooks.zapier.com/hooks/catch';

    constructor() {
        super(IntegrationType.ZAPIER);
    }

    async authenticate(config: IntegrationConfig): Promise<boolean> {
        const zapierConfig = config as ZapierConfig;

        try {
            this.validateRequiredFields(zapierConfig, ['webhookUrl', 'apiKey']);

            // Test webhook connectivity by sending a test payload
            const testPayload: ZapierWebhookPayload = {
                trigger: 'test_connection',
                data: {
                    test: true,
                    timestamp: new Date().toISOString(),
                },
                timestamp: new Date().toISOString(),
            };

            const response = await this.makeHttpRequest(zapierConfig.webhookUrl, {
                method: 'POST',
                headers: {
                    'X-API-Key': zapierConfig.apiKey,
                },
                body: JSON.stringify(testPayload),
            });

            return response.ok;
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }

    async sync(config: IntegrationConfig, events: SyncEvent[]): Promise<void> {
        const zapierConfig = config as ZapierConfig;

        try {
            for (const event of events) {
                await this.sendEventToZapier(zapierConfig, event);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, errorMessage, error);
        }
    }

    async validateConfig(config: Partial<IntegrationConfig>): Promise<boolean> {
        try {
            const zapierConfig = config as Partial<ZapierConfig>;

            // Validate required fields
            this.validateRequiredFields(zapierConfig, ['webhookUrl', 'apiKey']);

            // Validate webhook URL format
            if (!zapierConfig.webhookUrl?.startsWith('https://hooks.zapier.com/')) {
                throw new Error('Invalid Zapier webhook URL format');
            }

            // Validate triggers and actions arrays
            if (zapierConfig.triggers && !Array.isArray(zapierConfig.triggers)) {
                throw new Error('Triggers must be an array');
            }

            if (zapierConfig.actions && !Array.isArray(zapierConfig.actions)) {
                throw new Error('Actions must be an array');
            }

            return true;
        } catch (error) {
            this.handleError(error, 'Config validation failed');
        }
    }

    async getStatus(config: IntegrationConfig): Promise<IntegrationStatus> {
        try {
            const isAuthenticated = await this.authenticate(config);
            return isAuthenticated ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR;
        } catch (error) {
            return IntegrationStatus.ERROR;
        }
    }

    async disconnect(config: IntegrationConfig): Promise<void> {
        // Zapier doesn't require explicit disconnection
        // The webhook will simply stop receiving events
        return Promise.resolve();
    }

    private async sendEventToZapier(config: ZapierConfig, event: SyncEvent): Promise<void> {
        const payload: ZapierWebhookPayload = {
            trigger: this.mapEventTypeToTrigger(event.eventType),
            data: {
                eventId: event.id,
                eventType: event.eventType,
                entityId: event.entityId,
                entityType: event.entityType,
                ...event.data,
            },
            timestamp: event.timestamp.toISOString(),
        };

        // Only send if this trigger is configured
        if (!config.triggers.includes(payload.trigger)) {
            return;
        }

        const response = await this.makeHttpRequest(config.webhookUrl, {
            method: 'POST',
            headers: {
                'X-API-Key': config.apiKey,
                'X-Event-Type': event.eventType,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to send event to Zapier: ${response.statusText}`);
        }
    }

    private mapEventTypeToTrigger(eventType: SyncEventType): string {
        const mapping: Record<SyncEventType, string> = {
            [SyncEventType.DOCUMENT_CREATED]: 'document_created',
            [SyncEventType.DOCUMENT_SIGNED]: 'document_signed',
            [SyncEventType.DOCUMENT_COMPLETED]: 'document_completed',
            [SyncEventType.DOCUMENT_DECLINED]: 'document_declined',
            [SyncEventType.CONTACT_CREATED]: 'contact_created',
            [SyncEventType.CONTACT_UPDATED]: 'contact_updated',
        };

        return mapping[eventType] || 'unknown_event';
    }

    // Zapier-specific methods for handling incoming webhooks
    async handleIncomingWebhook(payload: ZapierWebhookPayload): Promise<SyncEvent> {
        return {
            id: `zapier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            integrationId: '', // Will be set by the caller
            eventType: this.mapTriggerToEventType(payload.trigger),
            entityId: payload.data.entityId || '',
            entityType: payload.data.entityType || 'unknown',
            data: payload.data,
            timestamp: new Date(payload.timestamp),
            processed: false,
        };
    }

    private mapTriggerToEventType(trigger: string): SyncEventType {
        const mapping: Record<string, SyncEventType> = {
            'document_created': SyncEventType.DOCUMENT_CREATED,
            'document_signed': SyncEventType.DOCUMENT_SIGNED,
            'document_completed': SyncEventType.DOCUMENT_COMPLETED,
            'document_declined': SyncEventType.DOCUMENT_DECLINED,
            'contact_created': SyncEventType.CONTACT_CREATED,
            'contact_updated': SyncEventType.CONTACT_UPDATED,
        };

        return mapping[trigger] || SyncEventType.DOCUMENT_CREATED;
    }
}