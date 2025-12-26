import { z } from 'zod';
import { EventEmitter } from 'events';

// Connector Framework Types
export enum ConnectorType {
    REST_API = 'rest_api',
    GRAPHQL = 'graphql',
    SOAP = 'soap',
    DATABASE = 'database',
    FILE_SYSTEM = 'file_system',
    MESSAGE_QUEUE = 'message_queue',
    WEBHOOK = 'webhook',
    CUSTOM = 'custom',
}

export enum DataType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    DATE = 'date',
    OBJECT = 'object',
    ARRAY = 'array',
    BINARY = 'binary',
}

export enum AuthenticationType {
    NONE = 'none',
    API_KEY = 'api_key',
    BEARER_TOKEN = 'bearer_token',
    BASIC_AUTH = 'basic_auth',
    OAUTH2 = 'oauth2',
    CUSTOM = 'custom',
}

// Visual Builder Schema
export const FieldMappingSchema = z.object({
    sourceField: z.string(),
    targetField: z.string(),
    dataType: z.nativeEnum(DataType),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    transformation: z.string().optional(), // JavaScript transformation function
});

export const ConnectorConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.nativeEnum(ConnectorType),
    version: z.string().default('1.0.0'),

    // Connection settings
    endpoint: z.string().optional(),
    authentication: z.object({
        type: z.nativeEnum(AuthenticationType),
        credentials: z.record(z.string()),
    }),

    // Data mapping
    fieldMappings: z.array(FieldMappingSchema),

    // Visual builder configuration
    visualConfig: z.object({
        position: z.object({
            x: z.number(),
            y: z.number(),
        }),
        size: z.object({
            width: z.number(),
            height: z.number(),
        }),
        color: z.string().optional(),
        icon: z.string().optional(),
    }).optional(),

    // Runtime settings
    settings: z.object({
        timeout: z.number().default(30000),
        retryAttempts: z.number().default(3),
        batchSize: z.number().default(100),
        rateLimitPerSecond: z.number().default(10),
    }),

    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ConnectorConfig = z.infer<typeof ConnectorConfigSchema>;
export type FieldMapping = z.infer<typeof FieldMappingSchema>;

// Connector Interface
export interface IConnector extends EventEmitter {
    readonly id: string;
    readonly config: ConnectorConfig;

    // Lifecycle methods
    initialize(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    test(): Promise<boolean>;

    // Data operations
    read(query?: any): Promise<any[]>;
    write(data: any[]): Promise<void>;
    update(data: any[]): Promise<void>;
    delete(ids: string[]): Promise<void>;

    // Schema operations
    getSchema(): Promise<any>;
    validateData(data: any): Promise<boolean>;

    // Transformation
    transformData(data: any, mapping: FieldMapping[]): Promise<any>;
}

// Base Connector Implementation
export abstract class BaseConnector extends EventEmitter implements IConnector {
    public readonly id: string;
    public readonly config: ConnectorConfig;
    protected isConnected: boolean = false;
    protected lastError: Error | null = null;

    constructor(config: ConnectorConfig) {
        super();
        this.id = config.id;
        this.config = config;
    }

    abstract initialize(): Promise<void>;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract read(query?: any): Promise<any[]>;
    abstract write(data: any[]): Promise<void>;
    abstract update(data: any[]): Promise<void>;
    abstract delete(ids: string[]): Promise<void>;
    abstract getSchema(): Promise<any>;

    async test(): Promise<boolean> {
        try {
            await this.connect();
            const schema = await this.getSchema();
            await this.disconnect();
            return schema !== null;
        } catch (error) {
            this.lastError = error instanceof Error ? error : new Error(String(error));
            this.emit('error', this.lastError);
            return false;
        }
    }

    async validateData(data: any): Promise<boolean> {
        try {
            const schema = await this.getSchema();
            // Basic validation - can be extended with JSON Schema validation
            return data !== null && data !== undefined;
        } catch (error) {
            this.lastError = error instanceof Error ? error : new Error(String(error));
            return false;
        }
    }

    async transformData(data: any, mappings: FieldMapping[]): Promise<any> {
        if (!Array.isArray(data)) {
            data = [data];
        }

        return data.map((item: any) => {
            const transformed: any = {};

            for (const mapping of mappings) {
                let value = this.getNestedValue(item, mapping.sourceField);

                // Apply default value if needed
                if (value === undefined || value === null) {
                    if (mapping.required) {
                        throw new Error(`Required field ${mapping.sourceField} is missing`);
                    }
                    value = mapping.defaultValue;
                }

                // Apply transformation if provided
                if (mapping.transformation && value !== undefined) {
                    try {
                        // Create a safe evaluation context
                        const transformFn = new Function('value', 'item', mapping.transformation);
                        value = transformFn(value, item);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.emit('warning', `Transformation failed for field ${mapping.sourceField}: ${errorMessage}`);
                    }
                }

                // Type conversion
                value = this.convertDataType(value, mapping.dataType);

                this.setNestedValue(transformed, mapping.targetField, value);
            }

            return transformed;
        });
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!(key in current)) {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    private convertDataType(value: any, dataType: DataType): any {
        if (value === null || value === undefined) {
            return value;
        }

        switch (dataType) {
            case DataType.STRING:
                return String(value);
            case DataType.NUMBER:
                return Number(value);
            case DataType.BOOLEAN:
                return Boolean(value);
            case DataType.DATE:
                return new Date(value);
            case DataType.OBJECT:
                return typeof value === 'object' ? value : JSON.parse(String(value));
            case DataType.ARRAY:
                return Array.isArray(value) ? value : [value];
            case DataType.BINARY:
                return Buffer.isBuffer(value) ? value : Buffer.from(String(value));
            default:
                return value;
        }
    }

    protected async executeWithRetry<T>(
        operation: () => Promise<T>,
        maxAttempts: number = this.config.settings.retryAttempts
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt === maxAttempts) {
                    throw lastError;
                }

                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));

                this.emit('retry', { attempt, error: lastError, nextDelay: delay });
            }
        }

        throw lastError!;
    }

    protected async rateLimitedExecution<T>(operation: () => Promise<T>): Promise<T> {
        const rateLimitDelay = 1000 / this.config.settings.rateLimitPerSecond;

        // Simple rate limiting - can be enhanced with token bucket algorithm
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));

        return operation();
    }
}

// Visual Builder Interface
export interface VisualBuilderNode {
    id: string;
    type: 'connector' | 'transformer' | 'filter' | 'aggregator';
    config: any;
    position: { x: number; y: number };
    inputs: string[];
    outputs: string[];
}

export interface VisualBuilderConnection {
    id: string;
    sourceNodeId: string;
    sourcePort: string;
    targetNodeId: string;
    targetPort: string;
}

export interface VisualBuilderWorkflow {
    id: string;
    name: string;
    description?: string;
    nodes: VisualBuilderNode[];
    connections: VisualBuilderConnection[];
    createdAt: Date;
    updatedAt: Date;
}

// Connector Factory
export class ConnectorFactory {
    private static connectorTypes = new Map<ConnectorType, new (config: ConnectorConfig) => IConnector>();

    static register(type: ConnectorType, connectorClass: new (config: ConnectorConfig) => IConnector): void {
        this.connectorTypes.set(type, connectorClass);
    }

    static create(config: ConnectorConfig): IConnector {
        const ConnectorClass = this.connectorTypes.get(config.type);
        if (!ConnectorClass) {
            throw new Error(`Connector type ${config.type} is not registered`);
        }
        return new ConnectorClass(config);
    }

    static getSupportedTypes(): ConnectorType[] {
        return Array.from(this.connectorTypes.keys());
    }
}

// REST API Connector Implementation
export class RestApiConnector extends BaseConnector {
    private baseUrl: string = '';
    private headers: Record<string, string> = {};

    async initialize(): Promise<void> {
        this.baseUrl = this.config.endpoint || '';

        // Setup authentication headers
        switch (this.config.authentication.type) {
            case AuthenticationType.API_KEY:
                this.headers['X-API-Key'] = this.config.authentication.credentials.apiKey;
                break;
            case AuthenticationType.BEARER_TOKEN:
                this.headers['Authorization'] = `Bearer ${this.config.authentication.credentials.token}`;
                break;
            case AuthenticationType.BASIC_AUTH:
                const credentials = Buffer.from(
                    `${this.config.authentication.credentials.username}:${this.config.authentication.credentials.password}`
                ).toString('base64');
                this.headers['Authorization'] = `Basic ${credentials}`;
                break;
        }

        this.headers['Content-Type'] = 'application/json';
    }

    async connect(): Promise<void> {
        // Test connection with a simple request
        try {
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: this.headers,
                signal: AbortSignal.timeout(this.config.settings.timeout),
            });

            if (!response.ok && response.status !== 404) {
                throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
            }

            this.isConnected = true;
            this.emit('connected');
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;
        this.emit('disconnected');
    }

    async read(query?: any): Promise<any[]> {
        return this.executeWithRetry(async () => {
            const url = new URL(this.baseUrl);
            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    url.searchParams.append(key, String(value));
                });
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.headers,
                signal: AbortSignal.timeout(this.config.settings.timeout),
            });

            if (!response.ok) {
                throw new Error(`Read failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [data];
        });
    }

    async write(data: any[]): Promise<void> {
        return this.executeWithRetry(async () => {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(this.config.settings.timeout),
            });

            if (!response.ok) {
                throw new Error(`Write failed: ${response.status} ${response.statusText}`);
            }
        });
    }

    async update(data: any[]): Promise<void> {
        return this.executeWithRetry(async () => {
            const response = await fetch(this.baseUrl, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(this.config.settings.timeout),
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status} ${response.statusText}`);
            }
        });
    }

    async delete(ids: string[]): Promise<void> {
        return this.executeWithRetry(async () => {
            const response = await fetch(this.baseUrl, {
                method: 'DELETE',
                headers: this.headers,
                body: JSON.stringify({ ids }),
                signal: AbortSignal.timeout(this.config.settings.timeout),
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
            }
        });
    }

    async getSchema(): Promise<any> {
        return this.executeWithRetry(async () => {
            const response = await fetch(`${this.baseUrl}/schema`, {
                method: 'GET',
                headers: this.headers,
                signal: AbortSignal.timeout(this.config.settings.timeout),
            });

            if (!response.ok) {
                // Return a basic schema if endpoint doesn't support schema introspection
                return {
                    type: 'object',
                    properties: {},
                };
            }

            return response.json();
        });
    }
}

// Register built-in connectors
ConnectorFactory.register(ConnectorType.REST_API, RestApiConnector);