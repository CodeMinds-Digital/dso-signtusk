import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '@signtusk/database';
import type { WebhookService } from '@signtusk/lib';

export const signingRoutes = new OpenAPIHono();

// Apply authentication to all signing routes
signingRoutes.use('*', authMiddleware);

// Initialize webhook service (would be injected in real implementation)
const webhookService = {
    async triggerWebhook(organizationId: string, event: string, payload: any) {
        // Find active webhooks for this organization and event
        const webhooks = await prisma.webhook.findMany({
            where: {
                organizationId,
                status: 'ACTIVE',
            }
        });

        for (const webhook of webhooks) {
            const events = webhook.events as string[];
            if (events.includes(event)) {
                // Create webhook delivery record
                await prisma.webhookDelivery.create({
                    data: {
                        webhookId: webhook.id,
                        eventType: event,
                        payload,
                        status: 'PENDING',
                        nextAttemptAt: new Date(),
                    }
                });

                // TODO: Trigger actual webhook delivery via job queue
                console.log(`Webhook queued for ${webhook.url}: ${event}`);
            }
        }
    }
};

/**
 * Create signing request with comprehensive recipient management
 */
const createSigningRequestRoute = createRoute({
    method: 'post',
    path: '/requests',
    tags: ['Signing'],
    summary: 'Create signing request',
    description: 'Create a new signing request with recipients, workflow configuration, and settings',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        documentId: z.string().describe('ID of the document to be signed'),
                        templateId: z.string().optional().describe('Optional template ID to use'),
                        title: z.string().min(1).max(255).describe('Title for the signing request'),
                        message: z.string().optional().describe('Message to recipients'),
                        recipients: z.array(z.object({
                            email: z.string().email().describe('Recipient email address'),
                            name: z.string().min(1).describe('Recipient full name'),
                            role: z.string().default('signer').describe('Recipient role (signer, approver, cc)'),
                            order: z.number().min(1).optional().describe('Signing order for sequential workflows'),
                            authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']).default('EMAIL').describe('Authentication method'),
                        })).min(1).describe('List of recipients'),
                        workflow: z.object({
                            type: z.enum(['PARALLEL', 'SEQUENTIAL']).default('PARALLEL').describe('Workflow execution type'),
                            reminderSettings: z.object({
                                enabled: z.boolean().default(true),
                                intervalDays: z.number().min(1).max(30).default(3),
                                maxReminders: z.number().min(1).max(10).default(3),
                            }).optional(),
                            expirationDays: z.number().min(1).max(365).optional().describe('Days until expiration'),
                        }).optional(),
                        settings: z.object({
                            allowDecline: z.boolean().default(true),
                            requireAllSignatures: z.boolean().default(true),
                            enableAuditTrail: z.boolean().default(true),
                            redirectUrl: z.string().url().optional().describe('URL to redirect after signing'),
                        }).optional(),
                    })
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Signing request created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        signingRequest: z.object({
                            id: z.string(),
                            title: z.string(),
                            status: z.enum(['DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                            documentId: z.string(),
                            templateId: z.string().nullable(),
                            workflow: z.record(z.any()),
                            settings: z.record(z.any()),
                            expiresAt: z.string().datetime().nullable(),
                            createdAt: z.string().datetime(),
                            recipients: z.array(z.object({
                                id: z.string(),
                                email: z.string(),
                                name: z.string(),
                                role: z.string(),
                                order: z.number(),
                                status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNED', 'COMPLETED', 'DECLINED', 'ERROR']),
                                authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']),
                                accessToken: z.string().nullable(),
                            })),
                        }),
                        message: z.string(),
                    })
                }
            }
        },
        400: {
            description: 'Invalid request data'
        },
        404: {
            description: 'Document or template not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

signingRoutes.openapi(createSigningRequestRoute, async (c: any) => {
    const requestData = c.req.valid('json');
    const user = c.get('user');

    try {
        // Validate document exists and user has access
        const document = await prisma.document.findFirst({
            where: {
                id: requestData.documentId,
                organizationId: user.organizationId,
            }
        });

        if (!document) {
            return c.json({ error: 'Document not found' }, 404);
        }

        // Validate template if provided
        if (requestData.templateId) {
            const template = await prisma.template.findFirst({
                where: {
                    id: requestData.templateId,
                    organizationId: user.organizationId,
                }
            });

            if (!template) {
                return c.json({ error: 'Template not found' }, 404);
            }
        }

        // Calculate expiration date
        let expiresAt = null;
        if (requestData.workflow?.expirationDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + requestData.workflow.expirationDays);
        }

        // Create signing request
        const signingRequest = await prisma.signingRequest.create({
            data: {
                documentId: requestData.documentId,
                templateId: requestData.templateId || null,
                organizationId: user.organizationId,
                createdBy: user.id,
                title: requestData.title,
                message: requestData.message || null,
                status: 'DRAFT',
                workflow: requestData.workflow || {},
                settings: requestData.settings || {},
                expiresAt,
            }
        });

        // Create recipients with access tokens
        const recipients = [];
        for (let i = 0; i < requestData.recipients.length; i++) {
            const recipientData = requestData.recipients[i];

            // Generate secure access token
            const crypto = await import('crypto');
            const accessToken = crypto.randomBytes(32).toString('hex');

            const recipient = await prisma.recipient.create({
                data: {
                    signingRequestId: signingRequest.id,
                    email: recipientData.email,
                    name: recipientData.name,
                    role: recipientData.role,
                    order: recipientData.order || (i + 1),
                    status: 'PENDING',
                    authMethod: recipientData.authMethod,
                    accessToken,
                }
            });

            recipients.push(recipient);
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'SigningRequest',
                entityId: signingRequest.id,
                action: 'CREATE',
                details: {
                    title: requestData.title,
                    documentId: requestData.documentId,
                    recipientCount: recipients.length,
                }
            }
        });

        // Trigger webhook
        await webhookService.triggerWebhook(
            user.organizationId,
            'signing_request.created',
            {
                signingRequest: {
                    id: signingRequest.id,
                    title: signingRequest.title,
                    status: signingRequest.status,
                    documentId: signingRequest.documentId,
                    createdAt: signingRequest.createdAt,
                },
                recipients: recipients.map(r => ({
                    id: r.id,
                    email: r.email,
                    name: r.name,
                    role: r.role,
                    status: r.status,
                }))
            }
        );

        return c.json({
            success: true,
            signingRequest: {
                id: signingRequest.id,
                title: signingRequest.title,
                status: signingRequest.status,
                documentId: signingRequest.documentId,
                templateId: signingRequest.templateId,
                workflow: signingRequest.workflow,
                settings: signingRequest.settings,
                expiresAt: signingRequest.expiresAt?.toISOString() || null,
                createdAt: signingRequest.createdAt.toISOString(),
                recipients: recipients.map(r => ({
                    id: r.id,
                    email: r.email,
                    name: r.name,
                    role: r.role,
                    order: r.order,
                    status: r.status,
                    authMethod: r.authMethod,
                    accessToken: r.accessToken,
                })),
            },
            message: 'Signing request created successfully'
        }, 201);

    } catch (error) {
        console.error('Error creating signing request:', error);
        return c.json({ error: 'Failed to create signing request' }, 500);
    }
});

/**
 * Get signing request with full details
 */
const getSigningRequestRoute = createRoute({
    method: 'get',
    path: '/requests/{id}',
    tags: ['Signing'],
    summary: 'Get signing request',
    description: 'Retrieve a specific signing request with complete details including recipients and status',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        query: z.object({
            includeDocument: z.string().transform((val: string) => val === 'true').optional().default('false'),
            includeAuditTrail: z.string().transform((val: string) => val === 'true').optional().default('false'),
        })
    },
    responses: {
        200: {
            description: 'Signing request details',
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.string(),
                        title: z.string(),
                        message: z.string().nullable(),
                        status: z.enum(['DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                        documentId: z.string(),
                        templateId: z.string().nullable(),
                        organizationId: z.string(),
                        createdBy: z.string(),
                        workflow: z.record(z.any()),
                        settings: z.record(z.any()),
                        completedAt: z.string().datetime().nullable(),
                        expiresAt: z.string().datetime().nullable(),
                        createdAt: z.string().datetime(),
                        updatedAt: z.string().datetime(),
                        recipients: z.array(z.object({
                            id: z.string(),
                            email: z.string(),
                            name: z.string(),
                            role: z.string(),
                            order: z.number(),
                            status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNED', 'COMPLETED', 'DECLINED', 'ERROR']),
                            authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']),
                            signedAt: z.string().datetime().nullable(),
                            viewedAt: z.string().datetime().nullable(),
                            deliveredAt: z.string().datetime().nullable(),
                            createdAt: z.string().datetime(),
                        })),
                        document: z.object({
                            id: z.string(),
                            name: z.string(),
                            status: z.string(),
                            mimeType: z.string(),
                        }).optional(),
                        auditTrail: z.array(z.object({
                            id: z.string(),
                            action: z.string(),
                            details: z.record(z.any()),
                            timestamp: z.string().datetime(),
                            userId: z.string().nullable(),
                        })).optional(),
                    })
                }
            }
        },
        404: {
            description: 'Signing request not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

signingRoutes.openapi(getSigningRequestRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const { includeDocument, includeAuditTrail } = c.req.valid('query');
    const user = c.get('user');

    try {
        const signingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                recipients: true,
                document: includeDocument,
                auditEvents: includeAuditTrail ? {
                    orderBy: { createdAt: 'desc' }
                } : false,
            }
        });

        if (!signingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        return c.json({
            id: signingRequest.id,
            title: signingRequest.title,
            message: signingRequest.message,
            status: signingRequest.status,
            documentId: signingRequest.documentId,
            templateId: signingRequest.templateId,
            organizationId: signingRequest.organizationId,
            createdBy: signingRequest.createdBy,
            workflow: signingRequest.workflow,
            settings: signingRequest.settings,
            completedAt: signingRequest.completedAt?.toISOString() || null,
            expiresAt: signingRequest.expiresAt?.toISOString() || null,
            createdAt: signingRequest.createdAt.toISOString(),
            updatedAt: signingRequest.updatedAt.toISOString(),
            recipients: signingRequest.recipients.map(r => ({
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                order: r.order,
                status: r.status,
                authMethod: r.authMethod,
                signedAt: r.signedAt?.toISOString() || null,
                viewedAt: r.viewedAt?.toISOString() || null,
                deliveredAt: r.deliveredAt?.toISOString() || null,
                createdAt: r.createdAt.toISOString(),
            })),
            document: includeDocument && signingRequest.document ? {
                id: signingRequest.document.id,
                name: signingRequest.document.name,
                status: signingRequest.document.status,
                mimeType: signingRequest.document.mimeType,
            } : undefined,
            auditTrail: includeAuditTrail && signingRequest.auditEvents ?
                signingRequest.auditEvents.map(event => ({
                    id: event.id,
                    action: event.action,
                    details: event.details,
                    timestamp: event.createdAt.toISOString(),
                    userId: event.userId,
                })) : undefined,
        });

    } catch (error) {
        console.error('Error fetching signing request:', error);
        return c.json({ error: 'Failed to fetch signing request' }, 500);
    }
});

/**
 * List signing requests with filtering and pagination
 */
const listSigningRequestsRoute = createRoute({
    method: 'get',
    path: '/requests',
    tags: ['Signing'],
    summary: 'List signing requests',
    description: 'Retrieve a paginated list of signing requests with filtering options',
    security: [{ bearerAuth: [] }],
    request: {
        query: z.object({
            page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
            limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
            status: z.enum(['DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']).optional(),
            search: z.string().optional(),
            sortBy: z.enum(['title', 'status', 'createdAt', 'updatedAt', 'expiresAt']).optional().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
            dateFrom: z.string().datetime().optional(),
            dateTo: z.string().datetime().optional(),
        })
    },
    responses: {
        200: {
            description: 'List of signing requests with pagination',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.object({
                            id: z.string(),
                            title: z.string(),
                            status: z.enum(['DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                            documentId: z.string(),
                            createdBy: z.string(),
                            expiresAt: z.string().datetime().nullable(),
                            createdAt: z.string().datetime(),
                            updatedAt: z.string().datetime(),
                            _count: z.object({
                                recipients: z.number(),
                            }),
                        })),
                        pagination: z.object({
                            page: z.number(),
                            limit: z.number(),
                            total: z.number(),
                            totalPages: z.number(),
                            hasNext: z.boolean(),
                            hasPrev: z.boolean()
                        })
                    })
                }
            }
        }
    }
});

signingRoutes.openapi(listSigningRequestsRoute, async (c: any) => {
    const { page, limit, status, search, sortBy, sortOrder, dateFrom, dateTo } = c.req.valid('query');
    const user = c.get('user');

    try {
        // Build where clause
        const where: any = {
            organizationId: user.organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        // Get total count
        const total = await prisma.signingRequest.count({ where });

        // Calculate pagination
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;

        // Build order by
        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;

        // Fetch signing requests
        const signingRequests = await prisma.signingRequest.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        recipients: true,
                    }
                }
            }
        });

        return c.json({
            data: signingRequests.map(sr => ({
                id: sr.id,
                title: sr.title,
                status: sr.status,
                documentId: sr.documentId,
                createdBy: sr.createdBy,
                expiresAt: sr.expiresAt?.toISOString() || null,
                createdAt: sr.createdAt.toISOString(),
                updatedAt: sr.updatedAt.toISOString(),
                _count: sr._count,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error listing signing requests:', error);
        return c.json({ error: 'Failed to list signing requests' }, 500);
    }
});

/**
 * Update signing request status and settings
 */
const updateSigningRequestRoute = createRoute({
    method: 'patch',
    path: '/requests/{id}',
    tags: ['Signing'],
    summary: 'Update signing request',
    description: 'Update signing request status, settings, or other properties',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.enum(['DRAFT', 'SENT', 'CANCELLED']).optional(),
                        title: z.string().min(1).max(255).optional(),
                        message: z.string().optional(),
                        expiresAt: z.string().datetime().optional(),
                        settings: z.record(z.any()).optional(),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Signing request updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        signingRequest: z.object({
                            id: z.string(),
                            title: z.string(),
                            status: z.enum(['DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                            message: z.string().nullable(),
                            expiresAt: z.string().datetime().nullable(),
                            settings: z.record(z.any()),
                            updatedAt: z.string().datetime(),
                        }),
                        message: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Signing request not found'
        },
        403: {
            description: 'Access denied'
        },
        400: {
            description: 'Invalid status transition'
        }
    }
});

signingRoutes.openapi(updateSigningRequestRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');
    const user = c.get('user');

    try {
        // Check signing request exists and user has access
        const existingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            }
        });

        if (!existingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        // Check permissions (only creator can update)
        if (existingRequest.createdBy !== user.id) {
            return c.json({ error: 'Access denied' }, 403);
        }

        // Validate status transitions
        if (updates.status) {
            const validTransitions: Record<string, string[]> = {
                'DRAFT': ['SENT', 'CANCELLED'],
                'SENT': ['CANCELLED'],
                'IN_PROGRESS': ['CANCELLED'],
                'COMPLETED': [],
                'CANCELLED': [],
                'EXPIRED': [],
                'ERROR': ['DRAFT']
            };

            const allowedStatuses = validTransitions[existingRequest.status] || [];
            if (!allowedStatuses.includes(updates.status)) {
                return c.json({
                    error: `Invalid status transition from ${existingRequest.status} to ${updates.status}`
                }, 400);
            }
        }

        // Update signing request
        const signingRequest = await prisma.signingRequest.update({
            where: { id },
            data: {
                ...updates,
                expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : undefined,
                settings: updates.settings ? {
                    ...existingRequest.settings as object,
                    ...updates.settings
                } : undefined,
            }
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'SigningRequest',
                entityId: signingRequest.id,
                action: 'UPDATE',
                details: updates
            }
        });

        // Trigger webhook for status changes
        if (updates.status) {
            await webhookService.triggerWebhook(
                user.organizationId,
                `signing_request.${updates.status.toLowerCase()}`,
                {
                    signingRequest: {
                        id: signingRequest.id,
                        title: signingRequest.title,
                        status: signingRequest.status,
                        updatedAt: signingRequest.updatedAt,
                    }
                }
            );
        }

        return c.json({
            success: true,
            signingRequest: {
                id: signingRequest.id,
                title: signingRequest.title,
                status: signingRequest.status,
                message: signingRequest.message,
                expiresAt: signingRequest.expiresAt?.toISOString() || null,
                settings: signingRequest.settings,
                updatedAt: signingRequest.updatedAt.toISOString(),
            },
            message: 'Signing request updated successfully'
        });

    } catch (error) {
        console.error('Error updating signing request:', error);
        return c.json({ error: 'Failed to update signing request' }, 500);
    }
});

/**
 * Add recipient to signing request
 */
const addRecipientRoute = createRoute({
    method: 'post',
    path: '/requests/{id}/recipients',
    tags: ['Signing'],
    summary: 'Add recipient',
    description: 'Add a new recipient to an existing signing request',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        email: z.string().email().describe('Recipient email address'),
                        name: z.string().min(1).describe('Recipient full name'),
                        role: z.string().default('signer').describe('Recipient role'),
                        order: z.number().min(1).optional().describe('Signing order'),
                        authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']).default('EMAIL'),
                    })
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Recipient added successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        recipient: z.object({
                            id: z.string(),
                            email: z.string(),
                            name: z.string(),
                            role: z.string(),
                            order: z.number(),
                            status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNED', 'COMPLETED', 'DECLINED', 'ERROR']),
                            authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']),
                            accessToken: z.string(),
                            createdAt: z.string().datetime(),
                        }),
                        message: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Signing request not found'
        },
        403: {
            description: 'Access denied'
        },
        400: {
            description: 'Invalid request state'
        }
    }
});

signingRoutes.openapi(addRecipientRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const recipientData = c.req.valid('json');
    const user = c.get('user');

    try {
        // Check signing request exists and user has access
        const signingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                recipients: true,
            }
        });

        if (!signingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        // Check permissions
        if (signingRequest.createdBy !== user.id) {
            return c.json({ error: 'Access denied' }, 403);
        }

        // Check if request is in a state that allows adding recipients
        if (!['DRAFT'].includes(signingRequest.status)) {
            return c.json({ error: 'Cannot add recipients to a request that has been sent' }, 400);
        }

        // Check for duplicate email
        const existingRecipient = signingRequest.recipients.find(r => r.email === recipientData.email);
        if (existingRecipient) {
            return c.json({ error: 'Recipient with this email already exists' }, 400);
        }

        // Generate access token
        const crypto = await import('crypto');
        const accessToken = crypto.randomBytes(32).toString('hex');

        // Determine order if not provided
        const order = recipientData.order || (Math.max(...signingRequest.recipients.map(r => r.order), 0) + 1);

        // Create recipient
        const recipient = await prisma.recipient.create({
            data: {
                signingRequestId: id,
                email: recipientData.email,
                name: recipientData.name,
                role: recipientData.role,
                order,
                status: 'PENDING',
                authMethod: recipientData.authMethod,
                accessToken,
            }
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'Recipient',
                entityId: recipient.id,
                action: 'CREATE',
                details: {
                    signingRequestId: id,
                    email: recipientData.email,
                    name: recipientData.name,
                    role: recipientData.role,
                }
            }
        });

        // Trigger webhook
        await webhookService.triggerWebhook(
            user.organizationId,
            'recipient.added',
            {
                signingRequestId: id,
                recipient: {
                    id: recipient.id,
                    email: recipient.email,
                    name: recipient.name,
                    role: recipient.role,
                    status: recipient.status,
                }
            }
        );

        return c.json({
            success: true,
            recipient: {
                id: recipient.id,
                email: recipient.email,
                name: recipient.name,
                role: recipient.role,
                order: recipient.order,
                status: recipient.status,
                authMethod: recipient.authMethod,
                accessToken: recipient.accessToken,
                createdAt: recipient.createdAt.toISOString(),
            },
            message: 'Recipient added successfully'
        }, 201);

    } catch (error) {
        console.error('Error adding recipient:', error);
        return c.json({ error: 'Failed to add recipient' }, 500);
    }
});

/**
 * Update recipient information and status
 */
const updateRecipientRoute = createRoute({
    method: 'patch',
    path: '/recipients/{id}',
    tags: ['Signing'],
    summary: 'Update recipient',
    description: 'Update recipient information, status, or role assignment',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().min(1).optional(),
                        role: z.string().optional(),
                        order: z.number().min(1).optional(),
                        status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNED', 'COMPLETED', 'DECLINED']).optional(),
                        authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']).optional(),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Recipient updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        recipient: z.object({
                            id: z.string(),
                            email: z.string(),
                            name: z.string(),
                            role: z.string(),
                            order: z.number(),
                            status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNED', 'COMPLETED', 'DECLINED', 'ERROR']),
                            authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']),
                            updatedAt: z.string().datetime(),
                        }),
                        message: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Recipient not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

signingRoutes.openapi(updateRecipientRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');
    const user = c.get('user');

    try {
        // Check recipient exists and user has access
        const recipient = await prisma.recipient.findFirst({
            where: { id },
            include: {
                signingRequest: true,
            }
        });

        if (!recipient) {
            return c.json({ error: 'Recipient not found' }, 404);
        }

        // Check organization access
        if (recipient.signingRequest.organizationId !== user.organizationId) {
            return c.json({ error: 'Access denied' }, 403);
        }

        // Update recipient
        const updatedRecipient = await prisma.recipient.update({
            where: { id },
            data: updates
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'Recipient',
                entityId: recipient.id,
                action: 'UPDATE',
                details: updates
            }
        });

        // Trigger webhook for status changes
        if (updates.status) {
            await webhookService.triggerWebhook(
                user.organizationId,
                `recipient.${updates.status.toLowerCase()}`,
                {
                    signingRequestId: recipient.signingRequestId,
                    recipient: {
                        id: updatedRecipient.id,
                        email: updatedRecipient.email,
                        name: updatedRecipient.name,
                        status: updatedRecipient.status,
                        updatedAt: updatedRecipient.updatedAt,
                    }
                }
            );
        }

        return c.json({
            success: true,
            recipient: {
                id: updatedRecipient.id,
                email: updatedRecipient.email,
                name: updatedRecipient.name,
                role: updatedRecipient.role,
                order: updatedRecipient.order,
                status: updatedRecipient.status,
                authMethod: updatedRecipient.authMethod,
                updatedAt: updatedRecipient.updatedAt.toISOString(),
            },
            message: 'Recipient updated successfully'
        });

    } catch (error) {
        console.error('Error updating recipient:', error);
        return c.json({ error: 'Failed to update recipient' }, 500);
    }
});

/**
 * Get signing request status with real-time updates
 */
const getSigningStatusRoute = createRoute({
    method: 'get',
    path: '/requests/{id}/status',
    tags: ['Signing'],
    summary: 'Get signing status',
    description: 'Get real-time status of signing request and all recipients with completion tracking',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: {
            description: 'Signing status with real-time updates',
            content: {
                'application/json': {
                    schema: z.object({
                        signingRequest: z.object({
                            id: z.string(),
                            title: z.string(),
                            status: z.enum(['DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                            completedAt: z.string().datetime().nullable(),
                            expiresAt: z.string().datetime().nullable(),
                            progress: z.object({
                                totalRecipients: z.number(),
                                completedRecipients: z.number(),
                                pendingRecipients: z.number(),
                                percentComplete: z.number(),
                            }),
                        }),
                        recipients: z.array(z.object({
                            id: z.string(),
                            email: z.string(),
                            name: z.string(),
                            role: z.string(),
                            order: z.number(),
                            status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNED', 'COMPLETED', 'DECLINED', 'ERROR']),
                            signedAt: z.string().datetime().nullable(),
                            viewedAt: z.string().datetime().nullable(),
                            deliveredAt: z.string().datetime().nullable(),
                        })),
                        lastUpdated: z.string().datetime(),
                    })
                }
            }
        },
        404: {
            description: 'Signing request not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

signingRoutes.openapi(getSigningStatusRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');

    try {
        const signingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                recipients: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!signingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        // Calculate progress
        const totalRecipients = signingRequest.recipients.length;
        const completedRecipients = signingRequest.recipients.filter(r =>
            ['SIGNED', 'COMPLETED'].includes(r.status)
        ).length;
        const pendingRecipients = totalRecipients - completedRecipients;
        const percentComplete = totalRecipients > 0 ? Math.round((completedRecipients / totalRecipients) * 100) : 0;

        return c.json({
            signingRequest: {
                id: signingRequest.id,
                title: signingRequest.title,
                status: signingRequest.status,
                completedAt: signingRequest.completedAt?.toISOString() || null,
                expiresAt: signingRequest.expiresAt?.toISOString() || null,
                progress: {
                    totalRecipients,
                    completedRecipients,
                    pendingRecipients,
                    percentComplete,
                },
            },
            recipients: signingRequest.recipients.map(r => ({
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                order: r.order,
                status: r.status,
                signedAt: r.signedAt?.toISOString() || null,
                viewedAt: r.viewedAt?.toISOString() || null,
                deliveredAt: r.deliveredAt?.toISOString() || null,
            })),
            lastUpdated: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error fetching signing status:', error);
        return c.json({ error: 'Failed to fetch signing status' }, 500);
    }
});

/**
 * Send signing request to recipients
 */
const sendSigningRequestRoute = createRoute({
    method: 'post',
    path: '/requests/{id}/send',
    tags: ['Signing'],
    summary: 'Send signing request',
    description: 'Send the signing request to all recipients and initiate the signing workflow',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        customMessage: z.string().optional().describe('Custom message to include in notifications'),
                        sendReminders: z.boolean().default(true).describe('Enable automatic reminders'),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Signing request sent successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string(),
                        sentTo: z.array(z.object({
                            recipientId: z.string(),
                            email: z.string(),
                            status: z.string(),
                        })),
                    })
                }
            }
        },
        404: {
            description: 'Signing request not found'
        },
        403: {
            description: 'Access denied'
        },
        400: {
            description: 'Invalid request state'
        }
    }
});

signingRoutes.openapi(sendSigningRequestRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const { customMessage, sendReminders } = c.req.valid('json');
    const user = c.get('user');

    try {
        const signingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                recipients: true,
                document: true,
            }
        });

        if (!signingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        // Check permissions
        if (signingRequest.createdBy !== user.id) {
            return c.json({ error: 'Access denied' }, 403);
        }

        // Check if request can be sent
        if (signingRequest.status !== 'DRAFT') {
            return c.json({ error: 'Signing request has already been sent' }, 400);
        }

        if (signingRequest.recipients.length === 0) {
            return c.json({ error: 'No recipients added to signing request' }, 400);
        }

        // Update signing request status
        await prisma.signingRequest.update({
            where: { id },
            data: {
                status: 'SENT',
                message: customMessage || signingRequest.message,
            }
        });

        // Update recipients and send notifications
        const sentTo = [];
        for (const recipient of signingRequest.recipients) {
            // Update recipient status
            await prisma.recipient.update({
                where: { id: recipient.id },
                data: {
                    status: 'SENT',
                    deliveredAt: new Date(),
                }
            });

            // TODO: Send actual email notification
            console.log(`Sending signing request to ${recipient.email}`);

            sentTo.push({
                recipientId: recipient.id,
                email: recipient.email,
                status: 'sent',
            });
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'SigningRequest',
                entityId: signingRequest.id,
                action: 'SEND',
                details: {
                    recipientCount: signingRequest.recipients.length,
                    customMessage,
                }
            }
        });

        // Trigger webhook
        await webhookService.triggerWebhook(
            user.organizationId,
            'signing_request.sent',
            {
                signingRequest: {
                    id: signingRequest.id,
                    title: signingRequest.title,
                    status: 'SENT',
                    documentId: signingRequest.documentId,
                },
                recipients: sentTo,
            }
        );

        return c.json({
            success: true,
            message: 'Signing request sent successfully',
            sentTo,
        });

    } catch (error) {
        console.error('Error sending signing request:', error);
        return c.json({ error: 'Failed to send signing request' }, 500);
    }
});
/**
 * Complete signing process for a recipient
 */
const completeSigningRoute = createRoute({
    method: 'post',
    path: '/requests/{id}/complete',
    tags: ['Signing'],
    summary: 'Complete signing process',
    description: 'Mark the signing process as complete and trigger completion webhooks',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        recipientId: z.string().describe('ID of the recipient completing the signing'),
                        signatures: z.array(z.object({
                            fieldId: z.string(),
                            type: z.enum(['DRAWN', 'TYPED', 'UPLOADED', 'DIGITAL']),
                            data: z.string().describe('Base64 encoded signature data'),
                            certificate: z.record(z.any()).optional().describe('Digital certificate data'),
                            biometricData: z.record(z.any()).optional().describe('Biometric signature data'),
                        })).describe('Array of signatures captured'),
                        ipAddress: z.string().describe('IP address of the signer'),
                        userAgent: z.string().describe('User agent of the signer'),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Signing completed successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string(),
                        completionCertificate: z.object({
                            id: z.string(),
                            signingRequestId: z.string(),
                            recipientId: z.string(),
                            completedAt: z.string().datetime(),
                            signatures: z.array(z.object({
                                id: z.string(),
                                fieldId: z.string(),
                                type: z.enum(['DRAWN', 'TYPED', 'UPLOADED', 'DIGITAL']),
                                timestamp: z.string().datetime(),
                                isValid: z.boolean(),
                            })),
                        }),
                        nextRecipient: z.object({
                            id: z.string(),
                            email: z.string(),
                            name: z.string(),
                            order: z.number(),
                        }).nullable(),
                    })
                }
            }
        },
        404: {
            description: 'Signing request or recipient not found'
        },
        403: {
            description: 'Access denied'
        },
        400: {
            description: 'Invalid signing state'
        }
    }
});

signingRoutes.openapi(completeSigningRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const { recipientId, signatures, ipAddress, userAgent } = c.req.valid('json');
    const user = c.get('user');

    try {
        const signingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                recipients: {
                    orderBy: { order: 'asc' }
                },
                document: {
                    include: {
                        fields: true,
                    }
                }
            }
        });

        if (!signingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        const recipient = signingRequest.recipients.find(r => r.id === recipientId);
        if (!recipient) {
            return c.json({ error: 'Recipient not found' }, 404);
        }

        // Check if recipient can sign
        if (!['SENT', 'DELIVERED', 'VIEWED'].includes(recipient.status)) {
            return c.json({ error: 'Recipient cannot sign at this time' }, 400);
        }

        // Create signatures
        const createdSignatures = [];
        for (const signatureData of signatures) {
            // Validate field exists
            const field = signingRequest.document.fields.find(f => f.id === signatureData.fieldId);
            if (!field) {
                return c.json({ error: `Field ${signatureData.fieldId} not found` }, 400);
            }

            const signature = await prisma.signature.create({
                data: {
                    fieldId: signatureData.fieldId,
                    recipientId: recipient.id,
                    type: signatureData.type,
                    data: signatureData.data,
                    timestamp: new Date(),
                    ipAddress,
                    userAgent,
                    certificate: signatureData.certificate || {},
                    biometricData: signatureData.biometricData || {},
                    isValid: true,
                }
            });

            createdSignatures.push(signature);
        }

        // Update recipient status
        await prisma.recipient.update({
            where: { id: recipientId },
            data: {
                status: 'SIGNED',
                signedAt: new Date(),
            }
        });

        // Check if all recipients have signed
        const allRecipients = await prisma.recipient.findMany({
            where: { signingRequestId: id },
        });

        const allSigned = allRecipients.every(r =>
            ['SIGNED', 'COMPLETED'].includes(r.status)
        );

        let nextRecipient = null;
        let requestStatus = signingRequest.status;

        if (allSigned) {
            // Mark signing request as completed
            requestStatus = 'COMPLETED';
            await prisma.signingRequest.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                }
            });

            // Mark all recipients as completed
            await prisma.recipient.updateMany({
                where: { signingRequestId: id },
                data: { status: 'COMPLETED' }
            });
        } else {
            // Update request status to in progress
            if (signingRequest.status === 'SENT') {
                requestStatus = 'IN_PROGRESS';
                await prisma.signingRequest.update({
                    where: { id },
                    data: { status: 'IN_PROGRESS' }
                });
            }

            // Find next recipient for sequential workflows
            const workflow = signingRequest.workflow as any;
            if (workflow?.type === 'SEQUENTIAL') {
                const currentOrder = recipient.order;
                const nextRec = allRecipients
                    .filter(r => r.order > currentOrder && r.status === 'PENDING')
                    .sort((a, b) => a.order - b.order)[0];

                if (nextRec) {
                    nextRecipient = {
                        id: nextRec.id,
                        email: nextRec.email,
                        name: nextRec.name,
                        order: nextRec.order,
                    };

                    // Update next recipient status
                    await prisma.recipient.update({
                        where: { id: nextRec.id },
                        data: { status: 'SENT' }
                    });
                }
            }
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'Signature',
                entityId: createdSignatures[0]?.id || recipientId,
                action: 'SIGN',
                details: {
                    signingRequestId: id,
                    recipientId,
                    signatureCount: signatures.length,
                    ipAddress,
                    userAgent,
                }
            }
        });

        // Trigger webhooks
        await webhookService.triggerWebhook(
            user.organizationId,
            'recipient.signed',
            {
                signingRequestId: id,
                recipient: {
                    id: recipient.id,
                    email: recipient.email,
                    name: recipient.name,
                    signedAt: new Date().toISOString(),
                },
                signatures: createdSignatures.map(s => ({
                    id: s.id,
                    fieldId: s.fieldId,
                    type: s.type,
                    timestamp: s.timestamp.toISOString(),
                }))
            }
        );

        if (allSigned) {
            await webhookService.triggerWebhook(
                user.organizationId,
                'signing_request.completed',
                {
                    signingRequest: {
                        id: signingRequest.id,
                        title: signingRequest.title,
                        status: 'COMPLETED',
                        completedAt: new Date().toISOString(),
                    },
                    allRecipients: allRecipients.map(r => ({
                        id: r.id,
                        email: r.email,
                        name: r.name,
                        status: 'COMPLETED',
                        signedAt: r.signedAt?.toISOString(),
                    }))
                }
            );
        }

        return c.json({
            success: true,
            message: allSigned ? 'Signing process completed successfully' : 'Signature captured successfully',
            completionCertificate: {
                id: `cert_${Date.now()}`,
                signingRequestId: id,
                recipientId,
                completedAt: new Date().toISOString(),
                signatures: createdSignatures.map(s => ({
                    id: s.id,
                    fieldId: s.fieldId,
                    type: s.type,
                    timestamp: s.timestamp.toISOString(),
                    isValid: s.isValid,
                })),
            },
            nextRecipient,
        });

    } catch (error) {
        console.error('Error completing signing:', error);
        return c.json({ error: 'Failed to complete signing process' }, 500);
    }
});

/**
 * Get signing request analytics and metrics
 */
const getSigningAnalyticsRoute = createRoute({
    method: 'get',
    path: '/requests/{id}/analytics',
    tags: ['Signing'],
    summary: 'Get signing analytics',
    description: 'Retrieve comprehensive analytics and metrics for a signing request',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: {
            description: 'Signing request analytics',
            content: {
                'application/json': {
                    schema: z.object({
                        signingRequest: z.object({
                            id: z.string(),
                            title: z.string(),
                            status: z.string(),
                            createdAt: z.string().datetime(),
                            completedAt: z.string().datetime().nullable(),
                        }),
                        metrics: z.object({
                            totalRecipients: z.number(),
                            completedRecipients: z.number(),
                            pendingRecipients: z.number(),
                            declinedRecipients: z.number(),
                            completionRate: z.number(),
                            averageTimeToSign: z.number().nullable(),
                            totalTimeToComplete: z.number().nullable(),
                        }),
                        recipientMetrics: z.array(z.object({
                            recipientId: z.string(),
                            email: z.string(),
                            name: z.string(),
                            status: z.string(),
                            timeToView: z.number().nullable(),
                            timeToSign: z.number().nullable(),
                            viewCount: z.number(),
                            lastViewedAt: z.string().datetime().nullable(),
                        })),
                        timeline: z.array(z.object({
                            timestamp: z.string().datetime(),
                            event: z.string(),
                            recipientEmail: z.string().nullable(),
                            details: z.record(z.any()),
                        })),
                    })
                }
            }
        },
        404: {
            description: 'Signing request not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

signingRoutes.openapi(getSigningAnalyticsRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');

    try {
        const signingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                recipients: true,
                auditEvents: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!signingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        // Calculate metrics
        const totalRecipients = signingRequest.recipients.length;
        const completedRecipients = signingRequest.recipients.filter(r =>
            ['SIGNED', 'COMPLETED'].includes(r.status)
        ).length;
        const pendingRecipients = signingRequest.recipients.filter(r =>
            ['PENDING', 'SENT', 'DELIVERED', 'VIEWED'].includes(r.status)
        ).length;
        const declinedRecipients = signingRequest.recipients.filter(r =>
            r.status === 'DECLINED'
        ).length;

        const completionRate = totalRecipients > 0 ?
            Math.round((completedRecipients / totalRecipients) * 100) : 0;

        // Calculate average time to sign
        const signedRecipients = signingRequest.recipients.filter(r => r.signedAt);
        let averageTimeToSign = null;
        if (signedRecipients.length > 0) {
            const totalSigningTime = signedRecipients.reduce((sum, r) => {
                if (r.deliveredAt && r.signedAt) {
                    return sum + (r.signedAt.getTime() - r.deliveredAt.getTime());
                }
                return sum;
            }, 0);
            averageTimeToSign = Math.round(totalSigningTime / signedRecipients.length / (1000 * 60 * 60)); // hours
        }

        // Calculate total time to complete
        let totalTimeToComplete = null;
        if (signingRequest.completedAt) {
            totalTimeToComplete = Math.round(
                (signingRequest.completedAt.getTime() - signingRequest.createdAt.getTime()) / (1000 * 60 * 60)
            ); // hours
        }

        // Calculate recipient metrics
        const recipientMetrics = signingRequest.recipients.map(r => {
            let timeToView = null;
            let timeToSign = null;

            if (r.deliveredAt && r.viewedAt) {
                timeToView = Math.round((r.viewedAt.getTime() - r.deliveredAt.getTime()) / (1000 * 60)); // minutes
            }

            if (r.viewedAt && r.signedAt) {
                timeToSign = Math.round((r.signedAt.getTime() - r.viewedAt.getTime()) / (1000 * 60)); // minutes
            }

            return {
                recipientId: r.id,
                email: r.email,
                name: r.name,
                status: r.status,
                timeToView,
                timeToSign,
                viewCount: 1, // TODO: Implement actual view tracking
                lastViewedAt: r.viewedAt?.toISOString() || null,
            };
        });

        // Build timeline from audit events
        const timeline = signingRequest.auditEvents.map(event => ({
            timestamp: event.createdAt.toISOString(),
            event: event.action,
            recipientEmail: (event.details as any)?.email || null,
            details: event.details,
        }));

        return c.json({
            signingRequest: {
                id: signingRequest.id,
                title: signingRequest.title,
                status: signingRequest.status,
                createdAt: signingRequest.createdAt.toISOString(),
                completedAt: signingRequest.completedAt?.toISOString() || null,
            },
            metrics: {
                totalRecipients,
                completedRecipients,
                pendingRecipients,
                declinedRecipients,
                completionRate,
                averageTimeToSign,
                totalTimeToComplete,
            },
            recipientMetrics,
            timeline,
        });

    } catch (error) {
        console.error('Error fetching signing analytics:', error);
        return c.json({ error: 'Failed to fetch signing analytics' }, 500);
    }
});

/**
 * Resend signing request to specific recipients
 */
const resendSigningRequestRoute = createRoute({
    method: 'post',
    path: '/requests/{id}/resend',
    tags: ['Signing'],
    summary: 'Resend signing request',
    description: 'Resend signing request notifications to specific recipients',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        recipientIds: z.array(z.string()).optional().describe('Specific recipient IDs to resend to (if empty, resends to all pending)'),
                        customMessage: z.string().optional().describe('Custom message for the resend'),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Signing request resent successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string(),
                        resentTo: z.array(z.object({
                            recipientId: z.string(),
                            email: z.string(),
                            status: z.string(),
                        })),
                    })
                }
            }
        },
        404: {
            description: 'Signing request not found'
        },
        403: {
            description: 'Access denied'
        },
        400: {
            description: 'Invalid request state'
        }
    }
});

signingRoutes.openapi(resendSigningRequestRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const { recipientIds, customMessage } = c.req.valid('json');
    const user = c.get('user');

    try {
        const signingRequest = await prisma.signingRequest.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                recipients: true,
            }
        });

        if (!signingRequest) {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        // Check permissions
        if (signingRequest.createdBy !== user.id) {
            return c.json({ error: 'Access denied' }, 403);
        }

        // Check if request can be resent
        if (!['SENT', 'IN_PROGRESS'].includes(signingRequest.status)) {
            return c.json({ error: 'Signing request cannot be resent in current state' }, 400);
        }

        // Determine recipients to resend to
        let recipientsToResend = signingRequest.recipients;

        if (recipientIds && recipientIds.length > 0) {
            recipientsToResend = signingRequest.recipients.filter(r =>
                recipientIds.includes(r.id)
            );
        } else {
            // Resend to all pending recipients
            recipientsToResend = signingRequest.recipients.filter(r =>
                ['PENDING', 'SENT', 'DELIVERED', 'VIEWED'].includes(r.status)
            );
        }

        if (recipientsToResend.length === 0) {
            return c.json({ error: 'No eligible recipients to resend to' }, 400);
        }

        // Resend to recipients
        const resentTo = [];
        for (const recipient of recipientsToResend) {
            // Update recipient status if needed
            if (recipient.status === 'PENDING') {
                await prisma.recipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: 'SENT',
                        deliveredAt: new Date(),
                    }
                });
            }

            // TODO: Send actual email notification
            console.log(`Resending signing request to ${recipient.email}`);

            resentTo.push({
                recipientId: recipient.id,
                email: recipient.email,
                status: 'resent',
            });
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'SigningRequest',
                entityId: signingRequest.id,
                action: 'RESEND',
                details: {
                    recipientCount: resentTo.length,
                    customMessage,
                    recipientIds: resentTo.map(r => r.recipientId),
                }
            }
        });

        // Trigger webhook
        await webhookService.triggerWebhook(
            user.organizationId,
            'signing_request.resent',
            {
                signingRequest: {
                    id: signingRequest.id,
                    title: signingRequest.title,
                    status: signingRequest.status,
                },
                resentTo,
            }
        );

        return c.json({
            success: true,
            message: `Signing request resent to ${resentTo.length} recipient(s)`,
            resentTo,
        });

    } catch (error) {
        console.error('Error resending signing request:', error);
        return c.json({ error: 'Failed to resend signing request' }, 500);
    }
});