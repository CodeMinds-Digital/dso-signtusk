import { EventEmitter } from 'eventemitter3';
import { SSEConnection, RealtimeEvent, Subscription } from './types';

// Simple logger implementation
const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

export class SSEManager extends EventEmitter {
    private connections = new Map<string, SSEConnection>();
    private subscriptions = new Map<string, Subscription>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.startCleanup();
    }

    /**
     * Add a new SSE connection
     */
    addConnection(
        response: any, // HTTP Response object
        userId: string,
        organizationId: string
    ): string {
        const connectionId = this.generateConnectionId();

        const connection: SSEConnection = {
            id: connectionId,
            userId,
            organizationId,
            response,
            subscriptions: new Set(),
            lastActivity: new Date(),
        };

        this.connections.set(connectionId, connection);

        // Set up SSE headers
        this.setupSSEHeaders(response);

        // Set up response event handlers
        this.setupResponseHandlers(connection);

        // Send initial connection event
        this.sendEvent(connection, {
            id: this.generateEventId(),
            type: 'system_announcement',
            payload: {
                message: 'Connected to real-time updates',
                connectionId,
            },
            organizationId,
            timestamp: new Date(),
        });

        logger.info('SSE connection added', {
            connectionId,
            userId,
            organizationId,
            totalConnections: this.connections.size,
        });

        this.emit('connection_added', connection);
        return connectionId;
    }

    /**
     * Remove an SSE connection
     */
    removeConnection(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        // Clean up subscriptions
        connection.subscriptions.forEach(subscriptionId => {
            this.subscriptions.delete(subscriptionId);
        });

        // Close the response if still open
        if (!connection.response.destroyed) {
            connection.response.end();
        }

        this.connections.delete(connectionId);

        logger.info('SSE connection removed', {
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
    getConnection(connectionId: string): SSEConnection | undefined {
        return this.connections.get(connectionId);
    }

    /**
     * Get all connections for a user
     */
    getConnectionsByUser(userId: string): SSEConnection[] {
        return Array.from(this.connections.values()).filter(conn => conn.userId === userId);
    }

    /**
     * Get all connections for an organization
     */
    getConnectionsByOrganization(organizationId: string): SSEConnection[] {
        return Array.from(this.connections.values()).filter(conn => conn.organizationId === organizationId);
    }

    /**
     * Broadcast event to connections
     */
    async broadcast(event: RealtimeEvent, filter?: (connection: SSEConnection) => boolean): Promise<void> {
        const connections = filter
            ? Array.from(this.connections.values()).filter(filter)
            : Array.from(this.connections.values());

        const promises = connections.map(async (connection) => {
            try {
                if (!connection.response.destroyed) {
                    this.sendEvent(connection, event);
                    connection.lastActivity = new Date();
                    return true;
                }
                return false;
            } catch (error) {
                logger.error('Failed to send SSE event to connection', {
                    connectionId: connection.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                this.removeConnection(connection.id);
                return false;
            }
        });

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const errorCount = results.length - successCount;

        logger.debug('SSE broadcast completed', {
            eventType: event.type,
            totalConnections: connections.length,
            successful: successCount,
            failed: errorCount,
        });
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

        // Send subscription confirmation
        this.sendEvent(connection, {
            id: this.generateEventId(),
            type: 'system_announcement',
            payload: {
                message: 'Subscription created',
                subscriptionId,
                subscriptionType: subscription.type,
            },
            organizationId: connection.organizationId,
            timestamp: new Date(),
        });

        logger.debug('SSE subscription created', {
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

        // Send unsubscription confirmation
        this.sendEvent(connection, {
            id: this.generateEventId(),
            type: 'system_announcement',
            payload: {
                message: 'Subscription removed',
                subscriptionId,
            },
            organizationId: connection.organizationId,
            timestamp: new Date(),
        });

        logger.debug('SSE subscription removed', {
            subscriptionId,
            connectionId,
        });
    }

    /**
     * Send keep-alive ping to all connections
     */
    sendKeepAlive(): void {
        this.connections.forEach((connection) => {
            if (!connection.response.destroyed) {
                try {
                    connection.response.write(': keep-alive\n\n');
                    connection.lastActivity = new Date();
                } catch (error) {
                    logger.error('Failed to send keep-alive', {
                        connectionId: connection.id,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    this.removeConnection(connection.id);
                }
            }
        });
    }

    /**
     * Get connection count
     */
    getConnectionCount(): number {
        return this.connections.size;
    }

    /**
     * Get subscription count
     */
    getSubscriptionCount(): number {
        return this.subscriptions.size;
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Close all connections
        this.connections.forEach(connection => {
            if (!connection.response.destroyed) {
                connection.response.end();
            }
        });

        this.connections.clear();
        this.subscriptions.clear();
    }

    /**
     * Set up SSE headers
     */
    private setupSSEHeaders(response: any): void {
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'Access-Control-Allow-Credentials': 'true',
        });
    }

    /**
     * Set up response event handlers
     */
    private setupResponseHandlers(connection: SSEConnection): void {
        connection.response.on('close', () => {
            this.removeConnection(connection.id);
        });

        connection.response.on('error', (error: Error) => {
            logger.error('SSE response error', {
                connectionId: connection.id,
                error: error.message,
            });
            this.removeConnection(connection.id);
        });
    }

    /**
     * Send event to specific connection
     */
    private sendEvent(connection: SSEConnection, event: RealtimeEvent): void {
        const eventData = {
            id: event.id,
            type: event.type,
            data: event.payload,
            timestamp: event.timestamp,
        };

        const sseData = [
            `id: ${event.id}`,
            `event: ${event.type}`,
            `data: ${JSON.stringify(eventData)}`,
            '', // Empty line to end the event
        ].join('\n') + '\n';

        connection.response.write(sseData);
    }

    /**
     * Start cleanup of stale connections
     */
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const staleConnections: string[] = [];
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            this.connections.forEach((connection, connectionId) => {
                if (connection.response.destroyed || connection.lastActivity < fiveMinutesAgo) {
                    staleConnections.push(connectionId);
                }
            });

            staleConnections.forEach(connectionId => {
                this.removeConnection(connectionId);
            });

            if (staleConnections.length > 0) {
                logger.info('Cleaned up stale SSE connections', {
                    count: staleConnections.length,
                    totalConnections: this.connections.size,
                });
            }

            // Send keep-alive to remaining connections
            this.sendKeepAlive();
        }, 30000); // Run every 30 seconds
    }

    /**
     * Generate unique connection ID
     */
    private generateConnectionId(): string {
        return `sse_${Date.now()}_${Math.random().toString(36).substring(7)}`;
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