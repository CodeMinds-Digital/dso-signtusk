import jsforce from 'jsforce';
import type { Connection } from 'jsforce';
import { BaseIntegration } from '../base-integration';
import {
    IntegrationConfig,
    IntegrationStatus,
    SyncEvent,
    SalesforceConfig,
    SalesforceWebhookPayload,
    IntegrationType,
    SyncEventType,
    AuthenticationError,
    SyncError
} from '../types';

export class SalesforceIntegration extends BaseIntegration {
    constructor() {
        super(IntegrationType.SALESFORCE);
    }

    async authenticate(config: IntegrationConfig): Promise<boolean> {
        const sfConfig = config as SalesforceConfig;

        try {
            this.validateRequiredFields(sfConfig, ['instanceUrl', 'clientId', 'clientSecret']);

            // If we have tokens, validate them
            if (sfConfig.accessToken) {
                return await this.validateAccessToken(sfConfig);
            }

            // Otherwise, we need to initiate OAuth flow
            return false;
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }

    async sync(config: IntegrationConfig, events: SyncEvent[]): Promise<void> {
        const sfConfig = config as SalesforceConfig;

        try {
            const conn = await this.createConnection(sfConfig);

            for (const event of events) {
                if (sfConfig.syncContacts) {
                    await this.syncToContacts(conn, event);
                }

                if (sfConfig.syncOpportunities) {
                    await this.syncToOpportunities(conn, event);
                }

                if (sfConfig.syncAccounts) {
                    await this.syncToAccounts(conn, event);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, errorMessage, error);
        }
    }

    async validateConfig(config: Partial<IntegrationConfig>): Promise<boolean> {
        try {
            const sfConfig = config as Partial<SalesforceConfig>;

            // Validate required fields
            this.validateRequiredFields(sfConfig, ['instanceUrl', 'clientId', 'clientSecret']);

            // Validate instance URL format
            if (!sfConfig.instanceUrl?.startsWith('https://') ||
                !sfConfig.instanceUrl.includes('.salesforce.com')) {
                throw new Error('Invalid Salesforce instance URL format');
            }

            // Validate at least one sync option is enabled
            if (!sfConfig.syncContacts && !sfConfig.syncOpportunities && !sfConfig.syncAccounts) {
                throw new Error('At least one sync option (contacts, opportunities, or accounts) must be enabled');
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
        const sfConfig = config as SalesforceConfig;

        try {
            // Revoke tokens if available
            if (sfConfig.accessToken) {
                await this.revokeTokens(sfConfig);
            }
        } catch (error) {
            // Log error but don't throw - disconnection should always succeed
            console.error('Error during Salesforce disconnection:', error);
        }
    }

    private async createConnection(config: SalesforceConfig): Promise<Connection> {
        const conn = new jsforce.Connection({
            instanceUrl: config.instanceUrl,
            accessToken: config.accessToken,
        });

        // Validate connection
        try {
            await conn.identity();
        } catch (error) {
            // Try to refresh token if we have a refresh token
            if (config.refreshToken) {
                const newToken = await this.refreshAccessToken(config);
                conn.accessToken = newToken;
            } else {
                throw new AuthenticationError(this.integrationType, 'Token expired and no refresh token available');
            }
        }

        return conn;
    }

    private async validateAccessToken(config: SalesforceConfig): Promise<boolean> {
        try {
            const conn = new jsforce.Connection({
                instanceUrl: config.instanceUrl,
                accessToken: config.accessToken,
            });

            await conn.identity();
            return true;
        } catch (error) {
            return false;
        }
    }

    protected async refreshAccessToken(config: SalesforceConfig): Promise<string> {
        try {
            const tokenUrl = `${config.instanceUrl}/services/oauth2/token`;

            const response = await this.makeHttpRequest(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    refresh_token: config.refreshToken!,
                }),
            });

            const tokenData = await response.json();
            return tokenData.access_token;
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }

    private async syncToContacts(conn: Connection, event: SyncEvent): Promise<void> {
        try {
            const contactData = this.prepareContactData(event);

            if (event.eventType === SyncEventType.CONTACT_CREATED) {
                await conn.sobject('Contact').create(contactData);
            } else if (event.eventType === SyncEventType.CONTACT_UPDATED) {
                // Try to find existing contact by external ID or email
                const existingContact = await this.findExistingContact(conn, event);
                if (existingContact) {
                    await conn.sobject('Contact').update({
                        Id: existingContact.Id,
                        ...contactData,
                    });
                } else {
                    // Create new contact if not found
                    await conn.sobject('Contact').create(contactData);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, `Contact sync failed: ${errorMessage}`, error);
        }
    }

    private async syncToOpportunities(conn: Connection, event: SyncEvent): Promise<void> {
        try {
            const opportunityData = this.prepareOpportunityData(event);

            // Create or update opportunity based on document events
            if (event.eventType === SyncEventType.DOCUMENT_CREATED) {
                await conn.sobject('Opportunity').create(opportunityData);
            } else if (event.eventType === SyncEventType.DOCUMENT_COMPLETED) {
                const existingOpp = await this.findExistingOpportunity(conn, event);
                if (existingOpp) {
                    await conn.sobject('Opportunity').update({
                        Id: existingOpp.Id,
                        StageName: 'Closed Won',
                        CloseDate: new Date().toISOString().split('T')[0],
                    });
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, `Opportunity sync failed: ${errorMessage}`, error);
        }
    }

    private async syncToAccounts(conn: Connection, event: SyncEvent): Promise<void> {
        try {
            const accountData = this.prepareAccountData(event);

            // Create account if it doesn't exist
            const existingAccount = await this.findExistingAccount(conn, event);
            if (!existingAccount) {
                await conn.sobject('Account').create(accountData);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, `Account sync failed: ${errorMessage}`, error);
        }
    }

    private prepareContactData(event: SyncEvent): any {
        const data = event.data;
        return {
            FirstName: data.firstName || '',
            LastName: data.lastName || data.name || 'Unknown',
            Email: data.email || '',
            Phone: data.phone || '',
            External_ID__c: event.entityId, // Custom field to track external ID
            Description: `Synced from Signtusk - Event: ${event.eventType}`,
        };
    }

    private prepareOpportunityData(event: SyncEvent): any {
        const data = event.data;
        return {
            Name: data.documentName || `Document ${event.entityId}`,
            StageName: 'Proposal/Price Quote',
            CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            External_ID__c: event.entityId,
            Description: `Document signing opportunity - Event: ${event.eventType}`,
            Amount: data.amount || null,
        };
    }

    private prepareAccountData(event: SyncEvent): any {
        const data = event.data;
        return {
            Name: data.companyName || data.organizationName || `Account ${event.entityId}`,
            External_ID__c: event.entityId,
            Description: `Synced from Signtusk - Event: ${event.eventType}`,
            Website: data.website || '',
            Phone: data.phone || '',
        };
    }

    private async findExistingContact(conn: Connection, event: SyncEvent): Promise<any> {
        try {
            const result = await conn.sobject('Contact').findOne({
                External_ID__c: event.entityId,
            });
            return result;
        } catch (error) {
            return null;
        }
    }

    private async findExistingOpportunity(conn: Connection, event: SyncEvent): Promise<any> {
        try {
            const result = await conn.sobject('Opportunity').findOne({
                External_ID__c: event.entityId,
            });
            return result;
        } catch (error) {
            return null;
        }
    }

    private async findExistingAccount(conn: Connection, event: SyncEvent): Promise<any> {
        try {
            const result = await conn.sobject('Account').findOne({
                External_ID__c: event.entityId,
            });
            return result;
        } catch (error) {
            return null;
        }
    }

    private async revokeTokens(config: SalesforceConfig): Promise<void> {
        try {
            const revokeUrl = `${config.instanceUrl}/services/oauth2/revoke`;

            await this.makeHttpRequest(revokeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    token: config.accessToken!,
                }),
            });
        } catch (error) {
            // Log but don't throw - revocation is best effort
            console.error('Failed to revoke Salesforce tokens:', error);
        }
    }

    // Salesforce specific methods for handling webhooks
    async handleIncomingWebhook(payload: SalesforceWebhookPayload): Promise<SyncEvent> {
        return {
            id: `sf_${payload.data.event.replayId}_${Date.now()}`,
            integrationId: '', // Will be set by the caller
            eventType: this.mapEventTypeToSyncEvent(payload.eventType),
            entityId: payload.data.payload.Id || '',
            entityType: payload.sobjectType.toLowerCase(),
            data: payload.data.payload,
            timestamp: new Date(),
            processed: false,
        };
    }

    private mapEventTypeToSyncEvent(eventType: string): SyncEventType {
        const mapping: Record<string, SyncEventType> = {
            'created': SyncEventType.CONTACT_CREATED,
            'updated': SyncEventType.CONTACT_UPDATED,
            'deleted': SyncEventType.DOCUMENT_DECLINED, // Map to declined as closest equivalent
        };

        return mapping[eventType] || SyncEventType.CONTACT_CREATED;
    }

    // OAuth flow helpers
    generateAuthUrl(config: SalesforceConfig, redirectUri: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.clientId,
            redirect_uri: redirectUri,
            scope: 'full refresh_token',
            prompt: 'consent',
        });

        return `${config.instanceUrl}/services/oauth2/authorize?${params.toString()}`;
    }

    async exchangeCodeForTokens(config: SalesforceConfig, code: string, redirectUri: string): Promise<{
        accessToken: string;
        refreshToken: string;
        instanceUrl: string;
    }> {
        try {
            const tokenUrl = `${config.instanceUrl}/services/oauth2/token`;

            const response = await this.makeHttpRequest(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    redirect_uri: redirectUri,
                    code: code,
                }),
            });

            const tokenData = await response.json();

            return {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                instanceUrl: tokenData.instance_url,
            };
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }
}