import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import WebSocket from 'ws';
import { realtimeService } from '@signtusk/trpc/routers/subscriptions';

// Simple logger implementation
const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

const app = new Hono();

// WebSocket upgrade endpoint
app.get('/ws', async (c) => {
    const upgrade = c.req.header('upgrade');
    if (upgrade !== 'websocket') {
        return c.text('Expected WebSocket upgrade', 400);
    }

    // Extract user info from headers or query params
    const userId = c.req.query('userId');
    const organizationId = c.req.query('organizationId');
    const token = c.req.header('authorization')?.replace('Bearer ', '');

    if (!userId || !organizationId) {
        return c.text('Missing userId or organizationId', 400);
    }

    // TODO: Validate token and extract user info
    // For now, we'll trust the provided userId and organizationId

    try {
        // This would typically be handled by the WebSocket server
        // Here we're just documenting the expected behavior
        return c.text('WebSocket upgrade should be handled by WebSocket server', 200);
    } catch (error) {
        logger.error('WebSocket connection error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId,
            organizationId,
        });
        return c.text('Internal server error', 500);
    }
});

// Server-Sent Events endpoint
app.get('/events', async (c) => {
    const userId = c.req.query('userId');
    const organizationId = c.req.query('organizationId');
    const token = c.req.header('authorization')?.replace('Bearer ', '');

    if (!userId || !organizationId) {
        return c.text('Missing userId or organizationId', 400);
    }

    // TODO: Validate token and extract user info
    // For now, we'll trust the provided userId and organizationId

    try {
        // Set up Server-Sent Events
        const response = new Response(
            new ReadableStream({
                start(controller) {
                    // Add SSE connection to real-time service
                    const connectionId = realtimeService.handleSSEConnection(
                        {
                            writeHead: () => { },
                            write: (data: string) => {
                                controller.enqueue(new TextEncoder().encode(data));
                            },
                            end: () => {
                                controller.close();
                            },
                            on: () => { },
                            destroyed: false,
                        },
                        userId,
                        organizationId
                    );

                    logger.info('SSE connection established', {
                        connectionId,
                        userId,
                        organizationId,
                    });
                },
                cancel() {
                    logger.info('SSE connection cancelled', {
                        userId,
                        organizationId,
                    });
                },
            }),
            {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Cache-Control',
                    'Access-Control-Allow-Credentials': 'true',
                },
            }
        );

        return response;
    } catch (error) {
        logger.error('SSE connection error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId,
            organizationId,
        });
        return c.text('Internal server error', 500);
    }
});

// Get real-time metrics (admin only)
app.get('/metrics', async (c) => {
    // TODO: Add admin authentication check

    try {
        const metrics = realtimeService.getMetrics();
        const conflictStats = realtimeService.getConflictStatistics();

        return c.json({
            success: true,
            data: {
                metrics,
                conflictStatistics: conflictStats,
                timestamp: new Date(),
            },
        });
    } catch (error) {
        logger.error('Failed to get real-time metrics', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return c.json({
            success: false,
            error: 'Failed to get metrics',
        }, 500);
    }
});

// Emit test event (development only)
app.post('/test-event',
    zValidator('json', z.object({
        type: z.enum(['document_update', 'signature_status', 'notification', 'user_presence', 'organization_activity']),
        payload: z.record(z.any()),
        userId: z.string().optional(),
        organizationId: z.string(),
    })),
    async (c) => {
        if (process.env.NODE_ENV === 'production') {
            return c.json({ success: false, error: 'Not available in production' }, 403);
        }

        const { type, payload, userId, organizationId } = c.req.valid('json');

        try {
            switch (type) {
                case 'document_update':
                    await realtimeService.emitDocumentUpdate({
                        documentId: payload.documentId || 'test-doc',
                        type: payload.updateType || 'updated',
                        changes: payload.changes || {},
                        userId: userId || 'test-user',
                        organizationId,
                        timestamp: new Date(),
                    });
                    break;

                case 'signature_status':
                    await realtimeService.emitSignatureStatusUpdate({
                        signingRequestId: payload.signingRequestId || 'test-request',
                        documentId: payload.documentId || 'test-doc',
                        recipientId: payload.recipientId || 'test-recipient',
                        status: payload.status || 'signed',
                        userId: userId || 'test-user',
                        organizationId,
                        timestamp: new Date(),
                    });
                    break;

                case 'notification':
                    await realtimeService.emitNotification({
                        id: payload.id || 'test-notification',
                        title: payload.title || 'Test Notification',
                        message: payload.message || 'This is a test notification',
                        type: payload.notificationType || 'info',
                        priority: payload.priority || 'medium',
                        userId: userId || 'test-user',
                        organizationId,
                        timestamp: new Date(),
                    });
                    break;

                case 'user_presence':
                    await realtimeService.emitUserPresence({
                        userId: userId || 'test-user',
                        organizationId,
                        status: payload.status || 'online',
                        lastSeen: new Date(),
                        currentDocument: payload.currentDocument,
                        metadata: payload.metadata,
                    });
                    break;

                case 'organization_activity':
                    await realtimeService.emitOrganizationActivity(
                        organizationId,
                        payload.activityType || 'test_activity',
                        payload.activityData || {},
                        userId
                    );
                    break;
            }

            return c.json({
                success: true,
                message: `Test ${type} event emitted successfully`,
                timestamp: new Date(),
            });
        } catch (error) {
            logger.error('Failed to emit test event', {
                error: error instanceof Error ? error.message : 'Unknown error',
                type,
                organizationId,
                userId,
            });
            return c.json({
                success: false,
                error: 'Failed to emit test event',
            }, 500);
        }
    }
);

// Resolve document conflicts
app.post('/conflicts/:documentId/resolve',
    zValidator('param', z.object({
        documentId: z.string(),
    })),
    zValidator('json', z.object({
        resolution: z.enum(['merge', 'overwrite', 'reject', 'manual']),
        resolvedBy: z.string(),
    })),
    async (c) => {
        const { documentId } = c.req.valid('param');
        const { resolution, resolvedBy } = c.req.valid('json');

        try {
            await realtimeService.resolveConflicts(documentId, resolution, resolvedBy);

            return c.json({
                success: true,
                message: 'Conflicts resolved successfully',
                documentId,
                resolution,
                resolvedBy,
                timestamp: new Date(),
            });
        } catch (error) {
            logger.error('Failed to resolve conflicts', {
                error: error instanceof Error ? error.message : 'Unknown error',
                documentId,
                resolution,
                resolvedBy,
            });

            if (error instanceof Error && error.message.includes('No active conflicts')) {
                return c.json({
                    success: false,
                    error: 'No active conflicts found for document',
                }, 404);
            }

            return c.json({
                success: false,
                error: 'Failed to resolve conflicts',
            }, 500);
        }
    }
);

// Health check for real-time service
app.get('/health', async (c) => {
    try {
        const metrics = realtimeService.getMetrics();

        return c.json({
            success: true,
            status: 'healthy',
            metrics: {
                activeConnections: metrics.activeConnections,
                sseConnections: metrics.sseConnections,
                subscriptionCount: metrics.subscriptionCount,
                sseSubscriptions: metrics.sseSubscriptions,
            },
            timestamp: new Date(),
        });
    } catch (error) {
        logger.error('Real-time service health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return c.json({
            success: false,
            status: 'unhealthy',
            error: 'Service unavailable',
        }, 503);
    }
});

export default app;