import { Client } from '@microsoft/microsoft-graph-client';
import { BaseIntegration } from '../base-integration';
import {
    IntegrationConfig,
    IntegrationStatus,
    SyncEvent,
    Microsoft365Config,
    Microsoft365WebhookPayload,
    IntegrationType,
    SyncEventType,
    AuthenticationError,
    SyncError
} from '../types';

export class Microsoft365Integration extends BaseIntegration {
    private readonly GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
    private readonly AUTH_BASE = 'https://login.microsoftonline.com';

    constructor() {
        super(IntegrationType.MICROSOFT_365);
    }

    async authenticate(config: IntegrationConfig): Promise<boolean> {
        const msConfig = config as Microsoft365Config;

        try {
            this.validateRequiredFields(msConfig, ['tenantId', 'clientId', 'clientSecret']);

            // If we have tokens, validate them
            if (msConfig.accessToken) {
                return await this.validateAccessToken(msConfig);
            }

            // Otherwise, we need to initiate OAuth flow
            return false;
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }

    async sync(config: IntegrationConfig, events: SyncEvent[]): Promise<void> {
        const msConfig = config as Microsoft365Config;

        try {
            const client = this.createGraphClient(msConfig);

            for (const event of events) {
                if (msConfig.syncSharePoint) {
                    await this.syncToSharePoint(client, msConfig, event);
                }

                if (msConfig.syncTeams) {
                    await this.syncToTeams(client, msConfig, event);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, errorMessage, error);
        }
    }

    async validateConfig(config: Partial<IntegrationConfig>): Promise<boolean> {
        try {
            const msConfig = config as Partial<Microsoft365Config>;

            // Validate required fields
            this.validateRequiredFields(msConfig, ['tenantId', 'clientId', 'clientSecret']);

            // Validate tenant ID format (GUID)
            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!guidRegex.test(msConfig.tenantId!)) {
                throw new Error('Invalid tenant ID format');
            }

            // Validate SharePoint site ID if provided
            if (msConfig.sharepointSiteId && !guidRegex.test(msConfig.sharepointSiteId)) {
                throw new Error('Invalid SharePoint site ID format');
            }

            return true;
        } catch (error) {
            this.handleError(error, 'Config validation failed');
        }
    }

    async getStatus(config: IntegrationConfig): Promise<IntegrationStatus> {
        try {
            const isAuthenticated = await this.authenticate(config);
            return isAuthenticated ? IntegrationStatus.ACTIVE : IntegrationStatus.PENDING;
        } catch (error) {
            return IntegrationStatus.ERROR;
        }
    }

    async disconnect(config: IntegrationConfig): Promise<void> {
        const msConfig = config as Microsoft365Config;

        try {
            // Revoke tokens if available
            if (msConfig.accessToken) {
                await this.revokeTokens(msConfig);
            }
        } catch (error) {
            // Log error but don't throw - disconnection should always succeed
            console.error('Error during Microsoft 365 disconnection:', error);
        }
    }

    private createGraphClient(config: Microsoft365Config): Client {
        return Client.init({
            authProvider: async (done) => {
                try {
                    const token = await this.ensureValidToken(config);
                    done(null, token);
                } catch (error) {
                    done(error, null);
                }
            },
        });
    }

    private async ensureValidToken(config: Microsoft365Config): Promise<string> {
        if (!config.accessToken) {
            throw new AuthenticationError(this.integrationType, 'No access token available');
        }

        // Check if token is still valid
        const isValid = await this.validateAccessToken(config);
        if (isValid) {
            return config.accessToken;
        }

        // Try to refresh the token
        if (config.refreshToken) {
            return await this.refreshAccessToken(config);
        }

        throw new AuthenticationError(this.integrationType, 'Token expired and no refresh token available');
    }

    private async validateAccessToken(config: Microsoft365Config): Promise<boolean> {
        try {
            const response = await this.makeHttpRequest(`${this.GRAPH_API_BASE}/me`, {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                },
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    protected async refreshAccessToken(config: Microsoft365Config): Promise<string> {
        const msConfig = config as Microsoft365Config;

        try {
            const tokenUrl = `${this.AUTH_BASE}/${msConfig.tenantId}/oauth2/v2.0/token`;

            const response = await this.makeHttpRequest(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: msConfig.clientId,
                    client_secret: msConfig.clientSecret,
                    refresh_token: msConfig.refreshToken!,
                    grant_type: 'refresh_token',
                    scope: 'https://graph.microsoft.com/.default',
                }),
            });

            const tokenData = await response.json();
            return tokenData.access_token;
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }

    private async syncToSharePoint(client: Client, config: Microsoft365Config, event: SyncEvent): Promise<void> {
        if (!config.sharepointSiteId) {
            return;
        }

        try {
            const documentData = this.prepareDocumentForSharePoint(event);

            // Upload document to SharePoint
            await client
                .api(`/sites/${config.sharepointSiteId}/drive/root/children`)
                .post(documentData);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, `SharePoint sync failed: ${errorMessage}`, error);
        }
    }

    private async syncToTeams(client: Client, config: Microsoft365Config, event: SyncEvent): Promise<void> {
        if (!config.teamsChannelId) {
            return;
        }

        try {
            const message = this.prepareMessageForTeams(event);

            // Send message to Teams channel
            await client
                .api(`/teams/${config.teamsChannelId}/channels/general/messages`)
                .post(message);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, `Teams sync failed: ${errorMessage}`, error);
        }
    }

    private prepareDocumentForSharePoint(event: SyncEvent): any {
        return {
            name: `${event.entityType}_${event.entityId}_${event.timestamp.toISOString()}.json`,
            file: {
                content: JSON.stringify(event.data, null, 2),
            },
            '@microsoft.graph.conflictBehavior': 'rename',
        };
    }

    private prepareMessageForTeams(event: SyncEvent): any {
        const eventTypeMessages = {
            [SyncEventType.DOCUMENT_CREATED]: '📄 New document created',
            [SyncEventType.DOCUMENT_SIGNED]: '✍️ Document signed',
            [SyncEventType.DOCUMENT_COMPLETED]: '✅ Document completed',
            [SyncEventType.DOCUMENT_DECLINED]: '❌ Document declined',
            [SyncEventType.CONTACT_CREATED]: '👤 New contact created',
            [SyncEventType.CONTACT_UPDATED]: '👤 Contact updated',
        };

        return {
            body: {
                contentType: 'html',
                content: `
          <h3>${eventTypeMessages[event.eventType] || 'Document event'}</h3>
          <p><strong>Entity:</strong> ${event.entityType} (${event.entityId})</p>
          <p><strong>Time:</strong> ${event.timestamp.toLocaleString()}</p>
          <p><strong>Details:</strong> ${JSON.stringify(event.data, null, 2)}</p>
        `,
            },
        };
    }

    private async revokeTokens(config: Microsoft365Config): Promise<void> {
        try {
            const revokeUrl = `${this.AUTH_BASE}/${config.tenantId}/oauth2/v2.0/logout`;

            await this.makeHttpRequest(revokeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    token: config.accessToken!,
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                }),
            });
        } catch (error) {
            // Log but don't throw - revocation is best effort
            console.error('Failed to revoke Microsoft 365 tokens:', error);
        }
    }

    // Microsoft 365 specific methods for handling webhooks
    async handleIncomingWebhook(payload: Microsoft365WebhookPayload): Promise<SyncEvent> {
        return {
            id: `ms365_${payload.subscriptionId}_${Date.now()}`,
            integrationId: '', // Will be set by the caller
            eventType: this.mapChangeTypeToEventType(payload.changeType),
            entityId: payload.resourceData.id || '',
            entityType: this.extractEntityTypeFromResource(payload.resource),
            data: payload.resourceData,
            timestamp: new Date(),
            processed: false,
        };
    }

    private mapChangeTypeToEventType(changeType: string): SyncEventType {
        const mapping: Record<string, SyncEventType> = {
            'created': SyncEventType.DOCUMENT_CREATED,
            'updated': SyncEventType.CONTACT_UPDATED,
            'deleted': SyncEventType.DOCUMENT_DECLINED, // Map to declined as closest equivalent
        };

        return mapping[changeType] || SyncEventType.DOCUMENT_CREATED;
    }

    private extractEntityTypeFromResource(resource: string): string {
        // Extract entity type from resource path like "/me/drive/items/{id}"
        const parts = resource.split('/');
        if (parts.includes('drive')) return 'document';
        if (parts.includes('contacts')) return 'contact';
        if (parts.includes('messages')) return 'message';
        return 'unknown';
    }
}