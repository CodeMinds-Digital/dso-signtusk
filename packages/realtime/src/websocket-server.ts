import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { RealtimeService } from './realtime-service';

// Simple logger implementation
const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

export interface WebSocketServerConfig {
    port?: number;
    host?: string;
    path?: string;
    maxConnections?: number;
    maxConnectionsPerServer?: number;
    pingInterval?: number;
    pongTimeout?: number;
}

export class RealtimeWebSocketServer {
    private wss: WebSocketServer;
    private realtimeService: RealtimeService;
    private connectionCount = 0;
    private pingInterval: NodeJS.Timeout | null = null;
    private config: WebSocketServerConfig;

    constructor(
        realtimeService: RealtimeService,
        config: WebSocketServerConfig = {}
    ) {
        this.realtimeService = realtimeService;
        this.config = config;

        const {
            port = 8080,
            host = 'localhost',
            path = '/ws',
            maxConnections = 10000,
            pingInterval = 30000,
            pongTimeout = 5000,
        } = config;

        this.wss = new WebSocketServer({
            port,
            host,
            path,
        });

        this.setupWebSocketServer();
        this.startPingInterval(pingInterval);

        logger.info('WebSocket server initialized', {
            port,
            host,
            path,
            maxConnections,
        });
    }

    /**
     * Start the WebSocket server
     */
    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.wss.on('listening', () => {
                const address = this.wss.address();
                logger.info('WebSocket server started', { address });
                resolve();
            });

            this.wss.on('error', (error) => {
                logger.error('WebSocket server error', { error: error.message });
                reject(error);
            });
        });
    }

    /**
     * Stop the WebSocket server
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }

            this.wss.close(() => {
                logger.info('WebSocket server stopped');
                resolve();
            });
        });
    }

    /**
     * Get connection count
     */
    getConnectionCount(): number {
        return this.connectionCount;
    }

    /**
     * Get server info
     */
    getServerInfo() {
        return {
            address: this.wss.address(),
            connectionCount: this.connectionCount,
            maxConnections: this.config.maxConnectionsPerServer || 10000,
        };
    }

    /**
     * Set up WebSocket server event handlers
     */
    private setupWebSocketServer(): void {
        this.wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
            this.handleConnection(socket, request);
        });

        this.wss.on('error', (error) => {
            logger.error('WebSocket server error', {
                error: error.message,
            });
        });

        this.wss.on('close', () => {
            logger.info('WebSocket server closed');
        });
    }

    /**
     * Handle new WebSocket connection
     */
    private handleConnection(socket: WebSocket, request: IncomingMessage): void {
        this.connectionCount++;

        try {
            // Parse connection parameters from URL
            const url = new URL(request.url || '', `http://${request.headers.host}`);
            const userId = url.searchParams.get('userId');
            const organizationId = url.searchParams.get('organizationId');
            const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');

            if (!userId || !organizationId) {
                logger.warn('WebSocket connection rejected: missing parameters', {
                    userId,
                    organizationId,
                    ip: request.socket.remoteAddress,
                });
                socket.close(1008, 'Missing userId or organizationId');
                this.connectionCount--;
                return;
            }

            // TODO: Validate token and extract user info
            // For now, we'll trust the provided userId and organizationId

            // Extract metadata from headers
            const metadata = {
                userAgent: request.headers['user-agent'],
                ip: request.socket.remoteAddress,
                origin: request.headers.origin,
                connectedAt: new Date(),
            };

            // Add connection to real-time service
            const connectionId = this.realtimeService.handleWebSocketConnection(
                socket,
                userId,
                organizationId,
                metadata
            );

            logger.info('WebSocket connection established', {
                connectionId,
                userId,
                organizationId,
                ip: request.socket.remoteAddress,
                userAgent: request.headers['user-agent'],
                totalConnections: this.connectionCount,
            });

            // Set up socket-specific handlers
            socket.on('close', (code, reason) => {
                this.connectionCount--;
                logger.info('WebSocket connection closed', {
                    connectionId,
                    userId,
                    organizationId,
                    code,
                    reason: reason.toString(),
                    totalConnections: this.connectionCount,
                });
            });

            socket.on('error', (error) => {
                logger.error('WebSocket connection error', {
                    connectionId,
                    userId,
                    organizationId,
                    error: error.message,
                });
            });

            // Send welcome message
            socket.send(JSON.stringify({
                type: 'welcome',
                connectionId,
                timestamp: new Date(),
                serverInfo: {
                    version: '1.0.0',
                    features: ['realtime_updates', 'conflict_resolution', 'presence'],
                },
            }));

        } catch (error) {
            logger.error('Failed to handle WebSocket connection', {
                error: error instanceof Error ? error.message : 'Unknown error',
                ip: request.socket.remoteAddress,
            });
            socket.close(1011, 'Internal server error');
            this.connectionCount--;
        }
    }

    /**
     * Start ping interval to keep connections alive
     */
    private startPingInterval(interval: number): void {
        this.pingInterval = setInterval(() => {
            this.wss.clients.forEach((socket) => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.ping();
                }
            });
        }, interval);
    }

    /**
     * Broadcast message to all connected clients
     */
    broadcast(message: any, filter?: (socket: WebSocket) => boolean): void {
        const messageStr = JSON.stringify(message);
        let sentCount = 0;
        let errorCount = 0;

        this.wss.clients.forEach((socket) => {
            if (socket.readyState === WebSocket.OPEN) {
                if (!filter || filter(socket)) {
                    try {
                        socket.send(messageStr);
                        sentCount++;
                    } catch (error) {
                        errorCount++;
                        logger.error('Failed to broadcast message to client', {
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    }
                }
            }
        });

        logger.debug('Broadcast completed', {
            totalClients: this.wss.clients.size,
            sent: sentCount,
            errors: errorCount,
        });
    }

    /**
     * Get all connected clients
     */
    getClients(): Set<WebSocket> {
        return this.wss.clients;
    }

    /**
     * Check if server is running
     */
    isRunning(): boolean {
        // WebSocketServer doesn't have readyState, check if it's listening
        return this.wss.address() !== null;
    }
}