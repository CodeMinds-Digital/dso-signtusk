import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../../middleware/auth';
import { TemplateService } from '@signtusk/templates';
import { prisma } from '@signtusk/database';
import { HTTPException } from 'hono/http-exception';

export const templateRoutes = new OpenAPIHono();
templateRoutes.use('*', authMiddleware);

// Schema definitions for template API endpoints
const TemplateFieldSchema = z.object({
    type: z.enum(['SIGNATURE', 'INITIAL', 'TEXT', 'DATE', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'ATTACHMENT']),
    name: z.string().min(1).max(255),
    page: z.number().min(1),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
    properties: z.record(z.any()).default({}),
    isRequired: z.boolean().default(false),
    recipientRole: z.string().optional(),
});

const TemplateRecipientSchema = z.object({
    role: z.string().min(1).max(100),
    name: z.string().optional(),
    email: z.string().email().optional(),
    order: z.number().min(1).default(1),
    authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']).default('EMAIL'),
    isRequired: z.boolean().default(true),
});

const CreateTemplateSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    documentId: z.string(),
    category: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(20).default([]),
    isPublic: z.boolean().default(false),
    fields: z.array(TemplateFieldSchema).default([]),
    recipients: z.array(TemplateRecipientSchema).default([]),
    settings: z.object({
        allowDuplication: z.boolean().default(true),
        requireApproval: z.boolean().default(false),
        defaultLanguage: z.string().default('en'),
        autoReminders: z.boolean().default(true),
        expirationDays: z.number().min(1).max(365).optional(),
    }).default({}),
});

const ShareTemplateSchema = z.object({
    shareRequests: z.array(z.object({
        shareType: z.enum(['user', 'team', 'organization', 'public', 'external']),
        targetId: z.string().optional(),
        targetEmail: z.string().email().optional(),
        permissions: z.object({
            canView: z.boolean().default(true),
            canUse: z.boolean().default(true),
            canDuplicate: z.boolean().default(false),
            canEdit: z.boolean().default(false),
            canShare: z.boolean().default(false),
            canDelete: z.boolean().default(false),
        }),
        options: z.object({
            expiresAt: z.string().datetime().optional(),
            password: z.string().optional(),
            maxUses: z.number().min(1).optional(),
            message: z.string().max(500).optional(),
            requireApproval: z.boolean().default(false),
        }).optional(),
    })),
});

const InstantiateTemplateSchema = z.object({
    recipientMappings: z.array(z.object({
        role: z.string(),
        name: z.string(),
        email: z.string().email(),
    })),
    fieldMappings: z.array(z.object({
        fieldName: z.string(),
        value: z.string(),
    })).optional(),
    variables: z.array(z.object({
        name: z.string(),
        value: z.string(),
    })).optional(),
    customizations: z.object({
        documentName: z.string().optional(),
        expirationDate: z.string().datetime().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    }).optional(),
});

// Template creation endpoint
const createTemplateRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Templates'],
    summary: 'Create template with comprehensive validation and field mapping',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: CreateTemplateSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Template created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        template: z.object({
                            id: z.string(),
                            name: z.string(),
                            description: z.string().optional(),
                            documentId: z.string(),
                            organizationId: z.string(),
                            createdBy: z.string(),
                            isPublic: z.boolean(),
                            createdAt: z.string().datetime(),
                            updatedAt: z.string().datetime(),
                        }),
                        message: z.string(),
                    }),
                },
            },
        },
        400: {
            description: 'Bad request - validation failed',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        details: z.array(z.string()).optional(),
                    }),
                },
            },
        },
    },
});

templateRoutes.openapi(createTemplateRoute, async (c) => {
    try {
        const body = c.req.valid('json');
        const apiContext = c.get('apiContext');

        if (!apiContext.user) {
            throw new HTTPException(401, {
                message: 'Authentication required',
            });
        }

        // Create a simple cache implementation for the TemplateService
        const cache = {
            get: async (key: string) => null,
            set: async (key: string, value: any, ttl?: number) => { },
            del: async (key: string) => { },
            clear: async () => { },
        };

        const templateService = new TemplateService(prisma, cache);

        const result = await templateService.createTemplate(
            body,
            apiContext.user.id,
            apiContext.user.organizationId
        );

        if (!result.success) {
            throw new HTTPException(400, {
                message: result.errors?.join(', ') || 'Failed to create template',
            });
        }

        return c.json({
            success: true,
            template: result.template,
            message: 'Template created successfully with comprehensive validation',
        }, 201);
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, {
            message: 'Internal server error while creating template',
        });
    }
});

// List templates endpoint
const listTemplatesRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Templates'],
    summary: 'List templates with comprehensive filtering and pagination',
    security: [{ bearerAuth: [] }],
    request: {
        query: z.object({
            search: z.string().optional(),
            category: z.string().optional(),
            tags: z.string().optional(), // Comma-separated tags
            isPublic: z.string().transform(val => val === 'true').optional(),
            createdBy: z.string().optional(),
            sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'usageCount']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            limit: z.string().transform(val => parseInt(val)).default('20'),
            offset: z.string().transform(val => parseInt(val)).default('0'),
            includeFields: z.string().transform(val => val === 'true').default('false'),
            includeRecipients: z.string().transform(val => val === 'true').default('false'),
        }),
    },
    responses: {
        200: {
            description: 'List of templates with pagination',
            content: {
                'application/json': {
                    schema: z.object({
                        templates: z.array(z.object({
                            id: z.string(),
                            name: z.string(),
                            description: z.string().optional(),
                            category: z.string().optional(),
                            tags: z.array(z.string()),
                            isPublic: z.boolean(),
                            usageCount: z.number(),
                            createdAt: z.string().datetime(),
                            updatedAt: z.string().datetime(),
                            creator: z.object({
                                id: z.string(),
                                name: z.string(),
                                email: z.string(),
                            }),
                            permissions: z.object({
                                canView: z.boolean(),
                                canEdit: z.boolean(),
                                canDelete: z.boolean(),
                                canDuplicate: z.boolean(),
                                canShare: z.boolean(),
                                canUse: z.boolean(),
                            }),
                        })),
                        total: z.number(),
                        hasMore: z.boolean(),
                        pagination: z.object({
                            limit: z.number(),
                            offset: z.number(),
                            total: z.number(),
                            pages: z.number(),
                            currentPage: z.number(),
                        }),
                    }),
                },
            },
        },
    },
});

templateRoutes.openapi(listTemplatesRoute, async (c) => {
    try {
        const query = c.req.valid('query');
        const apiContext = c.get('apiContext');

        if (!apiContext.user) {
            throw new HTTPException(401, {
                message: 'Authentication required',
            });
        }

        const where: any = {
            OR: [
                { organizationId: apiContext.user.organizationId },
                { isPublic: true },
            ],
            isActive: true,
        };

        if (query.search) {
            where.AND = [
                where.AND || {},
                {
                    OR: [
                        { name: { contains: query.search, mode: 'insensitive' } },
                        { description: { contains: query.search, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        if (query.category) {
            where.category = query.category;
        }

        if (query.tags) {
            const tagArray = query.tags.split(',').map(tag => tag.trim());
            where.tags = { hasEvery: tagArray };
        }

        if (query.isPublic !== undefined) {
            where.isPublic = query.isPublic;
        }

        if (query.createdBy) {
            where.createdBy = query.createdBy;
        }

        const includeClause: any = {
            creator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    signingRequests: true,
                },
            },
        };

        if (query.includeFields) {
            includeClause.templateFields = {
                orderBy: [
                    { page: 'asc' },
                    { y: 'asc' },
                    { x: 'asc' },
                ],
            };
        }

        if (query.includeRecipients) {
            includeClause.templateRecipients = {
                orderBy: { order: 'asc' },
            };
        }

        const [templates, total] = await Promise.all([
            prisma.template.findMany({
                where,
                orderBy: query.sortBy === 'usageCount'
                    ? { signingRequests: { _count: query.sortOrder } }
                    : { [query.sortBy]: query.sortOrder },
                take: query.limit,
                skip: query.offset,
                include: includeClause,
            }),
            prisma.template.count({ where }),
        ]);

        // Create a simple cache implementation for the TemplateService
        const cache = {
            get: async (key: string) => null,
            set: async (key: string, value: any, ttl?: number) => { },
            del: async (key: string) => { },
            clear: async () => { },
        };

        // Calculate permissions for each template
        const templateService = new TemplateService(prisma, cache);
        const templatesWithPermissions = await Promise.all(
            templates.map(async (template) => {
                const templateWithPermissions = await templateService.getTemplateById(
                    template.id,
                    apiContext.user!.id,
                    apiContext.user!.organizationId
                );

                return {
                    ...template,
                    usageCount: template._count.signingRequests,
                    permissions: templateWithPermissions?.permissions || {
                        canView: false,
                        canEdit: false,
                        canDelete: false,
                        canDuplicate: false,
                        canShare: false,
                        canUse: false,
                    },
                };
            })
        );

        return c.json({
            templates: templatesWithPermissions,
            total,
            hasMore: query.offset + query.limit < total,
            pagination: {
                limit: query.limit,
                offset: query.offset,
                total,
                pages: Math.ceil(total / query.limit),
                currentPage: Math.floor(query.offset / query.limit) + 1,
            },
        });
    } catch (error) {
        throw new HTTPException(500, {
            message: 'Internal server error while listing templates',
        });
    }
});

// Get template by ID endpoint
const getTemplateRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Templates'],
    summary: 'Get template with comprehensive details and permissions',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
        query: z.object({
            includeFields: z.string().transform(val => val === 'true').default('true'),
            includeRecipients: z.string().transform(val => val === 'true').default('true'),
            includeAnalytics: z.string().transform(val => val === 'true').default('false'),
            includeVersionHistory: z.string().transform(val => val === 'true').default('false'),
            includeShares: z.string().transform(val => val === 'true').default('false'),
        }),
    },
    responses: {
        200: {
            description: 'Template details',
            content: {
                'application/json': {
                    schema: z.object({
                        template: z.object({
                            id: z.string(),
                            name: z.string(),
                            description: z.string().optional(),
                            documentId: z.string(),
                            organizationId: z.string(),
                            createdBy: z.string(),
                            isPublic: z.boolean(),
                            category: z.string().optional(),
                            tags: z.array(z.string()),
                            settings: z.record(z.any()),
                            createdAt: z.string().datetime(),
                            updatedAt: z.string().datetime(),
                            permissions: z.object({
                                canView: z.boolean(),
                                canEdit: z.boolean(),
                                canDelete: z.boolean(),
                                canDuplicate: z.boolean(),
                                canShare: z.boolean(),
                                canUse: z.boolean(),
                            }),
                        }),
                        analytics: z.any().optional(),
                        shares: z.array(z.any()).optional(),
                    }),
                },
            },
        },
        404: {
            description: 'Template not found',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
        },
    },
});

templateRoutes.openapi(getTemplateRoute, async (c) => {
    try {
        const { id } = c.req.valid('param');
        const query = c.req.valid('query');
        const apiContext = c.get('apiContext');

        if (!apiContext.user) {
            throw new HTTPException(401, {
                message: 'Authentication required',
            });
        }

        // Create a simple cache implementation for the TemplateService
        const cache = {
            get: async (key: string) => null,
            set: async (key: string, value: any, ttl?: number) => { },
            del: async (key: string) => { },
            clear: async () => { },
        };

        const templateService = new TemplateService(prisma, cache);

        const template = await templateService.getTemplateByIdOptimized(
            id,
            apiContext.user.id,
            apiContext.user.organizationId,
            {
                includeFields: query.includeFields,
                includeRecipients: query.includeRecipients,
                includeAnalytics: query.includeAnalytics,
            }
        );

        if (!template) {
            throw new HTTPException(404, {
                message: 'Template not found',
            });
        }

        let analytics = null;
        if (query.includeAnalytics) {
            analytics = await templateService.getTemplateAnalytics(
                id,
                apiContext.user.id,
                apiContext.user.organizationId
            );
        }

        let shares = null;
        if (query.includeShares) {
            const sharesResult = await templateService.getTemplateShares(
                id,
                apiContext.user.id,
                apiContext.user.organizationId
            );
            shares = sharesResult.success ? sharesResult.shares : [];
        }

        return c.json({
            template,
            analytics,
            shares,
        });
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, {
            message: 'Internal server error while getting template',
        });
    }
});

// Share template endpoint
const shareTemplateRoute = createRoute({
    method: 'post',
    path: '/{id}/share',
    tags: ['Templates'],
    summary: 'Share template with enhanced permissions and approval workflow',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
        body: {
            content: {
                'application/json': {
                    schema: ShareTemplateSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Template shared successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        results: z.array(z.object({
                            success: z.boolean(),
                            shareId: z.string().optional(),
                            errors: z.array(z.string()).optional(),
                        })),
                        summary: z.object({
                            total: z.number(),
                            successful: z.number(),
                            failed: z.number(),
                        }),
                        message: z.string(),
                    }),
                },
            },
        },
    },
});

templateRoutes.openapi(shareTemplateRoute, async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const apiContext = c.get('apiContext');

        if (!apiContext.user) {
            throw new HTTPException(401, {
                message: 'Authentication required',
            });
        }

        // Create a simple cache implementation for the TemplateService
        const cache = {
            get: async (key: string) => null,
            set: async (key: string, value: any, ttl?: number) => { },
            del: async (key: string) => { },
            clear: async () => { },
        };

        const templateService = new TemplateService(prisma, cache);

        const results = [];
        for (const shareRequest of body.shareRequests) {
            const result = await templateService.shareTemplateEnhanced(
                {
                    templateId: id,
                    ...shareRequest,
                    options: shareRequest.options ? {
                        ...shareRequest.options,
                        expiresAt: shareRequest.options.expiresAt ? new Date(shareRequest.options.expiresAt) : undefined,
                    } : undefined,
                },
                apiContext.user.id,
                apiContext.user.organizationId
            );
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return c.json({
            success: failureCount === 0,
            results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failureCount,
            },
            message: `Shared template with ${successCount} recipients${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        });
    } catch (error) {
        throw new HTTPException(500, {
            message: 'Internal server error while sharing template',
        });
    }
});

// Instantiate template endpoint
const instantiateTemplateRoute = createRoute({
    method: 'post',
    path: '/{id}/instantiate',
    tags: ['Templates'],
    summary: 'Instantiate template with comprehensive validation and field mapping',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
        body: {
            content: {
                'application/json': {
                    schema: InstantiateTemplateSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Template instantiated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        documentId: z.string(),
                        signingRequestId: z.string(),
                        validation: z.any(),
                        message: z.string(),
                    }),
                },
            },
        },
        400: {
            description: 'Bad request - validation failed',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        details: z.array(z.string()).optional(),
                    }),
                },
            },
        },
    },
});

templateRoutes.openapi(instantiateTemplateRoute, async (c) => {
    try {
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');
        const apiContext = c.get('apiContext');

        if (!apiContext.user) {
            throw new HTTPException(401, {
                message: 'Authentication required',
            });
        }

        // Create a simple cache implementation for the TemplateService
        const cache = {
            get: async (key: string) => null,
            set: async (key: string, value: any, ttl?: number) => { },
            del: async (key: string) => { },
            clear: async () => { },
        };

        const templateService = new TemplateService(prisma, cache);

        const instantiationData = {
            templateId: id,
            ...body,
            customizations: body.customizations ? {
                ...body.customizations,
                expirationDate: body.customizations.expirationDate ? new Date(body.customizations.expirationDate) : undefined,
            } : undefined,
        };

        // Validate instantiation data first
        const validation = await templateService.previewTemplateInstantiation(
            instantiationData,
            apiContext.user.id,
            apiContext.user.organizationId
        );

        if (!validation.success) {
            throw new HTTPException(400, {
                message: validation.errors?.join(', ') || 'Template instantiation validation failed',
            });
        }

        // Proceed with instantiation
        const result = await templateService.instantiateTemplate(
            instantiationData,
            apiContext.user.id,
            apiContext.user.organizationId
        );

        if (!result.success) {
            throw new HTTPException(400, {
                message: result.errors?.join(', ') || 'Failed to instantiate template',
            });
        }

        return c.json({
            success: true,
            documentId: result.documentId,
            signingRequestId: result.signingRequestId,
            validation: validation.validation,
            message: 'Template instantiated successfully with validation',
        }, 201);
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, {
            message: 'Internal server error while instantiating template',
        });
    }
});

// Get template analytics endpoint
const getTemplateAnalyticsRoute = createRoute({
    method: 'get',
    path: '/{id}/analytics',
    tags: ['Templates'],
    summary: 'Get comprehensive template analytics and reporting',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string(),
        }),
        query: z.object({
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional(),
            includeRecommendations: z.string().transform(val => val === 'true').default('true'),
            includeUsagePatterns: z.string().transform(val => val === 'true').default('true'),
            includeComparison: z.string().transform(val => val === 'true').default('false'),
        }),
    },
    responses: {
        200: {
            description: 'Template analytics data',
            content: {
                'application/json': {
                    schema: z.object({
                        analytics: z.object({
                            totalUsage: z.number(),
                            completionRate: z.number(),
                            averageCompletionTime: z.number(),
                            popularFields: z.array(z.any()),
                            usageByPeriod: z.array(z.any()),
                            recipientAnalytics: z.array(z.any()),
                        }),
                        recommendations: z.array(z.string()).optional(),
                        usagePatterns: z.any().optional(),
                        comparison: z.any().optional(),
                    }),
                },
            },
        },
        404: {
            description: 'Template not found',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
        },
    },
});

templateRoutes.openapi(getTemplateAnalyticsRoute, async (c) => {
    try {
        const { id } = c.req.valid('param');
        const query = c.req.valid('query');
        const apiContext = c.get('apiContext');

        if (!apiContext.user) {
            throw new HTTPException(401, {
                message: 'Authentication required',
            });
        }

        // Create a simple cache implementation for the TemplateService
        const cache = {
            get: async (key: string) => null,
            set: async (key: string, value: any, ttl?: number) => { },
            del: async (key: string) => { },
            clear: async () => { },
        };

        const templateService = new TemplateService(prisma, cache);

        const analytics = await templateService.getTemplateAnalytics(
            id,
            apiContext.user.id,
            apiContext.user.organizationId,
            query.startDate ? new Date(query.startDate) : undefined,
            query.endDate ? new Date(query.endDate) : undefined
        );

        if (!analytics) {
            throw new HTTPException(404, {
                message: 'Template analytics not found',
            });
        }

        let recommendations = null;
        let usagePatterns = null;
        let comparison = null;

        if (query.includeRecommendations) {
            // Get performance recommendations
            const metricsResult = await templateService.getTemplatePerformanceMetrics(
                id,
                apiContext.user.id,
                apiContext.user.organizationId
            );
            recommendations = metricsResult?.recommendations || [];
        }

        if (query.includeUsagePatterns) {
            // Get usage patterns analysis
            usagePatterns = await templateService.getTemplateUsagePatterns(
                id,
                apiContext.user.id,
                apiContext.user.organizationId
            );
        }

        if (query.includeComparison) {
            // Get comparison with organization averages
            comparison = await templateService.getTemplateComparison(
                id,
                apiContext.user.id,
                apiContext.user.organizationId
            );
        }

        return c.json({
            analytics,
            recommendations,
            usagePatterns,
            comparison,
        });
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, {
            message: 'Internal server error while getting template analytics',
        });
    }
});