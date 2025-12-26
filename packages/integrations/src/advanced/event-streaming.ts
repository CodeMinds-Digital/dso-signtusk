import { EventEmitter } from 'events';
import { z } from 'zod';

// Event Streaming Types
export enum EventType {
    DOCUMENT_CREATED = 'document.created',
    DOCUMENT_UPDATED = 'document.updated',
    DOCUMENT_SIGNED = 'document.signed',
    DOCUMENT_COMPLETED = 'document.completed',
    DOCUMENT_DECLINED = 'document.declined',
    DOCUMENT_EXPIRED = 'document.expired',
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    ORGANIZATION_CREATED = 'organization.created',
    ORGANIZATION_UPDATED = 'organization.updated',
    INTEGRATION_CONNECTED = 'integration.connected',
    INTEGRATION_DISCONNECTED = 'integration.disconnected',
    SYNC_STARTED = 'sync.started',
    SYNC_COMPLETED = 'sync.completed',
    SYNC_FAILED = 'sync.failed',
    CUSTOM = 'custom',
}

export enum EventPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum DeliveryMode {
    AT_MOST_ONCE = 'at_most_once',
    AT_LEAST_ONCE = 'at_least_once',
    EXACTLY_ONCE = 'exactly_once',
}

// Event Schema
export const StreamEventSchema = z.object({
    id: z.string(),
    type: z.nativeEnum(EventType),
    source: z.string(),
    subject: z.string(),
    data: z.record(z.any()),
    metadata: z.object({
        organizationId: z.string().optional(),
        userId: z.string().optional(),
        correlationId: z.string().optional(),
        causationId: z.string().optional(),
        version: z.string().default('1.0'),
        priority: z.nativeEnum(EventPriority).default(EventPriority.NORMAL),
        tags: z.array(z.string()).default([]),
    }),
    timestamp: z.date(),
    ttl: z.number().optional(), // Time to live in milliseconds
});

export type StreamEvent = z.infer<typeof StreamEventSchema>;

// Kafka Configuration
export const KafkaConfigSchema = z.object({
    brokers: z.array(z.string()),
    clientId: z.string(),
    groupId: z.string().optional(),
    ssl: z.boolean().default(false),
    sasl: z.object({
        mechanism: z.enum(['plain', 'scram-sha-256', 'scram-sha-512']),
        username: z.string(),
        password: z.string(),
    }).optional(),
    connectionTimeout: z.number().default(3000),
    requestTimeout: z.number().default(30000),
    retry: z.object({
        initialRetryTime: z.number().default(100),
        retries: z.number().default(8),
    }),
});

export type KafkaConfig = z.infer<typeof KafkaConfigSchema>;

// Topic Configuration
export const TopicConfigSchema = z.object({
    name: z.string(),
    partitions: z.number().default(1),
    replicationFactor: z.number().default(1),
    configs: z.record(z.string()).default({}),
});

export type TopicConfig = z.infer<typeof TopicConfigSchema>;

// Consumer Configuration
export const ConsumerConfigSchema = z.object({
    groupId: z.string(),
    topics: z.array(z.string()),
    fromBeginning: z.boolean().default(false),
    autoCommit: z.boolean().default(true),
    autoCommitInterval: z.number().default(5000),
    sessionTimeout: z.number().default(30000),
    heartbeatInterval: z.number().default(3000),
    maxBytesPerPartition: z.number().default(1048576),
    minBytes: z.number().default(1),
    maxBytes: z.number().default(10485760),
    maxWaitTimeInMs: z.number().default(5000),
    retry: z.object({
        initialRetryTime: z.number().default(100),
        retries: z.number().default(8),
    }),
});

export type ConsumerConfig = z.infer<typeof ConsumerConfigSchema>;

// Producer Configuration
export const ProducerConfigSchema = z.object({
    maxInFlightRequests: z.number().default(5),
    idempotent: z.boolean().default(false),
    transactionTimeout: z.number().default(30000),
    retry: z.object({
        initialRetryTime: z.number().default(100),
        retries: z.number().default(8),
    }),
    compression: z.enum(['none', 'gzip', 'snappy', 'lz4', 'zstd']).default('none'),
});

export type ProducerConfig = z.infer<typeof ProducerConfigSchema>;

// Event Handler Interface
export interface EventHandler {
    handle(event: StreamEvent): Promise<void>;
    canHandle(event: StreamEvent): boolean;
    getHandlerName(): string;
}

// Event Filter Interface
export interface EventFilter {
    filter(event: StreamEvent): boolean;
    getFilterName(): string;
}

// Event Transformer Interface
export interface EventTransformer {
    transform(event: StreamEvent): Promise<StreamEvent>;
    canTransform(event: StreamEvent): boolean;
    getTransformerName(): string;
}

// Mock Kafka Client (for demonstration - in production use kafkajs or similar)
interface KafkaMessage {
    key?: string;
    value: string;
    partition?: number;
    timestamp?: string;
    headers?: Record<string, string>;
}

interface KafkaProducer {
    send(record: {
        topic: string;
        messages: KafkaMessage[];
    }): Promise<void>;
    disconnect(): Promise<void>;
}

interface KafkaConsumer {
    subscribe(topics: { topics: string[]; fromBeginning?: boolean }): Promise<void>;
    run(config: {
        eachMessage: (payload: {
            topic: string;
            partition: number;
            message: KafkaMessage;
        }) => Promise<void>;
    }): Promise<void>;
    disconnect(): Promise<void>;
}

interface KafkaClient {
    producer(config?: ProducerConfig): KafkaProducer;
    consumer(config: ConsumerConfig): KafkaConsumer;
    admin(): {
        createTopics(configs: { topics: TopicConfig[] }): Promise<void>;
        deleteTopics(configs: { topics: string[] }): Promise<void>;
        listTopics(): Promise<string[]>;
        disconnect(): Promise<void>;
    };
}

// Mock Kafka implementation
class MockKafkaClient implements KafkaClient {
    private topics = new Set<string>();
    private messages = new Map<string, KafkaMessage[]>();

    producer(config?: ProducerConfig): KafkaProducer {
        return {
            send: async (record) => {
                if (!this.messages.has(record.topic)) {
                    this.messages.set(record.topic, []);
                }
                this.messages.get(record.topic)!.push(...record.messages);
            },
            disconnect: async () => { },
        };
    }

    consumer(config: ConsumerConfig): KafkaConsumer {
        return {
            subscribe: async (topics) => {
                // Mock subscription
            },
            run: async (runConfig) => {
                // Mock message consumption
                for (const topic of config.topics) {
                    const messages = this.messages.get(topic) || [];
                    for (const message of messages) {
                        await runConfig.eachMessage({
                            topic,
                            partition: 0,
                            message,
                        });
                    }
                }
            },
            disconnect: async () => { },
        };
    }

    admin() {
        return {
            createTopics: async (configs: { topics: Array<{ name: string }> }) => {
                configs.topics.forEach(topic => this.topics.add(topic.name));
            },
            deleteTopics: async (configs: { topics: string[] }) => {
                configs.topics.forEach(topic => this.topics.delete(topic));
            },
            listTopics: async () => Array.from(this.topics),
            disconnect: async () => { },
        };
    }
}

// Event Streaming Engine
export class EventStreamingEngine extends EventEmitter {
    private kafka: KafkaClient;
    private producer?: KafkaProducer;
    private consumers = new Map<string, KafkaConsumer>();
    private handlers = new Map<string, EventHandler[]>();
    private filters: EventFilter[] = [];
    private transformers: EventTransformer[] = [];
    private topics = new Set<string>();
    private isConnected = false;

    constructor(private config: KafkaConfig) {
        super();
        // In production, use actual Kafka client like kafkajs
        this.kafka = new MockKafkaClient();
    }

    // Connection Management
    async connect(): Promise<void> {
        try {
            this.producer = this.kafka.producer();
            this.isConnected = true;
            this.emit('connected');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.producer) {
                await this.producer.disconnect();
            }

            for (const consumer of this.consumers.values()) {
                await consumer.disconnect();
            }

            this.isConnected = false;
            this.emit('disconnected');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    // Topic Management
    async createTopic(config: TopicConfig): Promise<void> {
        try {
            const admin = this.kafka.admin();
            await admin.createTopics({ topics: [config] });
            await admin.disconnect();

            this.topics.add(config.name);
            this.emit('topicCreated', config.name);
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async deleteTopic(topicName: string): Promise<void> {
        try {
            const admin = this.kafka.admin();
            await admin.deleteTopics({ topics: [topicName] });
            await admin.disconnect();

            this.topics.delete(topicName);
            this.emit('topicDeleted', topicName);
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async listTopics(): Promise<string[]> {
        try {
            const admin = this.kafka.admin();
            const topics = await admin.listTopics();
            await admin.disconnect();
            return topics;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    // Event Publishing
    async publishEvent(event: StreamEvent, topic?: string): Promise<void> {
        if (!this.isConnected || !this.producer) {
            throw new Error('Event streaming engine is not connected');
        }

        try {
            // Apply transformers
            let transformedEvent = event;
            for (const transformer of this.transformers) {
                if (transformer.canTransform(transformedEvent)) {
                    transformedEvent = await transformer.transform(transformedEvent);
                }
            }

            // Apply filters
            for (const filter of this.filters) {
                if (!filter.filter(transformedEvent)) {
                    this.emit('eventFiltered', { event: transformedEvent, filter: filter.getFilterName() });
                    return;
                }
            }

            const targetTopic = topic || this.getTopicForEvent(transformedEvent);

            await this.producer.send({
                topic: targetTopic,
                messages: [{
                    key: transformedEvent.subject,
                    value: JSON.stringify(transformedEvent),
                    headers: {
                        eventType: transformedEvent.type,
                        priority: transformedEvent.metadata.priority,
                        organizationId: transformedEvent.metadata.organizationId || '',
                    },
                }],
            });

            this.emit('eventPublished', { event: transformedEvent, topic: targetTopic });
        } catch (error) {
            this.emit('publishError', { event, error });
            throw error;
        }
    }

    async publishBatch(events: StreamEvent[], topic?: string): Promise<void> {
        if (!this.isConnected || !this.producer) {
            throw new Error('Event streaming engine is not connected');
        }

        try {
            const messages: KafkaMessage[] = [];
            const processedEvents: StreamEvent[] = [];

            for (let event of events) {
                // Apply transformers
                for (const transformer of this.transformers) {
                    if (transformer.canTransform(event)) {
                        event = await transformer.transform(event);
                    }
                }

                // Apply filters
                let shouldInclude = true;
                for (const filter of this.filters) {
                    if (!filter.filter(event)) {
                        shouldInclude = false;
                        this.emit('eventFiltered', { event, filter: filter.getFilterName() });
                        break;
                    }
                }

                if (shouldInclude) {
                    messages.push({
                        key: event.subject,
                        value: JSON.stringify(event),
                        headers: {
                            eventType: event.type,
                            priority: event.metadata.priority,
                            organizationId: event.metadata.organizationId || '',
                        },
                    });
                    processedEvents.push(event);
                }
            }

            if (messages.length > 0) {
                const targetTopic = topic || this.getTopicForEvent(processedEvents[0]);

                await this.producer.send({
                    topic: targetTopic,
                    messages,
                });

                this.emit('batchPublished', { events: processedEvents, topic: targetTopic });
            }
        } catch (error) {
            this.emit('publishError', { events, error });
            throw error;
        }
    }

    // Event Consumption
    async subscribe(consumerConfig: ConsumerConfig): Promise<void> {
        try {
            const consumer = this.kafka.consumer(consumerConfig);

            await consumer.subscribe({
                topics: consumerConfig.topics,
                fromBeginning: consumerConfig.fromBeginning,
            });

            await consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const event: StreamEvent = JSON.parse(message.value);
                        await this.handleEvent(event, topic);
                    } catch (error) {
                        this.emit('messageProcessingError', { topic, partition, message, error });
                    }
                },
            });

            this.consumers.set(consumerConfig.groupId, consumer);
            this.emit('subscribed', consumerConfig);
        } catch (error) {
            this.emit('subscriptionError', { consumerConfig, error });
            throw error;
        }
    }

    async unsubscribe(groupId: string): Promise<void> {
        const consumer = this.consumers.get(groupId);
        if (consumer) {
            await consumer.disconnect();
            this.consumers.delete(groupId);
            this.emit('unsubscribed', groupId);
        }
    }

    // Event Handling
    registerHandler(eventType: string, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
        this.emit('handlerRegistered', { eventType, handler: handler.getHandlerName() });
    }

    unregisterHandler(eventType: string, handlerName: string): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const index = handlers.findIndex(h => h.getHandlerName() === handlerName);
            if (index !== -1) {
                handlers.splice(index, 1);
                this.emit('handlerUnregistered', { eventType, handler: handlerName });
            }
        }
    }

    private async handleEvent(event: StreamEvent, topic: string): Promise<void> {
        const handlers = this.handlers.get(event.type) || [];
        const applicableHandlers = handlers.filter(h => h.canHandle(event));

        if (applicableHandlers.length === 0) {
            this.emit('unhandledEvent', { event, topic });
            return;
        }

        const handlerPromises = applicableHandlers.map(async (handler) => {
            try {
                await handler.handle(event);
                this.emit('eventHandled', { event, handler: handler.getHandlerName() });
            } catch (error) {
                this.emit('handlerError', { event, handler: handler.getHandlerName(), error });
            }
        });

        await Promise.allSettled(handlerPromises);
    }

    // Filters and Transformers
    addFilter(filter: EventFilter): void {
        this.filters.push(filter);
        this.emit('filterAdded', filter.getFilterName());
    }

    removeFilter(filterName: string): void {
        const index = this.filters.findIndex(f => f.getFilterName() === filterName);
        if (index !== -1) {
            this.filters.splice(index, 1);
            this.emit('filterRemoved', filterName);
        }
    }

    addTransformer(transformer: EventTransformer): void {
        this.transformers.push(transformer);
        this.emit('transformerAdded', transformer.getTransformerName());
    }

    removeTransformer(transformerName: string): void {
        const index = this.transformers.findIndex(t => t.getTransformerName() === transformerName);
        if (index !== -1) {
            this.transformers.splice(index, 1);
            this.emit('transformerRemoved', transformerName);
        }
    }

    // Utility Methods
    private getTopicForEvent(event: StreamEvent): string {
        // Default topic routing based on event type
        const eventCategory = event.type.split('.')[0];
        return `docusign-${eventCategory}-events`;
    }

    // Health Check
    async healthCheck(): Promise<{
        connected: boolean;
        topics: number;
        consumers: number;
        handlers: number;
        filters: number;
        transformers: number;
    }> {
        return {
            connected: this.isConnected,
            topics: this.topics.size,
            consumers: this.consumers.size,
            handlers: Array.from(this.handlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
            filters: this.filters.length,
            transformers: this.transformers.length,
        };
    }
}

// Built-in Event Handlers
export class LoggingEventHandler implements EventHandler {
    constructor(private logger: (message: string) => void = console.log) { }

    async handle(event: StreamEvent): Promise<void> {
        this.logger(`Event handled: ${event.type} - ${event.subject} at ${event.timestamp.toISOString()}`);
    }

    canHandle(event: StreamEvent): boolean {
        return true; // Log all events
    }

    getHandlerName(): string {
        return 'LoggingEventHandler';
    }
}

export class MetricsEventHandler implements EventHandler {
    private metrics = new Map<string, number>();

    async handle(event: StreamEvent): Promise<void> {
        const key = `${event.type}:${event.metadata.priority}`;
        this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    }

    canHandle(event: StreamEvent): boolean {
        return true;
    }

    getHandlerName(): string {
        return 'MetricsEventHandler';
    }

    getMetrics(): Map<string, number> {
        return new Map(this.metrics);
    }

    resetMetrics(): void {
        this.metrics.clear();
    }
}

// Built-in Event Filters
export class OrganizationEventFilter implements EventFilter {
    constructor(private allowedOrganizations: Set<string>) { }

    filter(event: StreamEvent): boolean {
        if (!event.metadata.organizationId) {
            return true; // Allow events without organization ID
        }
        return this.allowedOrganizations.has(event.metadata.organizationId);
    }

    getFilterName(): string {
        return 'OrganizationEventFilter';
    }
}

export class PriorityEventFilter implements EventFilter {
    constructor(private minPriority: EventPriority) { }

    filter(event: StreamEvent): boolean {
        const priorityOrder = {
            [EventPriority.LOW]: 0,
            [EventPriority.NORMAL]: 1,
            [EventPriority.HIGH]: 2,
            [EventPriority.CRITICAL]: 3,
        };

        return priorityOrder[event.metadata.priority] >= priorityOrder[this.minPriority];
    }

    getFilterName(): string {
        return 'PriorityEventFilter';
    }
}

// Built-in Event Transformers
export class EventEnrichmentTransformer implements EventTransformer {
    constructor(private enrichmentData: Record<string, any>) { }

    async transform(event: StreamEvent): Promise<StreamEvent> {
        return {
            ...event,
            data: {
                ...event.data,
                ...this.enrichmentData,
            },
        };
    }

    canTransform(event: StreamEvent): boolean {
        return true;
    }

    getTransformerName(): string {
        return 'EventEnrichmentTransformer';
    }
}

export class EventRedactionTransformer implements EventTransformer {
    constructor(private fieldsToRedact: string[]) { }

    async transform(event: StreamEvent): Promise<StreamEvent> {
        const redactedData = { ...event.data };

        for (const field of this.fieldsToRedact) {
            if (field in redactedData) {
                redactedData[field] = '[REDACTED]';
            }
        }

        return {
            ...event,
            data: redactedData,
        };
    }

    canTransform(event: StreamEvent): boolean {
        return this.fieldsToRedact.some(field => field in event.data);
    }

    getTransformerName(): string {
        return 'EventRedactionTransformer';
    }
}