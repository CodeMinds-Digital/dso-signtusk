// Main exports
export { RealtimeService } from './realtime-service';
export { WebSocketManager } from './websocket-manager';
export { SSEManager } from './sse-manager';
export { ConflictResolver } from './conflict-resolver';
export { RealtimeWebSocketServer } from './websocket-server';

// Type exports
export type {
    WebSocketConnection,
    SSEConnection,
    RealtimeEvent,
    DocumentUpdateEvent,
    SignatureStatusEvent,
    NotificationEvent,
    UserPresenceEvent,
    Subscription,
    WebSocketMessage,
    ConflictResolution,
    ScalingConfig,
    RealtimeMetrics,
    ConnectionManager,
    RealtimeEventEmitter,
} from './types';

export type { WebSocketServerConfig } from './websocket-server';

// Schema exports for validation
export {
    RealtimeEventSchema,
    DocumentUpdateEventSchema,
    SignatureStatusEventSchema,
    NotificationEventSchema,
    UserPresenceEventSchema,
    SubscriptionSchema,
    WebSocketMessageSchema,
    ConflictResolutionSchema,
} from './types';

// Utility functions
export const createRealtimeService = (config: import('./types').ScalingConfig) => {
    const { RealtimeService } = require('./realtime-service');
    return new RealtimeService(config);
};

export const createWebSocketServer = (
    realtimeService: import('./realtime-service').RealtimeService,
    config?: import('./websocket-server').WebSocketServerConfig
) => {
    const { RealtimeWebSocketServer } = require('./websocket-server');
    return new RealtimeWebSocketServer(realtimeService, config);
};

export const createDefaultConfig = (): import('./types').ScalingConfig => ({
    maxConnectionsPerServer: 10000,
    heartbeatInterval: 30000, // 30 seconds
    connectionTimeout: 300000, // 5 minutes
    messageQueueSize: 1000,
    redisCluster: {
        enabled: false,
        nodes: ['localhost:6379'],
        options: {},
    },
    loadBalancing: {
        strategy: 'round_robin',
        healthCheckInterval: 60000, // 1 minute
    },
});

// Re-export from realtime-service for convenience
export { RealtimeService as default } from './realtime-service';