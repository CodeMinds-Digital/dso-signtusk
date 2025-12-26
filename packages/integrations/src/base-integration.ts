import {
    IntegrationConfig,
    IntegrationService,
    IntegrationStatus,
    SyncEvent,
    IntegrationError,
    IntegrationType
} from './types';

export abstract class BaseIntegration implements IntegrationService {
    protected readonly integrationType: IntegrationType;

    constructor(integrationType: IntegrationType) {
        this.integrationType = integrationType;
    }

    abstract authenticate(config: IntegrationConfig): Promise<boolean>;
    abstract sync(config: IntegrationConfig, events: SyncEvent[]): Promise<void>;
    abstract validateConfig(config: Partial<IntegrationConfig>): Promise<boolean>;
    abstract getStatus(config: IntegrationConfig): Promise<IntegrationStatus>;
    abstract disconnect(config: IntegrationConfig): Promise<void>;

    protected handleError(error: any, context: string): never {
        if (error instanceof IntegrationError) {
            throw error;
        }

        throw new IntegrationError(
            `${context}: ${error.message || 'Unknown error'}`,
            this.integrationType,
            error.code,
            error
        );
    }

    protected async makeHttpRequest(
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            this.handleError(error, 'HTTP Request failed');
        }
    }

    protected async refreshAccessToken(config: IntegrationConfig): Promise<string> {
        // This method should be overridden by specific integrations that support token refresh
        throw new IntegrationError(
            'Token refresh not implemented',
            this.integrationType,
            'NOT_IMPLEMENTED'
        );
    }

    protected validateRequiredFields(config: any, requiredFields: string[]): void {
        const missingFields = requiredFields.filter(field => !config[field]);
        if (missingFields.length > 0) {
            throw new IntegrationError(
                `Missing required fields: ${missingFields.join(', ')}`,
                this.integrationType,
                'MISSING_FIELDS'
            );
        }
    }
}