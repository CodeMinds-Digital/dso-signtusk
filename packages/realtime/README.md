# @signtusk/realtime

Real-time API features with WebSocket and Server-Sent Events (SSE) support for the Signtusk platform.

## Features

- **WebSocket Connection Management**: Scalable WebSocket connections with automatic cleanup and heartbeat
- **Server-Sent Events (SSE)**: HTTP-based real-time updates for clients that can't use WebSockets
- **Real-time Document Updates**: Live updates for document changes with conflict resolution
- **Live Signature Status Updates**: Real-time notifications for signature workflow progress
- **Conflict Resolution**: Automatic detection and resolution of concurrent document edits
- **Scaling Support**: Redis-based clustering for horizontal scaling across multiple servers
- **Comprehensive Metrics**: Real-time performance monitoring and statistics

## Installation

```bash
npm install @signtusk/realtime
```

## Quick Start

### Basic Setup

```typescript
import { RealtimeService, createDefaultConfig, createWebSocketServer } from '@signtusk/realtime';

// Create real-time service
const config = createDefaultConfig();
const realtimeService = new RealtimeService(config);
await realtimeService.initialize();

// Create WebSocket server
const wsServer = createWebSocketServer(realtimeService, {
    port: 8080,
    path: '/ws',
});
await wsServer.start();
```

### WebSocket Client Connection

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/ws?userId=user123&organizationId=org123');

ws.onopen = () => {
    console.log('Connected to real-time updates');
    
    // Subscribe to document updates
    ws.send(JSON.stringify({
        type: 'subscribe',
        subscription: {
            type: 'document_updates',
            filters: {
                documentId: 'doc123'
            }
        }
    }));
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
};
```

### Server-Sent Events Client

```javascript
// Connect to SSE
const eventSource = new EventSource('/api/realtime/events?userId=user123&organizationId=org123');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('SSE Event:', data);
};

eventSource.addEventListener('document_updated', (event) => {
    const data = JSON.parse(event.data);
    console.log('Document updated:', data);
});
```

## API Reference

### RealtimeService

Main service class that orchestrates all real-time functionality.

```typescript
const realtimeService = new RealtimeService(config);

// Initialize the service
await realtimeService.initialize();

// Handle WebSocket connections
const connectionId = realtimeService.handleWebSocketConnection(socket, userId, organizationId);

// Handle SSE connections
const sseConnectionId = realtimeService.handleSSEConnection(response, userId, organizationId);

// Emit events
await realtimeService.emitDocumentUpdate(documentUpdateEvent);
await realtimeService.emitSignatureStatusUpdate(signatureEvent);
await realtimeService.emitNotification(notificationEvent);

// Get metrics
const metrics = realtimeService.getMetrics();
```

### Event Types

#### Document Update Events

```typescript
interface DocumentUpdateEvent {
    documentId: string;
    type: 'created' | 'updated' | 'deleted' | 'signed' | 'completed';
    changes?: Record<string, any>;
    userId: string;
    organizationId: string;
    timestamp: Date;
}
```

#### Signature Status Events

```typescript
interface SignatureStatusEvent {
    signingRequestId: string;
    documentId: string;
    recipientId: string;
    status: 'pending' | 'signed' | 'declined' | 'expired';
    signatureData?: {
        signedAt?: Date;
        ipAddress?: string;
        userAgent?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
    };
    userId: string;
    organizationId: string;
    timestamp: Date;
}
```

#### Notification Events

```typescript
interface NotificationEvent {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    userId: string;
    organizationId: string;
    actionUrl?: string;
    expiresAt?: Date;
    timestamp: Date;
}
```

### Subscription Types

- `document_updates`: Document creation, updates, and deletions
- `signing_updates`: Signature workflow progress
- `notifications`: User notifications
- `organization_activity`: Organization-wide activities
- `team_updates`: Team-specific updates
- `user_presence`: User online/offline status
- `system_announcements`: System-wide announcements

### Conflict Resolution

The system automatically detects conflicts when multiple users edit the same document simultaneously:

```typescript
// Resolve conflicts
await realtimeService.resolveConflicts(documentId, 'merge', resolvedBy);

// Available resolution strategies:
// - 'merge': Attempt to merge changes intelligently
// - 'overwrite': Use incoming changes
// - 'reject': Keep current changes
// - 'manual': Require manual resolution
```

## Configuration

### Scaling Configuration

```typescript
interface ScalingConfig {
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
```

### Redis Clustering

For horizontal scaling across multiple servers:

```typescript
const config = {
    ...createDefaultConfig(),
    redisCluster: {
        enabled: true,
        nodes: ['redis1:6379', 'redis2:6379', 'redis3:6379'],
        options: {
            password: 'your-redis-password',
            retryDelayOnClusterDown: 100,
        },
    },
};
```

## Monitoring and Metrics

### Real-time Metrics

```typescript
const metrics = realtimeService.getMetrics();
console.log({
    activeConnections: metrics.activeConnections,
    sseConnections: metrics.sseConnections,
    messagesPerSecond: metrics.messagesPerSecond,
    averageLatency: metrics.averageLatency,
    errorRate: metrics.errorRate,
    memoryUsage: metrics.memoryUsage,
    subscriptionCount: metrics.subscriptionCount,
});
```

### Conflict Statistics

```typescript
const conflictStats = realtimeService.getConflictStatistics();
console.log({
    activeConflicts: conflictStats.activeConflicts,
    pendingChanges: conflictStats.pendingChanges,
    documentsWithConflicts: conflictStats.documentsWithConflicts,
});
```

## Error Handling

The service includes comprehensive error handling and logging:

```typescript
// Service events
realtimeService.on('ws_connection_added', (connection) => {
    console.log('New WebSocket connection:', connection.id);
});

realtimeService.on('sse_connection_added', (connection) => {
    console.log('New SSE connection:', connection.id);
});

realtimeService.on('metrics_updated', (metrics) => {
    console.log('Metrics updated:', metrics);
});
```

## Testing

The package includes comprehensive property-based tests:

```bash
npm test
npm run test:coverage
```

## Performance Considerations

- **Connection Limits**: Configure `maxConnectionsPerServer` based on your server capacity
- **Heartbeat Interval**: Balance between connection reliability and server load
- **Message Queue Size**: Prevent memory issues with high-frequency events
- **Redis Clustering**: Enable for production deployments with multiple servers
- **Cleanup Intervals**: Automatic cleanup of stale connections and old data

## Security

- **Authentication**: Validate user tokens before establishing connections
- **Authorization**: Filter events based on user permissions and organization membership
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Input Validation**: All messages are validated using Zod schemas
- **CORS**: Configure appropriate CORS policies for web clients

## License

Private - Part of Signtusk platform