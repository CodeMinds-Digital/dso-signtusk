import WebSocket from 'ws';
import { EventEmitter } from 'eventemitter3';
import {
    WebSocketConnection,
    WebSocketMessage,
    RealtimeEvent,
    Subscription,
    ScalingConfig,
    RealtimeMetrics,
    WebSocketMessageSchema
} from './types';
import { ConflictResolver } from './conflict-resolver';

// Simple logger implementation
const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

export class WebSocketManager extends EventEmitter {
    private connections = new Map<string, WebSocketConnection>();
    private subscriptions = new Map<string, Subscription>();
    private conflictResolver: ConflictResolver;
    private metrics: RealtimeMetrics;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(
        private config: ScalingConfig,
        private redisClient?: any
    ) {
        super();
        this.conflictResolver = new ConflictResolver();
        this.metrics = {
            activeConnections: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            errorRate: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            subscriptionCount: 0,
            eventQueueSize: 0,
        };

        this.startHeartbeat();
        this.startCleanup();
        this.startMetricsCollection();
    }

    /**
     * Add a new WebSocket connection
     */
    addConnection(socket: WebSocket, userId: string, organizationId: string, metadata: Record<string, any> = {}): string {
        const connectionId = this.generateConnectionId();

        const connection: WebSocketConnection = {
            id: connectionId,
            userId,
            organizationId,
            socket,
            subscriptions: new Set(),
            lastActivity: new Date(),
            metadata,
        };

        this.connections.set(connectionId, connection);
        this.metrics.activeConnections = this.connections.size;

        // Set up socket event handlers
        this.setupSocketHandlers(connection);

        logger.info('WebSocket connection added', {
            connectionId,
            userId,
            organizationId,
            totalConnections: this.connections.size,
        });

        this.emit('connection_added', connection);
        return connectionId;
    }

    /**
     * Remove a WebSocket connection
     */
    removeConnection(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        // Clean up subscriptions
        connection.subscriptions.forEach(subscriptionId => {
            this.subscriptions.delete(subscriptionId);
        });

        // Close socket if still open
        if (connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.close();
        }

        this.connections.delete(connectionId);
        this.metrics.activeConnections = this.connections.size;
        this.metrics.subscriptionCount = this.subscriptions.size;

        logger.info('WebSocket connection removed', {
            connectionId,
            userId: connection.userId,
            organizationId: connection.organizationId,
            totalConnections: this.connections.size,
        });

        this.emit('connection_removed', connection);
    }

    /**
     * Get connection by ID
     */
    getConnection(connectionId: string): WebSocketConnection | undefined {
        return this.connections.get(connectionId);
    }

    /**
     * Get all connections for a user
     */
    getConnectionsByUser(userId: string): WebSocketConnection[] {
        return Array.from(this.connections.values()).filter(conn => conn.userId === userId);
    }

    /**
     * Get all connections for an organization
     */
    getConnectionsByOrganization(organizationId: string): WebSocketConnection[] {
        return Array.from(this.connections.values()).filter(conn => conn.organizationId === organizationId);
    }

    /**
     * Broadcast event to connections
     */
    async broadcast(event: RealtimeEvent, filter?: (connection: WebSocketConnection) => boolean): Promise<void> {
        const connections = filter
            ? Array.from(this.connections.values()).filter(filter)
            : Array.from(this.connections.values());

        const message = {
            type: 'event' as const,
            event,
        };

        const promises = connections.map(async (connection) => {
            try {
                if (connection.socket.readyState === WebSocket.OPEN) {
                    connection.socket.send(JSON.stringify(message));
                    connection.lastActivity = new Date();
                    return true;
                }
                return false;
            } catch (error) {
                logger.error('Failed to send message to connection', {
                    connectionId: connection.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                return false;
            }
        });

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const errorCount = results.length - successCount;

        if (errorCount > 0) {
            this.metrics.errorRate = (this.metrics.errorRate + errorCount / results.length) / 2;
        }

        logger.debug('Broadcast completed', {
            eventType: event.type,
            totalConnections: connections.length,
            successful: successCount,
            failed: errorCount,
        });

        // Publish to Redis for scaling across multiple servers
        if (this.redisClient && this.config.redisCluster.enabled) {
            await this.publishToRedis(event);
        }
    }

    /**
     * Subscribe to events
     */
    subscribe(connectionId: string, subscription: Omit<Subscription, 'id' | 'createdAt'>): string {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        const subscriptionId = this.generateSubscriptionId();
        const fullSubscription: Subscription = {
            ...subscription,
            id: subscriptionId,
            createdAt: new Date(),
        };

        this.subscriptions.set(subscriptionId, fullSubscription);
        connection.subscriptions.add(subscriptionId);
        this.metrics.subscriptionCount = this.subscriptions.size;

        logger.debug('Subscription created', {
            subscriptionId,
            connectionId,
            type: subscription.type,
            userId: subscription.userId,
            organizationId: subscription.organizationId,
        });

        return subscriptionId;
    }

    /**
     * Unsubscribe from events
     */
    unsubscribe(connectionId: string, subscriptionId: string): void {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        connection.subscriptions.delete(subscriptionId);
        this.subscriptions.delete(subscriptionId);
        this.metrics.subscriptionCount = this.subscriptions.size;

        logger.debug('Subscription removed', {
            subscriptionId,
            connectionId,
        });
    }

    /**
     * Handle document updates with conflict resolution
     */
    async handleDocumentUpdate(event: RealtimeEvent): Promise<void> {
        // Check for conflicts if this is a document update
        if (event.type === 'document_updated' && event.payload.changes) {
            const conflicts = await this.conflictResolver.detectConflicts(
                event.payload.documentId,
                event.payload.changes,
                event.userId || '',
                new Date()
            );

            if (conflicts.length > 0) {
                // Emit conflict event
                const conflictEvent: RealtimeEvent = {
                    id: this.generateEventId(),
                    type: 'document_updated',
                    payload: {
                        documentId: event.payload.documentId,
                        conflicts,
                        requiresResolution: true,
                    },
                    organizationId: event.organizationId,
                    timestamp: new Date(),
                };

                await this.broadcast(conflictEvent, (conn) =>
                    conn.organizationId === event.organizationId
                );
                return;
            }
        }

        // Broadcast the update
        await this.broadcast(event, (conn) => {
            // Filter based on subscriptions
            const relevantSubscriptions = Array.from(conn.subscriptions)
                .map(subId => this.subscriptions.get(subId))
                .filter(Boolean) as Subscription[];

            return relevantSubscriptions.some(sub =>
                this.isEventRelevantToSubscription(event, sub)
            );
        });
    }

    /**
     * Get current metrics
     */
    getMetrics(): RealtimeMetrics {
        return { ...this.metrics };
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Close all connections
        this.connections.forEach(connection => {
            if (connection.socket.readyState === WebSocket.OPEN) {
                connection.socket.close();
            }
        });

        this.connections.clear();
        this.subscriptions.clear();
    }

    /**
     * Set up socket event handlers
     */
    private setupSocketHandlers(connection: WebSocketConnection): void {
        connection.socket.on('message', async (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString());
                const validatedMessage = WebSocketMessageSchema.parse(message);

                connection.lastActivity = new Date();
                await this.handleSocketMessage(connection, validatedMessage);
            } catch (error) {
                logger.error('Invalid WebSocket message', {
                    connectionId: connection.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });

                connection.socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format',
                }));
            }
        });

        connection.socket.on('close', () => {
            this.removeConnection(connection.id);
        });

        connection.socket.on('error', (error: Error) => {
            logger.error('WebSocket error', {
                connectionId: connection.id,
                error: error.message,
            });
            this.removeConnection(connection.id);
        });

        // Send initial connection confirmation
        connection.socket.send(JSON.stringify({
            type: 'connected',
            connectionId: connection.id,
            timestamp: new Date(),
        }));
    }

    /**
     * Handle incoming WebSocket messages
     */
    private async handleSocketMessage(connection: WebSocketConnection, message: WebSocketMessage): Promise<void> {
        switch (message.type) {
            case 'subscribe':
                const subscriptionId = this.subscribe(connection.id, {
                    ...message.subscription,
                    userId: connection.userId,
                    organizationId: connection.organizationId,
                });

                connection.socket.send(JSON.stringify({
                    type: 'subscribed',
                    subscriptionId,
                    subscription: message.subscription,
                }));
                break;

            case 'unsubscribe':
                this.unsubscribe(connection.id, message.subscriptionId);

                connection.socket.send(JSON.stringify({
                    type: 'unsubscribed',
                    subscriptionId: message.subscriptionId,
                }));
                break;

            case 'ping':
                connection.socket.send(JSON.stringify({
                    type: 'pong',
                    timestamp: new Date(),
                }));
                break;

            default:
                logger.warn('Unknown WebSocket message type', {
                    connectionId: connection.id,
                    messageType: (message as any).type,
                });
        }
    }

    /**
     * Check if event is relevant to subscription
     */
    private isEventRelevantToSubscription(event: RealtimeEvent, subscription: Subscription): boolean {
        // Check subscription type
        const typeMap: Record<string, string[]> = {
            'document_updates': ['document_updated', 'document_signed', 'document_completed', 'document_deleted'],
            'signing_updates': ['signing_request_created', 'signing_request_updated', 'signature_completed', 'signature_declined'],
            'notifications': ['notification'],
            'organization_activity': ['organization_activity'],
            'team_updates': ['team_update'],
            'user_presence': ['user_presence'],
            'system_announcements': ['system_announcement'],
        };

        const relevantTypes = typeMap[subscription.type] || [];
        if (!relevantTypes.includes(event.type)) {
            return false;
        }

        // Check filters
        if (subscription.filters) {
            const { documentId, signingRequestId, teamId, userId, eventTypes } = subscription.filters;

            if (documentId && event.payload.documentId !== documentId) return false;
            if (signingRequestId && event.payload.signingRequestId !== signingRequestId) return false;
            if (teamId && event.payload.teamId !== teamId) return false;
            if (userId && event.userId !== userId) return false;
            if (eventTypes && !eventTypes.includes(event.type)) return false;
        }

        return true;
    }

    /**
     * Start heartbeat to keep connections alive
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const timeoutMs = this.config.connectionTimeout;

            this.connections.forEach((connection, connectionId) => {
                const timeSinceActivity = now.getTime() - connection.lastActivity.getTime();

                if (timeSinceActivity > timeoutMs) {
                    logger.info('Connection timed out', {
                        connectionId,
                        userId: connection.userId,
                        timeSinceActivity,
                    });
                    this.removeConnection(connectionId);
                } else if (connection.socket.readyState === WebSocket.OPEN) {
                    // Send ping
                    connection.socket.send(JSON.stringify({
                        type: 'ping',
                        timestamp: now,
                    }));
                }
            });
        }, this.config.heartbeatInterval);
    }

    /**
     * Start cleanup of stale connections
     */
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const staleConnections: string[] = [];

            this.connections.forEach((connection, connectionId) => {
                if (connection.socket.readyState === WebSocket.CLOSED ||
                    connection.socket.readyState === WebSocket.CLOSING) {
                    staleConnections.push(connectionId);
                }
            });

            staleConnections.forEach(connectionId => {
                this.removeConnection(connectionId);
            });

            if (staleConnections.length > 0) {
                logger.info('Cleaned up stale connections', {
                    count: staleConnections.length,
                    totalConnections: this.connections.size,
                });
            }
        }, 30000); // Run every 30 seconds
    }

    /**
     * Start metrics collection
     */
    private startMetricsCollection(): void {
        setInterval(() => {
            this.metrics.activeConnections = this.connections.size;
            this.metrics.subscriptionCount = this.subscriptions.size;
            this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

            // Emit metrics for monitoring
            this.emit('metrics_updated', this.metrics);
        }, 5000); // Update every 5 seconds
    }

    /**
     * Publish event to Redis for scaling
     */
    private async publishToRedis(event: RealtimeEvent): Promise<void> {
        if (!this.redisClient) return;

        try {
            await this.redisClient.publish('realtime_events', JSON.stringify(event));
        } catch (error) {
            logger.error('Failed to publish to Redis', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    /**
     * Generate unique connection ID
     */
    private generateConnectionId(): string {
        return `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Generate unique subscription ID
     */
    private generateSubscriptionId(): string {
        return `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
}