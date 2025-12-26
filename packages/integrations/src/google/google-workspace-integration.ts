import { google } from 'googleapis';
import { BaseIntegration } from '../base-integration';
import {
    IntegrationConfig,
    IntegrationStatus,
    SyncEvent,
    GoogleWorkspaceConfig,
    GoogleWorkspaceWebhookPayload,
    IntegrationType,
    SyncEventType,
    AuthenticationError,
    SyncError
} from '../types';

export class GoogleWorkspaceIntegration extends BaseIntegration {
    private readonly OAUTH2_SCOPES = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
    ];

    constructor() {
        super(IntegrationType.GOOGLE_WORKSPACE);
    }

    async authenticate(config: IntegrationConfig): Promise<boolean> {
        const googleConfig = config as GoogleWorkspaceConfig;

        try {
            this.validateRequiredFields(googleConfig, ['clientId', 'clientSecret']);

            // If we have tokens, validate them
            if (googleConfig.accessToken) {
                return await this.validateAccessToken(googleConfig);
            }

            // Otherwise, we need to initiate OAuth flow
            return false;
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }

    async sync(config: IntegrationConfig, events: SyncEvent[]): Promise<void> {
        const googleConfig = config as GoogleWorkspaceConfig;

        try {
            const auth = await this.createAuthClient(googleConfig);

            for (const event of events) {
                if (googleConfig.driveEnabled) {
                    await this.syncToDrive(auth, googleConfig, event);
                }

                if (googleConfig.gmailEnabled) {
                    await this.syncToGmail(auth, googleConfig, event);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, errorMessage, error);
        }
    }

    async validateConfig(config: Partial<IntegrationConfig>): Promise<boolean> {
        try {
            const googleConfig = config as Partial<GoogleWorkspaceConfig>;

            // Validate required fields
            this.validateRequiredFields(googleConfig, ['clientId', 'clientSecret']);

            // Validate client ID format (should be a Google OAuth client ID)
            if (!googleConfig.clientId?.endsWith('.googleusercontent.com')) {
                throw new Error('Invalid Google client ID format');
            }

            // Validate at least one service is enabled
            if (!googleConfig.driveEnabled && !googleConfig.gmailEnabled) {
                throw new Error('At least one Google service (Drive or Gmail) must be enabled');
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
        const googleConfig = config as GoogleWorkspaceConfig;

        try {
            // Revoke tokens if available
            if (googleConfig.accessToken) {
                await this.revokeTokens(googleConfig);
            }
        } catch (error) {
            // Log error but don't throw - disconnection should always succeed
            console.error('Error during Google Workspace disconnection:', error);
        }
    }

    private async createAuthClient(config: GoogleWorkspaceConfig) {
        const oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            'urn:ietf:wg:oauth:2.0:oob' // For installed applications
        );

        if (config.accessToken) {
            oauth2Client.setCredentials({
                access_token: config.accessToken,
                refresh_token: config.refreshToken,
            });

            // Ensure token is valid
            try {
                await oauth2Client.getAccessToken();
            } catch (error) {
                if (config.refreshToken) {
                    const newToken = await this.refreshAccessToken(config);
                    oauth2Client.setCredentials({
                        access_token: newToken,
                        refresh_token: config.refreshToken,
                    });
                } else {
                    throw new AuthenticationError(this.integrationType, 'Token expired and no refresh token available');
                }
            }
        }

        return oauth2Client;
    }

    private async validateAccessToken(config: GoogleWorkspaceConfig): Promise<boolean> {
        try {
            const auth = await this.createAuthClient(config);

            // Test the token by making a simple API call
            const oauth2 = google.oauth2({ version: 'v2', auth });
            await oauth2.userinfo.get();

            return true;
        } catch (error) {
            return false;
        }
    }

    protected async refreshAccessToken(config: GoogleWorkspaceConfig): Promise<string> {
        try {
            const oauth2Client = new google.auth.OAuth2(
                config.clientId,
                config.clientSecret
            );

            oauth2Client.setCredentials({
                refresh_token: config.refreshToken,
            });

            const { credentials } = await oauth2Client.refreshAccessToken();
            return credentials.access_token!;
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }

    private async syncToDrive(auth: any, config: GoogleWorkspaceConfig, event: SyncEvent): Promise<void> {
        try {
            const drive = google.drive({ version: 'v3', auth });

            const fileMetadata = {
                name: `${event.entityType}_${event.entityId}_${event.timestamp.toISOString()}.json`,
                parents: config.driveId ? [config.driveId] : undefined,
            };

            const media = {
                mimeType: 'application/json',
                body: JSON.stringify(event.data, null, 2),
            };

            await drive.files.create({
                requestBody: fileMetadata,
                media: media,
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, `Drive sync failed: ${errorMessage}`, error);
        }
    }

    private async syncToGmail(auth: any, config: GoogleWorkspaceConfig, event: SyncEvent): Promise<void> {
        try {
            const gmail = google.gmail({ version: 'v1', auth });

            const emailContent = this.prepareEmailContent(event);

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: Buffer.from(emailContent).toString('base64url'),
                },
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(this.integrationType, `Gmail sync failed: ${errorMessage}`, error);
        }
    }

    private prepareEmailContent(event: SyncEvent): string {
        const eventTypeSubjects = {
            [SyncEventType.DOCUMENT_CREATED]: 'New Document Created',
            [SyncEventType.DOCUMENT_SIGNED]: 'Document Signed',
            [SyncEventType.DOCUMENT_COMPLETED]: 'Document Completed',
            [SyncEventType.DOCUMENT_DECLINED]: 'Document Declined',
            [SyncEventType.CONTACT_CREATED]: 'New Contact Created',
            [SyncEventType.CONTACT_UPDATED]: 'Contact Updated',
        };

        const subject = eventTypeSubjects[event.eventType] || 'Document Event';

        const emailBody = `
      <html>
        <body>
          <h2>${subject}</h2>
          <p><strong>Entity:</strong> ${event.entityType} (${event.entityId})</p>
          <p><strong>Time:</strong> ${event.timestamp.toLocaleString()}</p>
          <h3>Details:</h3>
          <pre>${JSON.stringify(event.data, null, 2)}</pre>
        </body>
      </html>
    `;

        return [
            'Content-Type: text/html; charset="UTF-8"',
            'MIME-Version: 1.0',
            `Subject: ${subject}`,
            'To: me', // Will be replaced with actual recipient
            '',
            emailBody,
        ].join('\r\n');
    }

    private async revokeTokens(config: GoogleWorkspaceConfig): Promise<void> {
        try {
            const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${config.accessToken}`;

            await this.makeHttpRequest(revokeUrl, {
                method: 'POST',
            });
        } catch (error) {
            // Log but don't throw - revocation is best effort
            console.error('Failed to revoke Google Workspace tokens:', error);
        }
    }

    // Google Workspace specific methods for handling webhooks
    async handleIncomingWebhook(payload: GoogleWorkspaceWebhookPayload): Promise<SyncEvent> {
        return {
            id: `google_${payload.resourceId}_${Date.now()}`,
            integrationId: '', // Will be set by the caller
            eventType: this.mapKindToEventType(payload.kind),
            entityId: payload.resourceId,
            entityType: this.extractEntityTypeFromKind(payload.kind),
            data: {
                resourceUri: payload.resourceUri,
                token: payload.token,
                expiration: payload.expiration,
            },
            timestamp: new Date(),
            processed: false,
        };
    }

    private mapKindToEventType(kind: string): SyncEventType {
        const mapping: Record<string, SyncEventType> = {
            'drive#file': SyncEventType.DOCUMENT_CREATED,
            'gmail#message': SyncEventType.CONTACT_UPDATED,
            'drive#change': SyncEventType.DOCUMENT_SIGNED,
        };

        return mapping[kind] || SyncEventType.DOCUMENT_CREATED;
    }

    private extractEntityTypeFromKind(kind: string): string {
        if (kind.includes('drive')) return 'document';
        if (kind.includes('gmail')) return 'message';
        if (kind.includes('contact')) return 'contact';
        return 'unknown';
    }

    // OAuth flow helpers
    generateAuthUrl(config: GoogleWorkspaceConfig): string {
        const oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            'urn:ietf:wg:oauth:2.0:oob'
        );

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.OAUTH2_SCOPES,
            prompt: 'consent',
        });
    }

    async exchangeCodeForTokens(config: GoogleWorkspaceConfig, code: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        try {
            const oauth2Client = new google.auth.OAuth2(
                config.clientId,
                config.clientSecret,
                'urn:ietf:wg:oauth:2.0:oob'
            );

            const { tokens } = await oauth2Client.getToken(code);

            return {
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token!,
            };
        } catch (error) {
            throw new AuthenticationError(this.integrationType, error);
        }
    }
}