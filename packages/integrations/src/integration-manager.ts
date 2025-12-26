import {
    IntegrationConfig,
    IntegrationService,
    IntegrationStatus,
    SyncEvent,
    IntegrationType,
    IntegrationError,
    SyncError
} from './types';
import { ZapierIntegration } from './zapier/zapier-integration';
import { Microsoft365Integration } from './microsoft365/microsoft365-integration';
import { GoogleWorkspaceIntegration } from './google/google-workspace-integration';
import { SalesforceIntegration } from './salesforce/salesforce-integration';

export class IntegrationManager {
    private integrations: Map<IntegrationType, IntegrationService>;

    constructor() {
        this.integrations = new Map<IntegrationType, IntegrationService>([
            [IntegrationType.ZAPIER, new ZapierIntegration()],
            [IntegrationType.MICROSOFT_365, new Microsoft365Integration()],
            [IntegrationType.GOOGLE_WORKSPACE, new GoogleWorkspaceIntegration()],
            [IntegrationType.SALESFORCE, new SalesforceIntegration()],
        ]);
    }

    /**
     * Get integration service by type
     */
    getIntegration(type: IntegrationType): IntegrationService {
        const integration = this.integrations.get(type);
        if (!integration) {
            throw new IntegrationError(
                `Integration type ${type} not supported`,
                type,
                'UNSUPPORTED_TYPE'
            );
        }
        return integration;
    }

    /**
     * Authenticate an integration
     */
    async authenticate(config: IntegrationConfig): Promise<boolean> {
        try {
            const integration = this.getIntegration(config.type);
            return await integration.authenticate(config);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new IntegrationError(
                `Authentication failed for ${config.type}: ${errorMessage}`,
                config.type,
                'AUTH_FAILED',
                error
            );
        }
    }

    /**
     * Sync events to an integration
     */
    async sync(config: IntegrationConfig, events: SyncEvent[]): Promise<void> {
        try {
            const integration = this.getIntegration(config.type);
            await integration.sync(config, events);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new SyncError(
                config.type,
                `Sync failed: ${errorMessage}`,
                error
            );
        }
    }

    /**
     * Sync events to multiple integrations
     */
    async syncToMultiple(configs: IntegrationConfig[], events: SyncEvent[]): Promise<{
        successful: IntegrationType[];
        failed: Array<{ type: IntegrationType; error: Error }>;
    }> {
        const successful: IntegrationType[] = [];
        const failed: Array<{ type: IntegrationType; error: Error }> = [];

        await Promise.allSettled(
            configs.map(async (config) => {
                try {
                    await this.sync(config, events);
                    successful.push(config.type);
                } catch (error) {
                    failed.push({
                        type: config.type,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            })
        );

        return { successful, failed };
    }

    /**
     * Validate integration configuration
     */
    async validateConfig(config: Partial<IntegrationConfig>): Promise<boolean> {
        if (!config.type) {
            throw new IntegrationError(
                'Integration type is required',
                IntegrationType.ZAPIER, // Default type for error
                'MISSING_TYPE'
            );
        }

        try {
            const integration = this.getIntegration(config.type);
            return await integration.validateConfig(config);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new IntegrationError(
                `Config validation failed for ${config.type}: ${errorMessage}`,
                config.type,
                'VALIDATION_FAILED',
                error
            );
        }
    }

    /**
     * Get status of an integration
     */
    async getStatus(config: IntegrationConfig): Promise<IntegrationStatus> {
        try {
            const integration = this.getIntegration(config.type);
            return await integration.getStatus(config);
        } catch (error) {
            return IntegrationStatus.ERROR;
        }
    }

    /**
     * Get status of multiple integrations
     */
    async getMultipleStatus(configs: IntegrationConfig[]): Promise<Map<string, IntegrationStatus>> {
        const statusMap = new Map<string, IntegrationStatus>();

        await Promise.allSettled(
            configs.map(async (config) => {
                try {
                    const status = await this.getStatus(config);
                    statusMap.set(config.id, status);
                } catch (error) {
                    statusMap.set(config.id, IntegrationStatus.ERROR);
                }
            })
        );

        return statusMap;
    }

    /**
     * Disconnect an integration
     */
    async disconnect(config: IntegrationConfig): Promise<void> {
        try {
            const integration = this.getIntegration(config.type);
            await integration.disconnect(config);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new IntegrationError(
                `Disconnect failed for ${config.type}: ${errorMessage}`,
                config.type,
                'DISCONNECT_FAILED',
                error
            );
        }
    }

    /**
     * Test integration connectivity
     */
    async testConnection(config: IntegrationConfig): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }> {
        try {
            const isAuthenticated = await this.authenticate(config);
            const status = await this.getStatus(config);

            return {
                success: isAuthenticated && status === IntegrationStatus.ACTIVE,
                message: isAuthenticated
                    ? 'Connection successful'
                    : 'Authentication failed',
                details: { status, authenticated: isAuthenticated },
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                details: error,
            };
        }
    }

    /**
     * Get supported integration types
     */
    getSupportedTypes(): IntegrationType[] {
        return Array.from(this.integrations.keys());
    }

    /**
     * Check if integration type is supported
     */
    isTypeSupported(type: IntegrationType): boolean {
        return this.integrations.has(type);
    }

    /**
     * Batch process events for multiple integrations
     */
    async batchSync(
        configs: IntegrationConfig[],
        events: SyncEvent[],
        options: {
            maxConcurrency?: number;
            retryAttempts?: number;
            retryDelay?: number;
        } = {}
    ): Promise<{
        successful: Array<{ type: IntegrationType; eventCount: number }>;
        failed: Array<{ type: IntegrationType; error: Error; eventCount: number }>;
    }> {
        const { maxConcurrency = 3, retryAttempts = 2, retryDelay = 1000 } = options;

        const successful: Array<{ type: IntegrationType; eventCount: number }> = [];
        const failed: Array<{ type: IntegrationType; error: Error; eventCount: number }> = [];

        // Process integrations in batches to respect concurrency limits
        const batches = this.createBatches(configs, maxConcurrency);

        for (const batch of batches) {
            await Promise.allSettled(
                batch.map(async (config) => {
                    let lastError: Error | null = null;

                    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
                        try {
                            await this.sync(config, events);
                            successful.push({
                                type: config.type,
                                eventCount: events.length,
                            });
                            return;
                        } catch (error) {
                            lastError = error instanceof Error ? error : new Error(String(error));

                            if (attempt < retryAttempts) {
                                await this.delay(retryDelay * (attempt + 1));
                            }
                        }
                    }

                    failed.push({
                        type: config.type,
                        error: lastError!,
                        eventCount: events.length,
                    });
                })
            );
        }

        return { successful, failed };
    }

    private createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}