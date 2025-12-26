import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../../middleware/auth';
import {
    WebhookService,
    CreateWebhookRequestSchema,
    UpdateWebhookRequestSchema,
    WebhookEventTypeSchema,
    WebhookError,
    WebhookValidationError,
} from '@signtusk/webhooks';

export const webhookRoutes = new OpenAPIHono();
webhookRoutes.use('*', authMiddleware);

// Webhook response schemas
const WebhookResponseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    url: z.string().url(),
    events: z.array(WebhookEventTypeSchema),
    active: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

const WebhookDeliveryResponseSchema = z.object({
    id: z.string(),
    webhookId: z.string(),
    eventType: WebhookEventTypeSchema,
    status: z.enum(['pending', 'delivered', 'failed', 'cancelled']),
    attempts: z.number(),
    responseStatus: z.number().optional(),
    error: z.string().optional(),
    createdAt: z.string().datetime(),
});

const WebhookStatsResponseSchema = z.object({
    totalDeliveries: z.number(),
    successfulDeliveries: z.number(),
    failedDeliveries: z.number(),
    pendingDeliveries: z.number(),
    averageResponseTime: z.number(),
    successRate: z.number(),
});

// List webhooks
const listWebhooksRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Webhooks'],
    summary: 'List organization webhooks',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'List of webhooks',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(WebhookResponseSchema)
                    })
                }
            }
        }
    }
});

webhookRoutes.openapi(listWebhooksRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const organizationId = c.get('organizationId') as string;

        const webhooks = await webhookService.listWebhooks(organizationId);

        return c.json({
            data: webhooks.map(webhook => ({
                id: webhook.id,
                organizationId: webhook.organizationId,
                url: webhook.url,
                events: webhook.events,
                active: webhook.active,
                createdAt: webhook.createdAt.toISOString(),
                updatedAt: webhook.updatedAt.toISOString(),
            }))
        });
    } catch (error) {
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Create webhook
const createWebhookRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Webhooks'],
    summary: 'Create a new webhook',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateWebhookRequestSchema
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Webhook created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        data: WebhookResponseSchema
                    })
                }
            }
        },
        400: {
            description: 'Invalid request',
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            }
        }
    }
});

webhookRoutes.openapi(createWebhookRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const organizationId = c.get('organizationId') as string;
        const request = await c.req.json();

        const webhook = await webhookService.createWebhook(organizationId, request);

        return c.json({
            data: {
                id: webhook.id,
                organizationId: webhook.organizationId,
                url: webhook.url,
                events: webhook.events,
                active: webhook.active,
                createdAt: webhook.createdAt.toISOString(),
                updatedAt: webhook.updatedAt.toISOString(),
            }
        }, 201);
    } catch (error) {
        if (error instanceof WebhookValidationError) {
            return c.json({ error: error.message }, 400);
        }
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Get webhook
const getWebhookRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Webhooks'],
    summary: 'Get webhook by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: {
            description: 'Webhook details',
            content: {
                'application/json': {
                    schema: z.object({
                        data: WebhookResponseSchema
                    })
                }
            }
        },
        404: {
            description: 'Webhook not found',
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            }
        }
    }
});

webhookRoutes.openapi(getWebhookRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const { id } = c.req.param();

        const webhook = await webhookService.getWebhook(id);

        if (!webhook) {
            return c.json({ error: 'Webhook not found' }, 404);
        }

        return c.json({
            data: {
                id: webhook.id,
                organizationId: webhook.organizationId,
                url: webhook.url,
                events: webhook.events,
                active: webhook.active,
                createdAt: webhook.createdAt.toISOString(),
                updatedAt: webhook.updatedAt.toISOString(),
            }
        });
    } catch (error) {
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Update webhook
const updateWebhookRoute = createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Webhooks'],
    summary: 'Update webhook',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: UpdateWebhookRequestSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Webhook updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        data: WebhookResponseSchema
                    })
                }
            }
        },
        400: {
            description: 'Invalid request',
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            }
        },
        404: {
            description: 'Webhook not found',
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            }
        }
    }
});

webhookRoutes.openapi(updateWebhookRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const { id } = c.req.param();
        const request = await c.req.json();

        const webhook = await webhookService.updateWebhook(id, request);

        return c.json({
            data: {
                id: webhook.id,
                organizationId: webhook.organizationId,
                url: webhook.url,
                events: webhook.events,
                active: webhook.active,
                createdAt: webhook.createdAt.toISOString(),
                updatedAt: webhook.updatedAt.toISOString(),
            }
        });
    } catch (error) {
        if (error instanceof WebhookValidationError) {
            return c.json({ error: error.message }, 400);
        }
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Delete webhook
const deleteWebhookRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Webhooks'],
    summary: 'Delete webhook',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        204: {
            description: 'Webhook deleted successfully'
        },
        404: {
            description: 'Webhook not found',
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            }
        }
    }
});

webhookRoutes.openapi(deleteWebhookRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const { id } = c.req.param();

        const deleted = await webhookService.deleteWebhook(id);

        if (!deleted) {
            return c.json({ error: 'Webhook not found' }, 404);
        }

        return c.body(null, 204);
    } catch (error) {
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Test webhook
const testWebhookRoute = createRoute({
    method: 'post',
    path: '/{id}/test',
    tags: ['Webhooks'],
    summary: 'Test webhook delivery',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: {
            description: 'Test result',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        error: z.string().optional(),
                        responseTime: z.number().optional(),
                    })
                }
            }
        },
        404: {
            description: 'Webhook not found',
            content: {
                'application/json': {
                    schema: z.object({ error: z.string() })
                }
            }
        }
    }
});

webhookRoutes.openapi(testWebhookRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const { id } = c.req.param();

        const result = await webhookService.testWebhook(id);

        return c.json(result);
    } catch (error) {
        if (error instanceof WebhookValidationError && error.message.includes('not found')) {
            return c.json({ error: 'Webhook not found' }, 404);
        }
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Get webhook deliveries
const getWebhookDeliveriesRoute = createRoute({
    method: 'get',
    path: '/{id}/deliveries',
    tags: ['Webhooks'],
    summary: 'Get webhook deliveries',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        query: z.object({
            limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100)
        })
    },
    responses: {
        200: {
            description: 'Webhook deliveries',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(WebhookDeliveryResponseSchema)
                    })
                }
            }
        }
    }
});

webhookRoutes.openapi(getWebhookDeliveriesRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const { id } = c.req.param();
        const { limit } = c.req.query();

        const deliveries = await webhookService.getDeliveries(id, limit);

        return c.json({
            data: deliveries.map(delivery => ({
                id: delivery.id,
                webhookId: delivery.webhookId,
                eventType: delivery.eventType,
                status: delivery.status,
                attempts: delivery.attempts,
                responseStatus: delivery.responseStatus,
                error: delivery.error,
                createdAt: delivery.createdAt.toISOString(),
            }))
        });
    } catch (error) {
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Get webhook stats
const getWebhookStatsRoute = createRoute({
    method: 'get',
    path: '/{id}/stats',
    tags: ['Webhooks'],
    summary: 'Get webhook statistics',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: {
            description: 'Webhook statistics',
            content: {
                'application/json': {
                    schema: z.object({
                        data: WebhookStatsResponseSchema
                    })
                }
            }
        }
    }
});

webhookRoutes.openapi(getWebhookStatsRoute, async (c) => {
    try {
        const webhookService = c.get('webhookService') as WebhookService;
        const { id } = c.req.param();

        const stats = await webhookService.getWebhookStats(id);

        return c.json({ data: stats });
    } catch (error) {
        if (error instanceof WebhookError) {
            return c.json({ error: error.message }, error.statusCode);
        }
        return c.json({ error: 'Internal server error' }, 500);
    }
});