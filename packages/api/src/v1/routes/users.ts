import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../../middleware/auth';

export const userRoutes = new OpenAPIHono();

// Apply authentication to all user routes
userRoutes.use('*', authMiddleware);

/**
 * Get current user profile
 */
const getProfileRoute = createRoute({
    method: 'get',
    path: '/me',
    tags: ['Users'],
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user\'s profile information',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'User profile',
            content: {
                'application/json': {
                    schema: z.object({
                        user: z.object({
                            id: z.string(),
                            email: z.string().email(),
                            name: z.string(),
                            organizationId: z.string(),
                            emailVerified: z.boolean(),
                            avatar: z.string().url().optional(),
                            roles: z.array(z.string()),
                            preferences: z.object({
                                language: z.string().default('en'),
                                timezone: z.string().default('UTC'),
                                notifications: z.object({
                                    email: z.boolean().default(true),
                                    push: z.boolean().default(true)
                                })
                            }).optional(),
                            createdAt: z.string().datetime(),
                            updatedAt: z.string().datetime()
                        })
                    })
                }
            }
        }
    }
});

userRoutes.openapi(getProfileRoute, async (c) => {
    const apiContext = c.get('apiContext');

    return c.json({
        user: {
            id: apiContext.user!.id,
            email: apiContext.user!.email,
            name: apiContext.user!.name,
            organizationId: apiContext.user!.organizationId,
            emailVerified: apiContext.user!.emailVerified,
            roles: apiContext.user!.roles || ['user'],
            preferences: {
                language: 'en',
                timezone: 'UTC',
                notifications: {
                    email: true,
                    push: true
                }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    });
});

/**
 * Update user profile
 */
const updateProfileRoute = createRoute({
    method: 'patch',
    path: '/me',
    tags: ['Users'],
    summary: 'Update user profile',
    description: 'Update the authenticated user\'s profile information',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().min(1).optional(),
                        avatar: z.string().url().optional(),
                        preferences: z.object({
                            language: z.string().optional(),
                            timezone: z.string().optional(),
                            notifications: z.object({
                                email: z.boolean().optional(),
                                push: z.boolean().optional()
                            }).optional()
                        }).optional()
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Profile updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        user: z.object({
                            id: z.string(),
                            email: z.string().email(),
                            name: z.string(),
                            organizationId: z.string(),
                            emailVerified: z.boolean(),
                            avatar: z.string().url().optional(),
                            roles: z.array(z.string()),
                            preferences: z.object({
                                language: z.string(),
                                timezone: z.string(),
                                notifications: z.object({
                                    email: z.boolean(),
                                    push: z.boolean()
                                })
                            }),
                            updatedAt: z.string().datetime()
                        }),
                        message: z.string()
                    })
                }
            }
        }
    }
});

userRoutes.openapi(updateProfileRoute, async (c) => {
    const apiContext = c.get('apiContext');
    const updates = c.req.valid('json');

    // In real implementation, update the database
    const updatedUser = {
        id: apiContext.user!.id,
        email: apiContext.user!.email,
        name: updates.name || apiContext.user!.name,
        organizationId: apiContext.user!.organizationId,
        emailVerified: apiContext.user!.emailVerified,
        avatar: updates.avatar,
        roles: apiContext.user!.roles || ['user'],
        preferences: {
            language: updates.preferences?.language || 'en',
            timezone: updates.preferences?.timezone || 'UTC',
            notifications: {
                email: updates.preferences?.notifications?.email ?? true,
                push: updates.preferences?.notifications?.push ?? true
            }
        },
        updatedAt: new Date().toISOString()
    };

    return c.json({
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
    });
});

/**
 * Change password
 */
const changePasswordRoute = createRoute({
    method: 'post',
    path: '/me/password',
    tags: ['Users'],
    summary: 'Change password',
    description: 'Change the authenticated user\'s password',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        currentPassword: z.string().min(1, 'Current password is required'),
                        newPassword: z.string()
                            .min(8, 'Password must be at least 8 characters')
                            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
                            .regex(/\d/, 'Password must contain at least one number')
                            .regex(/[@$!%*?&]/, 'Password must contain at least one special character')
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Password changed successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        },
        400: {
            description: 'Invalid current password'
        }
    }
});

userRoutes.openapi(changePasswordRoute, async (c) => {
    const { currentPassword, newPassword } = c.req.valid('json');

    // In real implementation, verify current password and update
    // For demo purposes, assume current password is valid

    return c.json({
        success: true,
        message: 'Password changed successfully'
    });
});

/**
 * Get user activity log
 */
const getActivityRoute = createRoute({
    method: 'get',
    path: '/me/activity',
    tags: ['Users'],
    summary: 'Get user activity log',
    description: 'Retrieve the authenticated user\'s recent activity',
    security: [{ bearerAuth: [] }],
    request: {
        query: z.object({
            page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
            limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
            type: z.enum(['login', 'document', 'signature', 'all']).optional().default('all')
        })
    },
    responses: {
        200: {
            description: 'User activity log',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.object({
                            id: z.string(),
                            type: z.string(),
                            description: z.string(),
                            metadata: z.record(z.any()).optional(),
                            ipAddress: z.string(),
                            userAgent: z.string(),
                            timestamp: z.string().datetime()
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

userRoutes.openapi(getActivityRoute, async (c) => {
    const { page, limit, type } = c.req.valid('query');

    // Mock activity data
    const activities = [
        {
            id: 'activity_1',
            type: 'login',
            description: 'User logged in',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
            id: 'activity_2',
            type: 'document',
            description: 'Document uploaded: Contract.pdf',
            metadata: { documentId: 'doc_123', fileName: 'Contract.pdf' },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
            id: 'activity_3',
            type: 'signature',
            description: 'Document signed: NDA Agreement',
            metadata: { documentId: 'doc_456', signatureId: 'sig_789' },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        }
    ];

    const filteredActivities = type === 'all' ? activities : activities.filter(a => a.type === type);
    const total = filteredActivities.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

    return c.json({
        data: paginatedActivities,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    });
});