import { EventEmitter } from 'events';
import { z } from 'zod';

// Enterprise Service Bus Types
export enum MessageType {
    COMMAND = 'command',
    EVENT = 'event',
    QUERY = 'query',
    REPLY = 'reply',
    NOTIFICATION = 'notification',
}

export enum RoutingStrategy {
    DIRECT = 'direct',
    TOPIC = 'topic',
    FANOUT = 'fanout',
    HEADERS = 'headers',
    RPC = 'rpc',
}

export enum DeliveryGuarantee {
    AT_MOST_ONCE = 'at_most_once',
    AT_LEAST_ONCE = 'at_least_once',
    EXACTLY_ONCE = 'exactly_once',
}

export enum MessagePriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3,
}

// Message Schema
export const ESBMessageSchema = z.object({
    id: z.string(),
    type: z.nativeEnum(MessageType),
    source: z.string(),
    destination: z.string().optional(),
    routingKey: z.string(),
    headers: z.record(z.string()),
    payload: z.record(z.any()),
    metadata: z.object({
        correlationId: z.string().optional(),
        replyTo: z.string().optional(),
        timestamp: z.date(),
        expiration: z.date().optional(),
        priority: z.nativeEnum(MessagePriority).default(MessagePriority.NORMAL),
        retryCount: z.number().default(0),
        maxRetries: z.number().default(3),
        deliveryGuarantee: z.nativeEnum(DeliveryGuarantee).default(DeliveryGuarantee.AT_LEAST_ONCE),
    }),
    version: z.string().default('1.0'),
});

export type ESBMessage = z.infer<typeof ESBMessageSchema>;

// Exchange Configuration
export const ExchangeConfigSchema = z.object({
    name: z.string(),
    type: z.nativeEnum(RoutingStrategy),
    durable: z.boolean().default(true),
    autoDelete: z.boolean().default(false),
    arguments: z.record(z.any()).default({}),
});

export type ExchangeConfig = z.infer<typeof ExchangeConfigSchema>;

// Queue Configuration
export const QueueConfigSchema = z.object({
    name: z.string(),
    durable: z.boolean().default(true),
    exclusive: z.boolean().default(false),
    autoDelete: z.boolean().default(false),
    arguments: z.record(z.any()).default({}),
    maxLength: z.number().optional(),
    messageTtl: z.number().optional(),
    deadLetterExchange: z.string().optional(),
});

export type QueueConfig = z.infer<typeof QueueConfigSchema>;

// Binding Configuration
export const BindingConfigSchema = z.object({
    exchange: z.string(),
    queue: z.string(),
    routingKey: z.string(),
    arguments: z.record(z.any()).default({}),
});

export type BindingConfig = z.infer<typeof BindingConfigSchema>;

// Service Registration
export const ServiceRegistrationSchema = z.object({
    serviceId: z.string(),
    serviceName: z.string(),
    version: z.string(),
    endpoints: z.array(z.object({
        name: z.string(),
        routingKey: z.string(),
        messageType: z.nativeEnum(MessageType),
        schema: z.record(z.any()).optional(),
    })),
    metadata: z.record(z.string()).default({}),
    healthCheckEndpoint: z.string().optional(),
    registrationTime: z.date(),
    lastHeartbeat: z.date(),
});

export type ServiceRegistration = z.infer<typeof ServiceRegistrationSchema>;

// Message Handler Interface
export interface MessageHandler {
    handle(message: ESBMessage): Promise<ESBMessage | void>;
    canHandle(message: ESBMessage): boolean;
    getHandlerName(): string;
    getRoutingKeys(): string[];
}

// Message Interceptor Interface
export interface MessageInterceptor {
    intercept(message: ESBMessage, direction: 'inbound' | 'outbound'): Promise<ESBMessage>;
    getInterceptorName(): string;
}

// Service Discovery Interface
export interface ServiceDiscovery {
    register(service: ServiceRegistration): Promise<void>;
    unregister(serviceId: string): Promise<void>;
    discover(serviceName: string): Promise<ServiceRegistration[]>;
    heartbeat(serviceId: string): Promise<void>;
    getHealthyServices(serviceName: string): Promise<ServiceRegistration[]>;
}

// Message Router Interface
export interface MessageRouter {
    route(message: ESBMessage): Promise<string[]>;
    addRoute(routingKey: string, destination: string): void;
    removeRoute(routingKey: string, destination?: string): void;
    getRoutes(): Map<string, string[]>;
}

// Enterprise Service Bus Implementation
export class EnterpriseServiceBus extends EventEmitter {
    private exchanges = new Map<string, ExchangeConfig>();
    private queues = new Map<string, QueueConfig>();
    private bindings = new Map<string, BindingConfig[]>();
    private handlers = new Map<string, MessageHandler[]>();
    private interceptors: MessageInterceptor[] = [];
    private serviceRegistry = new Map<string, ServiceRegistration>();
    private messageStore = new Map<string, ESBMessage>();
    private deadLetterQueue = new Map<string, ESBMessage>();
    private router: MessageRouter;
    private isStarted = false;

    constructor(private serviceDiscovery?: ServiceDiscovery) {
        super();
        this.router = new DefaultMessageRouter();
        this.setupDefaultInfrastructure();
    }

    // Lifecycle Management
    async start(): Promise<void> {
        if (this.isStarted) {
            return;
        }

        try {
            // Initialize default exchanges and queues
            await this.createDefaultInfrastructure();

            this.isStarted = true;
            this.emit('started');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isStarted) {
            return;
        }

        try {
            // Cleanup resources
            this.handlers.clear();
            this.interceptors = [];

            this.isStarted = false;
            this.emit('stopped');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    // Infrastructure Management
    async createExchange(config: ExchangeConfig): Promise<void> {
        this.exchanges.set(config.name, config);
        this.bindings.set(config.name, []);
        this.emit('exchangeCreated', config);
    }

    async deleteExchange(name: string): Promise<void> {
        this.exchanges.delete(name);
        this.bindings.delete(name);
        this.emit('exchangeDeleted', name);
    }

    async createQueue(config: QueueConfig): Promise<void> {
        this.queues.set(config.name, config);
        this.emit('queueCreated', config);
    }

    async deleteQueue(name: string): Promise<void> {
        this.queues.delete(name);
        this.emit('queueDeleted', name);
    }

    async bindQueue(binding: BindingConfig): Promise<void> {
        const exchangeBindings = this.bindings.get(binding.exchange) || [];
        exchangeBindings.push(binding);
        this.bindings.set(binding.exchange, exchangeBindings);
        this.emit('queueBound', binding);
    }

    async unbindQueue(binding: BindingConfig): Promise<void> {
        const exchangeBindings = this.bindings.get(binding.exchange) || [];
        const index = exchangeBindings.findIndex(b =>
            b.queue === binding.queue && b.routingKey === binding.routingKey
        );

        if (index !== -1) {
            exchangeBindings.splice(index, 1);
            this.emit('queueUnbound', binding);
        }
    }

    // Message Publishing
    async publish(message: ESBMessage, exchange?: string): Promise<void> {
        if (!this.isStarted) {
            throw new Error('Service bus is not started');
        }

        try {
            // Apply outbound interceptors
            let processedMessage = message;
            for (const interceptor of this.interceptors) {
                processedMessage = await interceptor.intercept(processedMessage, 'outbound');
            }

            // Store message for delivery guarantees
            if (processedMessage.metadata.deliveryGuarantee !== DeliveryGuarantee.AT_MOST_ONCE) {
                this.messageStore.set(processedMessage.id, processedMessage);
            }

            // Route message
            const targetExchange = exchange || this.getDefaultExchange(processedMessage);
            await this.routeMessage(processedMessage, targetExchange);

            this.emit('messagePublished', { message: processedMessage, exchange: targetExchange });
        } catch (error) {
            this.emit('publishError', { message, error });
            throw error;
        }
    }

    async publishBatch(messages: ESBMessage[], exchange?: string): Promise<void> {
        const publishPromises = messages.map(message => this.publish(message, exchange));
        await Promise.allSettled(publishPromises);
    }

    // Message Consumption
    subscribe(queueName: string, handler: MessageHandler): void {
        if (!this.handlers.has(queueName)) {
            this.handlers.set(queueName, []);
        }

        this.handlers.get(queueName)!.push(handler);
        this.emit('handlerSubscribed', { queue: queueName, handler: handler.getHandlerName() });
    }

    unsubscribe(queueName: string, handlerName: string): void {
        const queueHandlers = this.handlers.get(queueName);
        if (queueHandlers) {
            const index = queueHandlers.findIndex(h => h.getHandlerName() === handlerName);
            if (index !== -1) {
                queueHandlers.splice(index, 1);
                this.emit('handlerUnsubscribed', { queue: queueName, handler: handlerName });
            }
        }
    }

    // Request-Reply Pattern
    async request(message: ESBMessage, timeout: number = 30000): Promise<ESBMessage> {
        return new Promise((resolve, reject) => {
            const correlationId = message.metadata.correlationId || this.generateId();
            const replyQueue = `reply.${correlationId}`;

            // Set up temporary reply handler
            const replyHandler: MessageHandler = {
                handle: async (replyMessage: ESBMessage) => {
                    if (replyMessage.metadata.correlationId === correlationId) {
                        this.unsubscribe(replyQueue, 'TempReplyHandler');
                        resolve(replyMessage);
                    }
                },
                canHandle: (msg: ESBMessage) => msg.metadata.correlationId === correlationId,
                getHandlerName: () => 'TempReplyHandler',
                getRoutingKeys: () => [replyQueue],
            };

            this.subscribe(replyQueue, replyHandler);

            // Set timeout
            const timeoutHandle = setTimeout(() => {
                this.unsubscribe(replyQueue, 'TempReplyHandler');
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);

            // Send request with reply-to header
            const requestMessage: ESBMessage = {
                ...message,
                metadata: {
                    ...message.metadata,
                    correlationId,
                    replyTo: replyQueue,
                },
            };

            this.publish(requestMessage).catch(error => {
                clearTimeout(timeoutHandle);
                this.unsubscribe(replyQueue, 'TempReplyHandler');
                reject(error);
            });
        });
    }

    async reply(originalMessage: ESBMessage, replyPayload: any): Promise<void> {
        if (!originalMessage.metadata.replyTo || !originalMessage.metadata.correlationId) {
            throw new Error('Cannot reply to message without replyTo or correlationId');
        }

        const replyMessage: ESBMessage = {
            id: this.generateId(),
            type: MessageType.REPLY,
            source: 'esb',
            routingKey: originalMessage.metadata.replyTo,
            headers: {},
            payload: replyPayload,
            metadata: {
                correlationId: originalMessage.metadata.correlationId,
                timestamp: new Date(),
                priority: MessagePriority.NORMAL,
                retryCount: 0,
                maxRetries: 1,
                deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
            },
            version: '1.0',
        };

        await this.publish(replyMessage);
    }

    // Service Registration and Discovery
    async registerService(service: ServiceRegistration): Promise<void> {
        this.serviceRegistry.set(service.serviceId, service);

        if (this.serviceDiscovery) {
            await this.serviceDiscovery.register(service);
        }

        // Set up automatic handlers for service endpoints
        for (const endpoint of service.endpoints) {
            this.router.addRoute(endpoint.routingKey, service.serviceId);
        }

        this.emit('serviceRegistered', service);
    }

    async unregisterService(serviceId: string): Promise<void> {
        const service = this.serviceRegistry.get(serviceId);
        if (service) {
            this.serviceRegistry.delete(serviceId);

            if (this.serviceDiscovery) {
                await this.serviceDiscovery.unregister(serviceId);
            }

            // Remove routing entries
            for (const endpoint of service.endpoints) {
                this.router.removeRoute(endpoint.routingKey, serviceId);
            }

            this.emit('serviceUnregistered', serviceId);
        }
    }

    async discoverServices(serviceName: string): Promise<ServiceRegistration[]> {
        if (this.serviceDiscovery) {
            return await this.serviceDiscovery.discover(serviceName);
        }

        // Fallback to local registry
        return Array.from(this.serviceRegistry.values())
            .filter(service => service.serviceName === serviceName);
    }

    // Interceptors
    addInterceptor(interceptor: MessageInterceptor): void {
        this.interceptors.push(interceptor);
        this.emit('interceptorAdded', interceptor.getInterceptorName());
    }

    removeInterceptor(interceptorName: string): void {
        const index = this.interceptors.findIndex(i => i.getInterceptorName() === interceptorName);
        if (index !== -1) {
            this.interceptors.splice(index, 1);
            this.emit('interceptorRemoved', interceptorName);
        }
    }

    // Message Routing
    private async routeMessage(message: ESBMessage, exchangeName: string): Promise<void> {
        const exchange = this.exchanges.get(exchangeName);
        if (!exchange) {
            throw new Error(`Exchange ${exchangeName} not found`);
        }

        const bindings = this.bindings.get(exchangeName) || [];
        const matchingQueues = this.findMatchingQueues(message, exchange, bindings);

        if (matchingQueues.length === 0) {
            this.emit('messageUnroutable', { message, exchange: exchangeName });
            return;
        }

        // Deliver to matching queues
        const deliveryPromises = matchingQueues.map(queueName =>
            this.deliverToQueue(message, queueName)
        );

        await Promise.allSettled(deliveryPromises);
    }

    private findMatchingQueues(
        message: ESBMessage,
        exchange: ExchangeConfig,
        bindings: BindingConfig[]
    ): string[] {
        const matchingQueues: string[] = [];

        switch (exchange.type) {
            case RoutingStrategy.DIRECT:
                bindings.forEach(binding => {
                    if (binding.routingKey === message.routingKey) {
                        matchingQueues.push(binding.queue);
                    }
                });
                break;

            case RoutingStrategy.TOPIC:
                bindings.forEach(binding => {
                    if (this.matchTopicPattern(message.routingKey, binding.routingKey)) {
                        matchingQueues.push(binding.queue);
                    }
                });
                break;

            case RoutingStrategy.FANOUT:
                bindings.forEach(binding => {
                    matchingQueues.push(binding.queue);
                });
                break;

            case RoutingStrategy.HEADERS:
                bindings.forEach(binding => {
                    if (this.matchHeaders(message.headers, binding.arguments)) {
                        matchingQueues.push(binding.queue);
                    }
                });
                break;
        }

        return matchingQueues;
    }

    private async deliverToQueue(message: ESBMessage, queueName: string): Promise<void> {
        const queueHandlers = this.handlers.get(queueName) || [];
        const applicableHandlers = queueHandlers.filter(h => h.canHandle(message));

        if (applicableHandlers.length === 0) {
            this.emit('messageUnhandled', { message, queue: queueName });
            return;
        }

        // Apply inbound interceptors
        let processedMessage = message;
        for (const interceptor of this.interceptors) {
            processedMessage = await interceptor.intercept(processedMessage, 'inbound');
        }

        // Handle message with retry logic
        await this.handleMessageWithRetry(processedMessage, applicableHandlers);
    }

    private async handleMessageWithRetry(
        message: ESBMessage,
        handlers: MessageHandler[]
    ): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= message.metadata.maxRetries; attempt++) {
            try {
                const handlerPromises = handlers.map(handler => handler.handle(message));
                await Promise.all(handlerPromises);

                // Remove from message store on successful delivery
                this.messageStore.delete(message.id);
                this.emit('messageDelivered', message);
                return;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < message.metadata.maxRetries) {
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
                    await this.sleep(delay);

                    message.metadata.retryCount = attempt + 1;
                    this.emit('messageRetry', { message, attempt: attempt + 1, error: lastError });
                }
            }
        }

        // Move to dead letter queue after max retries
        this.deadLetterQueue.set(message.id, message);
        this.messageStore.delete(message.id);
        this.emit('messageDeadLettered', { message, error: lastError });
    }

    // Utility Methods
    private matchTopicPattern(routingKey: string, pattern: string): boolean {
        const routingParts = routingKey.split('.');
        const patternParts = pattern.split('.');

        if (patternParts.length > routingParts.length) {
            return false;
        }

        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const routingPart = routingParts[i];

            if (patternPart === '#') {
                return true; // # matches zero or more words
            } else if (patternPart === '*') {
                continue; // * matches exactly one word
            } else if (patternPart !== routingPart) {
                return false;
            }
        }

        return patternParts.length === routingParts.length;
    }

    private matchHeaders(messageHeaders: Record<string, string>, bindingArgs: Record<string, any>): boolean {
        const matchType = bindingArgs['x-match'] || 'all';

        if (matchType === 'all') {
            return Object.entries(bindingArgs).every(([key, value]) => {
                if (key === 'x-match') return true;
                return messageHeaders[key] === value;
            });
        } else if (matchType === 'any') {
            return Object.entries(bindingArgs).some(([key, value]) => {
                if (key === 'x-match') return false;
                return messageHeaders[key] === value;
            });
        }

        return false;
    }

    private getDefaultExchange(message: ESBMessage): string {
        switch (message.type) {
            case MessageType.COMMAND:
                return 'commands';
            case MessageType.EVENT:
                return 'events';
            case MessageType.QUERY:
                return 'queries';
            case MessageType.NOTIFICATION:
                return 'notifications';
            default:
                return 'default';
        }
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private setupDefaultInfrastructure(): void {
        // Default exchanges
        const defaultExchanges: ExchangeConfig[] = [
            { name: 'default', type: RoutingStrategy.DIRECT, durable: true, autoDelete: false, arguments: {} },
            { name: 'commands', type: RoutingStrategy.DIRECT, durable: true, autoDelete: false, arguments: {} },
            { name: 'events', type: RoutingStrategy.TOPIC, durable: true, autoDelete: false, arguments: {} },
            { name: 'queries', type: RoutingStrategy.DIRECT, durable: true, autoDelete: false, arguments: {} },
            { name: 'notifications', type: RoutingStrategy.FANOUT, durable: true, autoDelete: false, arguments: {} },
        ];

        defaultExchanges.forEach(exchange => {
            this.exchanges.set(exchange.name, exchange);
            this.bindings.set(exchange.name, []);
        });

        // Default queues
        const defaultQueues: QueueConfig[] = [
            { name: 'dead-letter', durable: true, exclusive: false, autoDelete: false, arguments: {} },
            { name: 'retry', durable: true, exclusive: false, autoDelete: false, arguments: {} },
        ];

        defaultQueues.forEach(queue => {
            this.queues.set(queue.name, queue);
        });
    }

    private async createDefaultInfrastructure(): Promise<void> {
        // Infrastructure is already set up in setupDefaultInfrastructure
        // This method can be extended for actual broker setup
    }

    // Health and Monitoring
    async getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        exchanges: number;
        queues: number;
        handlers: number;
        services: number;
        messagesInStore: number;
        deadLetterMessages: number;
    }> {
        const totalHandlers = Array.from(this.handlers.values())
            .reduce((sum, handlers) => sum + handlers.length, 0);

        return {
            status: this.isStarted ? 'healthy' : 'unhealthy',
            exchanges: this.exchanges.size,
            queues: this.queues.size,
            handlers: totalHandlers,
            services: this.serviceRegistry.size,
            messagesInStore: this.messageStore.size,
            deadLetterMessages: this.deadLetterQueue.size,
        };
    }

    getMetrics(): {
        messagesPublished: number;
        messagesDelivered: number;
        messagesRetried: number;
        messagesDeadLettered: number;
        activeServices: number;
    } {
        // In a real implementation, these would be tracked counters
        return {
            messagesPublished: 0,
            messagesDelivered: 0,
            messagesRetried: 0,
            messagesDeadLettered: this.deadLetterQueue.size,
            activeServices: this.serviceRegistry.size,
        };
    }
}

// Default Message Router Implementation
class DefaultMessageRouter implements MessageRouter {
    private routes = new Map<string, string[]>();

    async route(message: ESBMessage): Promise<string[]> {
        return this.routes.get(message.routingKey) || [];
    }

    addRoute(routingKey: string, destination: string): void {
        if (!this.routes.has(routingKey)) {
            this.routes.set(routingKey, []);
        }

        const destinations = this.routes.get(routingKey)!;
        if (!destinations.includes(destination)) {
            destinations.push(destination);
        }
    }

    removeRoute(routingKey: string, destination?: string): void {
        if (!destination) {
            this.routes.delete(routingKey);
            return;
        }

        const destinations = this.routes.get(routingKey);
        if (destinations) {
            const index = destinations.indexOf(destination);
            if (index !== -1) {
                destinations.splice(index, 1);

                if (destinations.length === 0) {
                    this.routes.delete(routingKey);
                }
            }
        }
    }

    getRoutes(): Map<string, string[]> {
        return new Map(this.routes);
    }
}

// Built-in Message Handlers
export class LoggingMessageHandler implements MessageHandler {
    constructor(
        private routingKeys: string[],
        private logger: (message: string) => void = console.log
    ) { }

    async handle(message: ESBMessage): Promise<void> {
        this.logger(`Message handled: ${message.type} - ${message.routingKey} from ${message.source}`);
    }

    canHandle(message: ESBMessage): boolean {
        return this.routingKeys.includes(message.routingKey);
    }

    getHandlerName(): string {
        return 'LoggingMessageHandler';
    }

    getRoutingKeys(): string[] {
        return [...this.routingKeys];
    }
}

export class EchoMessageHandler implements MessageHandler {
    constructor(private routingKeys: string[]) { }

    async handle(message: ESBMessage): Promise<ESBMessage> {
        return {
            ...message,
            id: `echo-${message.id}`,
            source: 'echo-handler',
            payload: {
                original: message.payload,
                echo: true,
                timestamp: new Date().toISOString(),
            },
        };
    }

    canHandle(message: ESBMessage): boolean {
        return this.routingKeys.includes(message.routingKey);
    }

    getHandlerName(): string {
        return 'EchoMessageHandler';
    }

    getRoutingKeys(): string[] {
        return [...this.routingKeys];
    }
}

// Built-in Message Interceptors
export class LoggingInterceptor implements MessageInterceptor {
    constructor(private logger: (message: string) => void = console.log) { }

    async intercept(message: ESBMessage, direction: 'inbound' | 'outbound'): Promise<ESBMessage> {
        this.logger(`${direction.toUpperCase()}: ${message.type} - ${message.routingKey}`);
        return message;
    }

    getInterceptorName(): string {
        return 'LoggingInterceptor';
    }
}

export class SecurityInterceptor implements MessageInterceptor {
    constructor(private allowedSources: Set<string>) { }

    async intercept(message: ESBMessage, direction: 'inbound' | 'outbound'): Promise<ESBMessage> {
        if (direction === 'inbound' && !this.allowedSources.has(message.source)) {
            throw new Error(`Unauthorized message source: ${message.source}`);
        }
        return message;
    }

    getInterceptorName(): string {
        return 'SecurityInterceptor';
    }
}

export class MetricsInterceptor implements MessageInterceptor {
    private metrics = new Map<string, number>();

    async intercept(message: ESBMessage, direction: 'inbound' | 'outbound'): Promise<ESBMessage> {
        const key = `${direction}:${message.type}:${message.routingKey}`;
        this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
        return message;
    }

    getInterceptorName(): string {
        return 'MetricsInterceptor';
    }

    getMetrics(): Map<string, number> {
        return new Map(this.metrics);
    }

    resetMetrics(): void {
        this.metrics.clear();
    }
}