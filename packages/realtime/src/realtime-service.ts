import { EventEmitter } from 'eventemitter3';
import WebSocket from 'ws';
import Redis from 'ioredis';
import { WebSocketManager } from './websocket-manager';
import { SSEManager } from './sse-manager';
import { ConflictResolver } from './conflict-resolver';
import {
    RealtimeEvent,
    DocumentUpdateEvent,
    SignatureStatusEvent,
    NotificationEvent,
    UserPresenceEvent,
    ScalingConfig,
    RealtimeMetrics,
    Subscription
} from './types';

// Simple logger implementation
const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

export class RealtimeService extends EventEmitter {
    private wsManager: WebSocketManager;
    private sseManager: SSEManager;
    private conflictResolver: ConflictResolver;
    private redisClient?: Redis;
    private redisSubscriber?: Redis;
    private isInitialized = false;

    constructor(private config: ScalingConfig) {
        super();

        this.wsManager = new WebSocketManager(config);
        this.sseManager = new SSEManager();
        this.conflictResolver = new ConflictResolver();

        this.setupEventHandlers();
    }

    /**
     * Initialize the real-time service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        // Initialize Redis if clustering is enabled
        if (this.config.redisCluster.enabled) {
            await this.initializeRedis();
        }

        this.isInitialized = true;
        logger.info('Real-time service initialized', {
            redisEnabled: this.config.redisCluster.enabled,
            maxConnections: this.config.maxConnectionsPerServer,
        });
    }

    /**
     * Handle WebSocket connection
     */
    handleWebSocketConnection(
        socket: WebSocket,
        userId: string,
        organizationId: string,
        metadata: Record<string, any> = {}
    ): string {
        return this.wsManager.addConnection(socket, userId, organizationId, metadata);
    }

    /**
     * Handle Server-Sent Events connection
     */
    handleSSEConnection(
        response: any,
        userId: string,
        organizationId: string
    ): string {
        return this.sseManager.addConnection(response, userId, organizationId);
    }

    /**
     * Emit document update event
     */
    async emitDocumentUpdate(event: DocumentUpdateEvent): Promise<void> {
        const realtimeEvent: RealtimeEvent = {
            id: this.generateEventId(),
            type: 'document_updated',
            payload: {
                documentId: event.documentId,
                type: event.type,
                changes: event.changes,
                userId: event.userId,
            },
            userId: event.userId,
            organizationId: event.organizationId,
            timestamp: event.timestamp,
        };

        await this.handleDocumentUpdate(realtimeEvent);
    }

    /**
     * Emit signature status update
     */
    async emitSignatureStatusUpdate(event: SignatureStatusEvent): Promise<void> {
        const realtimeEvent: RealtimeEvent = {
            id: this.generateEventId(),
            type: 'signature_completed',
            payload: {
                signingRequestId: event.signingRequestId,
                documentId: event.documentId,
                recipientId: event.recipientId,
                status: event.status,
                signatureData: event.signatureData,
            },
            userId: event.userId,
            organizationId: event.organizationId,
            timestamp: event.timestamp,
        };

        await this.broadcastEvent(realtimeEvent);
    }

    /**
     * Emit notification
     */
    async emitNotification(event: NotificationEvent): Promise<void> {
        const realtimeEvent: RealtimeEvent = {
            id: this.generateEventId(),
            type: 'notification',
            payload: {
                id: event.id,
                title: event.title,
                message: event.message,
                type: event.type,
                priority: event.priority,
                actionUrl: event.actionUrl,
                expiresAt: event.expiresAt,
            },
            userId: event.userId,
            organizationId: event.organizationId,
            timestamp: event.timestamp,
        };

        // Send to specific user
        await this.broadcastEvent(realtimeEvent, (connection) =>
            'userId' in connection && connection.userId === event.userId
        );
    }

    /**
     * Emit user presence update
     */
    async emitUserPresence(event: UserPresenceEvent): Promise<void> {
        const realtimeEvent: RealtimeEvent = {
            id: this.generateEventId(),
            type: 'user_presence',
            payload: {
                userId: event.userId,
                status: event.status,
                lastSeen: event.lastSeen,
                currentDocument: event.currentDocument,
                metadata: event.metadata,
            },
            userId: event.userId,
            organizationId: event.organizationId,
            timestamp: new Date(),
        };

        // Broadcast to organization members
        await this.broadcastEvent(realtimeEvent, (connection) =>
            connection.organizationId === event.organizationId
        );
    }

    /**
     * Emit organization activity
     */
    async emitOrganizationActivity(
        organizationId: string,
        activityType: string,
        payload: Record<string, any>,
        userId?: string
    ): Promise<void> {
        const realtimeEvent: RealtimeEvent = {
            id: this.generateEventId(),
            type: 'organization_activity',
            payload: {
                activityType,
                ...payload,
            },
            userId,
            organizationId,
            timestamp: new Date(),
        };

        // Broadcast to organization members
        await this.broadcastEvent(realtimeEvent, (connection) =>
            connection.organizationId === organizationId
        );
    }

    /**
     * Subscribe to events via WebSocket
     */
    subscribeWebSocket(
        connectionId: string,
        subscription: Omit<Subscription, 'id' | 'createdAt'>
    ): string {
        return this.wsManager.subscribe(connectionId, subscription);
    }

    /**
     * Subscribe to events via SSE
     */
    subscribeSSE(
        connectionId: string,
        subscription: Omit<Subscription, 'id' | 'createdAt'>
    ): string {
        return this.sseManager.subscribe(connectionId, subscription);
    }

    /**
     * Unsubscribe from WebSocket events
     */
    unsubscribeWebSocket(connectionId: string, subscriptionId: string): void {
        this.wsManager.unsubscribe(connectionId, subscriptionId);
    }

    /**
     * Unsubscribe from SSE events
     */
    unsubscribeSSE(connectionId: string, subscriptionId: string): void {
        this.sseManager.unsubscribe(connectionId, subscriptionId);
    }

    /**
     * Get real-time metrics
     */
    getMetrics(): RealtimeMetrics & { sseConnections: number; sseSubscriptions: number } {
        const wsMetrics = this.wsManager.getMetrics();
        return {
            ...wsMetrics,
            sseConnections: this.sseManager.getConnectionCount(),
            sseSubscriptions: this.sseManager.getSubscriptionCount(),
        };
    }

    /**
     * Get conflict statistics
     */
    getConflictStatistics() {
        return this.conflictResolver.getConflictStatistics();
    }

    /**
     * Resolve document conflicts
     */
    async resolveConflicts(
        documentId: string,
        resolution: 'merge' | 'overwrite' | 'reject' | 'manual',
        resolvedBy: string
    ): Promise<void> {
        const activeConflicts = this.conflictResolver.getActiveConflicts(documentId);
        if (!activeConflicts) {
            throw new Error('No active conflicts found for document');
        }

        const resolvedConflict = await this.conflictResolver.resolveConflicts(
            documentId,
            activeConflicts.conflicts.map(c => ({
                field: c.field,
                currentValue: c.currentValue,
                incomingValue: c.incomingValue,
                userId: c.userId,
                timestamp: c.timestamp,
            })),
            resolution,
            resolvedBy
        );

        // Emit conflict resolution event
        const realtimeEvent: RealtimeEvent = {
            id: this.generateEventId(),
            type: 'document_updated',
            payload: {
                documentId,
                type: 'conflict_resolved',
                resolution: resolvedConflict,
            },
            organizationId: activeConflicts.conflicts[0]?.userId || '',
            timestamp: new Date(),
        };

        await this.broadcastEvent(realtimeEvent);
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        this.wsManager.cleanup();
        this.sseManager.cleanup();

        if (this.redisClient) {
            await this.redisClient.quit();
        }
        if (this.redisSubscriber) {
            await this.redisSubscriber.quit();
        }

        logger.info('Real-time service cleaned up');
    }

    /**
     * Handle document updates with conflict resolution
     */
    private async handleDocumentUpdate(event: RealtimeEvent): Promise<void> {
        await this.wsManager.handleDocumentUpdate(event);
        await this.sseManager.broadcast(event, (connection) =>
            connection.organizationId === event.organizationId
        );
    }

    /**
     * Broadcast event to all connections
     */
    private async broadcastEvent(
        event: RealtimeEvent,
        filter?: (connection: any) => boolean
    ): Promise<void> {
        // Broadcast via WebSocket
        await this.wsManager.broadcast(event, filter);

        // Broadcast via SSE
        await this.sseManager.broadcast(event, filter);

        // Publish to Redis for scaling
        if (this.redisClient && this.config.redisCluster.enabled) {
            await this.redisClient.publish('realtime_events', JSON.stringify(event));
        }
    }

    /**
     * Set up event handlers
     */
    private setupEventHandlers(): void {
        // WebSocket manager events
        this.wsManager.on('connection_added', (connection) => {
            this.emit('ws_connection_added', connection);
        });

        this.wsManager.on('connection_removed', (connection) => {
            this.emit('ws_connection_removed', connection);
        });

        this.wsManager.on('metrics_updated', (metrics) => {
            this.emit('metrics_updated', metrics);
        });

        // SSE manager events
        this.sseManager.on('connection_added', (connection) => {
            this.emit('sse_connection_added', connection);
        });

        this.sseManager.on('connection_removed', (connection) => {
            this.emit('sse_connection_removed', connection);
        });
    }

    /**
     * Initialize Redis for scaling
     */
    private async initializeRedis(): Promise<void> {
        try {
            // Create Redis client for publishing
            this.redisClient = new Redis({
                host: this.config.redisCluster.nodes[0]?.split(':')[0] || 'localhost',
                port: parseInt(this.config.redisCluster.nodes[0]?.split(':')[1] || '6379'),
                ...this.config.redisCluster.options,
            });

            // Create Redis subscriber for receiving events from other servers
            this.redisSubscriber = new Redis({
                host: this.config.redisCluster.nodes[0]?.split(':')[0] || 'localhost',
                port: parseInt(this.config.redisCluster.nodes[0]?.split(':')[1] || '6379'),
                ...this.config.redisCluster.options,
            });

            // Subscribe to real-time events
            await this.redisSubscriber.subscribe('realtime_events');

            this.redisSubscriber.on('message', async (channel, message) => {
                if (channel === 'realtime_events') {
                    try {
                        const event: RealtimeEvent = JSON.parse(message);
                        // Re-broadcast to local connections (avoid infinite loop)
                        await this.wsManager.broadcast(event);
                        await this.sseManager.broadcast(event);
                    } catch (error) {
                        logger.error('Failed to process Redis event', {
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    }
                }
            });

            logger.info('Redis initialized for real-time scaling');
        } catch (error) {
            logger.error('Failed to initialize Redis', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
}