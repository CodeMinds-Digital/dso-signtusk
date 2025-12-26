import { z } from 'zod';

// WebSocket connection types
export interface WebSocketConnection {
    id: string;
    userId: string;
    organizationId: string;
    socket: any; // WebSocket instance
    subscriptions: Set<string>;
    lastActivity: Date;
    metadata: Record<string, any>;
}

// Real-time event types
export const RealtimeEventSchema = z.object({
    id: z.string(),
    type: z.enum([
        'document_updated',
        'document_signed',
        'document_completed',
        'document_deleted',
        'signing_request_created',
        'signing_request_updated',
        'signature_completed',
        'signature_declined',
        'notification',
        'organization_activity',
        'team_update',
        'user_presence',
        'system_announcement'
    ]),
    payload: z.record(z.any()),
    userId: z.string().optional(),
    organizationId: z.string(),
    timestamp: z.date(),
    metadata: z.record(z.any()).optional(),
});

export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

// Document update events
export const DocumentUpdateEventSchema = z.object({
    documentId: z.string(),
    type: z.enum(['created', 'updated', 'deleted', 'signed', 'completed']),
    changes: z.record(z.any()).optional(),
    userId: z.string(),
    organizationId: z.string(),
    timestamp: z.date(),
});

export type DocumentUpdateEvent = z.infer<typeof DocumentUpdateEventSchema>;

// Signature status events
export const SignatureStatusEventSchema = z.object({
    signingRequestId: z.string(),
    documentId: z.string(),
    recipientId: z.string(),
    status: z.enum(['pending', 'signed', 'declined', 'expired']),
    signatureData: z.object({
        signedAt: z.date().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        location: z.object({
            latitude: z.number(),
            longitude: z.number(),
        }).optional(),
    }).optional(),
    userId: z.string(),
    organizationId: z.string(),
    timestamp: z.date(),
});

export type SignatureStatusEvent = z.infer<typeof SignatureStatusEventSchema>;

// Notification events
export const NotificationEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.enum(['info', 'success', 'warning', 'error']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    userId: z.string(),
    organizationId: z.string(),
    actionUrl: z.string().optional(),
    expiresAt: z.date().optional(),
    timestamp: z.date(),
});

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;

// User presence events
export const UserPresenceEventSchema = z.object({
    userId: z.string(),
    organizationId: z.string(),
    status: z.enum(['online', 'offline', 'away', 'busy']),
    lastSeen: z.date(),
    currentDocument: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export type UserPresenceEvent = z.infer<typeof UserPresenceEventSchema>;

// Subscription types
export const SubscriptionSchema = z.object({
    id: z.string(),
    type: z.enum([
        'document_updates',
        'signing_updates',
        'notifications',
        'organization_activity',
        'team_updates',
        'user_presence',
        'system_announcements'
    ]),
    filters: z.object({
        documentId: z.string().optional(),
        signingRequestId: z.string().optional(),
        teamId: z.string().optional(),
        userId: z.string().optional(),
        eventTypes: z.array(z.string()).optional(),
    }).optional(),
    userId: z.string(),
    organizationId: z.string(),
    createdAt: z.date(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// WebSocket message types
export const WebSocketMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('subscribe'),
        subscription: SubscriptionSchema.omit({ id: true, userId: true, organizationId: true, createdAt: true }),
    }),
    z.object({
        type: z.literal('unsubscribe'),
        subscriptionId: z.string(),
    }),
    z.object({
        type: z.literal('ping'),
        timestamp: z.date(),
    }),
    z.object({
        type: z.literal('event'),
        event: RealtimeEventSchema,
    }),
]);

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Server-sent events types
export interface SSEConnection {
    id: string;
    userId: string;
    organizationId: string;
    response: any; // HTTP Response object
    subscriptions: Set<string>;
    lastActivity: Date;
}

// Connection management types
export interface ConnectionManager {
    addConnection(connection: WebSocketConnection | SSEConnection): void;
    removeConnection(connectionId: string): void;
    getConnection(connectionId: string): WebSocketConnection | SSEConnection | undefined;
    getConnectionsByUser(userId: string): (WebSocketConnection | SSEConnection)[];
    getConnectionsByOrganization(organizationId: string): (WebSocketConnection | SSEConnection)[];
    broadcast(event: RealtimeEvent, filter?: (connection: WebSocketConnection | SSEConnection) => boolean): void;
    cleanup(): void;
}

// Event emitter types
export interface RealtimeEventEmitter {
    emit(event: RealtimeEvent): void;
    subscribe(subscription: Subscription, callback: (event: RealtimeEvent) => void): string;
    unsubscribe(subscriptionId: string): void;
    getActiveSubscriptions(): Subscription[];
}

// Conflict resolution types
export const ConflictResolutionSchema = z.object({
    documentId: z.string(),
    conflictType: z.enum(['concurrent_edit', 'version_mismatch', 'field_collision']),
    conflicts: z.array(z.object({
        field: z.string(),
        currentValue: z.any(),
        incomingValue: z.any(),
        userId: z.string(),
        timestamp: z.date(),
    })),
    resolution: z.enum(['merge', 'overwrite', 'reject', 'manual']),
    resolvedBy: z.string().optional(),
    resolvedAt: z.date().optional(),
});

export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

// Scaling configuration
export interface ScalingConfig {
    maxConnectionsPerServer: number;
    heartbeatInterval: number;
    connectionTimeout: number;
    messageQueueSize: number;
    redisCluster: {
        enabled: boolean;
        nodes: string[];
        options: Record<string, any>;
    };
    loadBalancing: {
        strategy: 'round_robin' | 'least_connections' | 'sticky_session';
        healthCheckInterval: number;
    };
}

// Performance metrics
export interface RealtimeMetrics {
    activeConnections: number;
    messagesPerSecond: number;
    averageLatency: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    subscriptionCount: number;
    eventQueueSize: number;
}