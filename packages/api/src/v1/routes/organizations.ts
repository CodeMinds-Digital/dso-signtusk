import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../../middleware/auth';

export const organizationRoutes = new OpenAPIHono();
organizationRoutes.use('*', authMiddleware);

// ============================================================================
// SCHEMAS
// ============================================================================

const OrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    domain: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']),
    tier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
    memberCount: z.number(),
    teamCount: z.number(),
    settings: z.object({
        enforceSSO: z.boolean(),
        requireTwoFactor: z.boolean(),
        allowedDomains: z.array(z.string()),
        sessionTimeout: z.number(),
        defaultDocumentRetention: z.number(),
        allowExternalSharing: z.boolean(),
        requireDocumentPassword: z.boolean(),
        defaultSigningOrder: z.enum(['sequential', 'parallel']),
        allowDelegation: z.boolean(),
        reminderFrequency: z.number(),
        enableWebhooks: z.boolean(),
        enableAPIAccess: z.boolean(),
        allowedIntegrations: z.array(z.string()),
        enableAuditLog: z.boolean(),
        dataRetentionPeriod: z.number(),
        enableEncryption: z.boolean(),
    }),
    branding: z.object({
        logo: z.string().url().optional(),
        primaryColor: z.string(),
        secondaryColor: z.string(),
        fontFamily: z.string(),
    }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

const TeamSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    organizationId: z.string(),
    permissions: z.object({
        level: z.enum(['BASIC', 'ADVANCED', 'ADMIN']),
        resources: z.array(z.string()),
    }),
    memberCount: z.number(),
    createdBy: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

const MemberSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']),
    status: z.enum(['ACTIVE', 'INVITED', 'SUSPENDED']),
    organizationId: z.string(),
    joinedAt: z.string().datetime(),
    lastActiveAt: z.string().datetime().optional(),
    teams: z.array(z.string())
});

const APIKeySchema = z.object({
    id: z.string(),
    name: z.string(),
    organizationId: z.string(),
    permissions: z.array(z.string()),
    isActive: z.boolean(),
    lastUsed: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    createdBy: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

const OrganizationCreateSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
    domain: z.string().optional(),
    tier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('FREE'),
});

const OrganizationUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    domain: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
    tier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
});

const TeamCreateSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    permissions: z.object({
        level: z.enum(['BASIC', 'ADVANCED', 'ADMIN']).default('BASIC'),
        resources: z.array(z.string()).default([]),
    }).optional(),
});

const TeamUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    permissions: z.object({
        level: z.enum(['BASIC', 'ADVANCED', 'ADMIN']),
        resources: z.array(z.string()),
    }).optional(),
});

const MemberInviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER', 'GUEST']).default('MEMBER'),
    teamIds: z.array(z.string()).optional(),
    message: z.string().optional(),
});

const MemberRoleUpdateSchema = z.object({
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']),
});

const APIKeyCreateSchema = z.object({
    name: z.string().min(1).max(100),
    permissions: z.array(z.string()),
    expiresAt: z.string().datetime().optional(),
});

// ============================================================================
// ORGANIZATION CRUD OPERATIONS
// ============================================================================

const createOrganizationRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Organizations'],
    summary: 'Create organization',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: OrganizationCreateSchema
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Organization created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        organization: OrganizationSchema,
                        message: z.string()
                    })
                }
            }
        },
        400: {
            description: 'Invalid input data',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        details: z.any().optional()
                    })
                }
            }
        }
    }
});

const getOrganizationRoute = createRoute({
    method: 'get',
    path: '/me',
    tags: ['Organizations'],
    summary: 'Get current organization',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Organization details',
            content: {
                'application/json': {
                    schema: z.object({
                        organization: OrganizationSchema
                    })
                }
            }
        },
        404: {
            description: 'Organization not found',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        }
    }
});

const getOrganizationByIdRoute = createRoute({
    method: 'get',
    path: '/{organizationId}',
    tags: ['Organizations'],
    summary: 'Get organization by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        })
    },
    responses: {
        200: {
            description: 'Organization details',
            content: {
                'application/json': {
                    schema: z.object({
                        organization: OrganizationSchema
                    })
                }
            }
        },
        404: {
            description: 'Organization not found',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        }
    }
});

const listOrganizationsRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Organizations'],
    summary: 'List organizations',
    security: [{ bearerAuth: [] }],
    request: {
        query: z.object({
            limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
            offset: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
            search: z.string().optional(),
            status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
            tier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
            sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'memberCount']).default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
        })
    },
    responses: {
        200: {
            description: 'Organizations list',
            content: {
                'application/json': {
                    schema: z.object({
                        organizations: z.array(OrganizationSchema),
                        total: z.number(),
                        hasMore: z.boolean()
                    })
                }
            }
        }
    }
});

const updateOrganizationRoute = createRoute({
    method: 'put',
    path: '/{organizationId}',
    tags: ['Organizations'],
    summary: 'Update organization',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: OrganizationUpdateSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Organization updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        organization: OrganizationSchema,
                        message: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Organization not found',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        }
    }
});

const deleteOrganizationRoute = createRoute({
    method: 'delete',
    path: '/{organizationId}',
    tags: ['Organizations'],
    summary: 'Delete organization',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        confirmationText: z.string()
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Organization deleted successfully',
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
            description: 'Invalid confirmation text',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        }
    }
});

// ============================================================================
// TEAM MANAGEMENT ROUTES
// ============================================================================

const createTeamRoute = createRoute({
    method: 'post',
    path: '/{organizationId}/teams',
    tags: ['Organizations', 'Teams'],
    summary: 'Create team',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: TeamCreateSchema
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Team created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        team: TeamSchema,
                        message: z.string()
                    })
                }
            }
        }
    }
});

const listTeamsRoute = createRoute({
    method: 'get',
    path: '/{organizationId}/teams',
    tags: ['Organizations', 'Teams'],
    summary: 'List teams',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        }),
        query: z.object({
            limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
            offset: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
            search: z.string().optional(),
        })
    },
    responses: {
        200: {
            description: 'Teams list',
            content: {
                'application/json': {
                    schema: z.object({
                        teams: z.array(TeamSchema),
                        total: z.number(),
                        hasMore: z.boolean()
                    })
                }
            }
        }
    }
});

const updateTeamRoute = createRoute({
    method: 'put',
    path: '/{organizationId}/teams/{teamId}',
    tags: ['Organizations', 'Teams'],
    summary: 'Update team',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string(),
            teamId: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: TeamUpdateSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Team updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        team: TeamSchema,
                        message: z.string()
                    })
                }
            }
        }
    }
});

const deleteTeamRoute = createRoute({
    method: 'delete',
    path: '/{organizationId}/teams/{teamId}',
    tags: ['Organizations', 'Teams'],
    summary: 'Delete team',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string(),
            teamId: z.string()
        })
    },
    responses: {
        200: {
            description: 'Team deleted successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        }
    }
});

// ============================================================================
// MEMBER MANAGEMENT ROUTES
// ============================================================================

const listMembersRoute = createRoute({
    method: 'get',
    path: '/{organizationId}/members',
    tags: ['Organizations', 'Members'],
    summary: 'List organization members',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        }),
        query: z.object({
            limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
            offset: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
            search: z.string().optional(),
            role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']).optional(),
            status: z.enum(['ACTIVE', 'INVITED', 'SUSPENDED']).optional(),
        })
    },
    responses: {
        200: {
            description: 'Members list',
            content: {
                'application/json': {
                    schema: z.object({
                        members: z.array(MemberSchema),
                        total: z.number(),
                        hasMore: z.boolean()
                    })
                }
            }
        }
    }
});

const inviteMemberRoute = createRoute({
    method: 'post',
    path: '/{organizationId}/members/invite',
    tags: ['Organizations', 'Members'],
    summary: 'Invite member to organization',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: MemberInviteSchema
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Member invitation sent successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        invitation: z.object({
                            id: z.string(),
                            email: z.string().email(),
                            role: z.enum(['ADMIN', 'MEMBER', 'GUEST']),
                            organizationId: z.string(),
                            teamIds: z.array(z.string()),
                            message: z.string().optional(),
                            invitedBy: z.string(),
                            invitedAt: z.string().datetime(),
                            expiresAt: z.string().datetime(),
                            status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'])
                        }),
                        message: z.string()
                    })
                }
            }
        }
    }
});

const updateMemberRoleRoute = createRoute({
    method: 'put',
    path: '/{organizationId}/members/{userId}/role',
    tags: ['Organizations', 'Members'],
    summary: 'Update member role',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string(),
            userId: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: MemberRoleUpdateSchema
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Member role updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        member: MemberSchema,
                        message: z.string()
                    })
                }
            }
        }
    }
});

const removeMemberRoute = createRoute({
    method: 'delete',
    path: '/{organizationId}/members/{userId}',
    tags: ['Organizations', 'Members'],
    summary: 'Remove member from organization',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string(),
            userId: z.string()
        })
    },
    responses: {
        200: {
            description: 'Member removed successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        }
    }
});

// ============================================================================
// API KEY MANAGEMENT ROUTES
// ============================================================================

const createAPIKeyRoute = createRoute({
    method: 'post',
    path: '/{organizationId}/api-keys',
    tags: ['Organizations', 'API Keys'],
    summary: 'Create API key',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: APIKeyCreateSchema
                }
            }
        }
    },
    responses: {
        201: {
            description: 'API key created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        apiKey: APIKeySchema.extend({
                            key: z.string()
                        }),
                        message: z.string()
                    })
                }
            }
        }
    }
});

const listAPIKeysRoute = createRoute({
    method: 'get',
    path: '/{organizationId}/api-keys',
    tags: ['Organizations', 'API Keys'],
    summary: 'List API keys',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string()
        })
    },
    responses: {
        200: {
            description: 'API keys list',
            content: {
                'application/json': {
                    schema: z.object({
                        apiKeys: z.array(APIKeySchema)
                    })
                }
            }
        }
    }
});

const deleteAPIKeyRoute = createRoute({
    method: 'delete',
    path: '/{organizationId}/api-keys/{keyId}',
    tags: ['Organizations', 'API Keys'],
    summary: 'Delete API key',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            organizationId: z.string(),
            keyId: z.string()
        })
    },
    responses: {
        200: {
            description: 'API key deleted successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        }
    }
});

// ============================================================================
// ROUTE IMPLEMENTATIONS
// ============================================================================

organizationRoutes.openapi(createOrganizationRoute, async (c) => {
    const apiContext = c.get('apiContext');
    const body = c.req.valid('json');

    // Simulate organization creation
    const organizationId = `org_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const organization = {
        id: organizationId,
        name: body.name,
        slug: body.slug,
        domain: body.domain,
        status: 'ACTIVE' as const,
        tier: body.tier,
        memberCount: 1,
        teamCount: 0,
        settings: {
            enforceSSO: false,
            requireTwoFactor: false,
            allowedDomains: [],
            sessionTimeout: 480,
            defaultDocumentRetention: 365,
            allowExternalSharing: true,
            requireDocumentPassword: false,
            defaultSigningOrder: 'sequential' as const,
            allowDelegation: true,
            reminderFrequency: 3,
            enableWebhooks: true,
            enableAPIAccess: true,
            allowedIntegrations: [],
            enableAuditLog: true,
            dataRetentionPeriod: 2555,
            enableEncryption: true,
        },
        branding: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            fontFamily: 'Inter',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return c.json({
        success: true,
        organization,
        message: 'Organization created successfully',
    }, 201);
});

organizationRoutes.openapi(getOrganizationRoute, async (c) => {
    const apiContext = c.get('apiContext');

    const organization = {
        id: apiContext.organizationId!,
        name: 'Sample Organization',
        slug: 'sample-org',
        domain: 'sample.com',
        status: 'ACTIVE' as const,
        tier: 'PROFESSIONAL' as const,
        memberCount: 25,
        teamCount: 5,
        settings: {
            enforceSSO: false,
            requireTwoFactor: true,
            allowedDomains: ['sample.com'],
            sessionTimeout: 480,
            defaultDocumentRetention: 365,
            allowExternalSharing: true,
            requireDocumentPassword: false,
            defaultSigningOrder: 'sequential' as const,
            allowDelegation: true,
            reminderFrequency: 3,
            enableWebhooks: true,
            enableAPIAccess: true,
            allowedIntegrations: ['salesforce', 'slack'],
            enableAuditLog: true,
            dataRetentionPeriod: 2555,
            enableEncryption: true,
        },
        branding: {
            logo: 'https://example.com/logo.png',
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            fontFamily: 'Inter',
        },
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return c.json({ organization });
});

organizationRoutes.openapi(getOrganizationByIdRoute, async (c) => {
    const { organizationId } = c.req.valid('param');

    const organization = {
        id: organizationId,
        name: 'Sample Organization',
        slug: 'sample-org',
        domain: 'sample.com',
        status: 'ACTIVE' as const,
        tier: 'PROFESSIONAL' as const,
        memberCount: 25,
        teamCount: 5,
        settings: {
            enforceSSO: false,
            requireTwoFactor: true,
            allowedDomains: ['sample.com'],
            sessionTimeout: 480,
            defaultDocumentRetention: 365,
            allowExternalSharing: true,
            requireDocumentPassword: false,
            defaultSigningOrder: 'sequential' as const,
            allowDelegation: true,
            reminderFrequency: 3,
            enableWebhooks: true,
            enableAPIAccess: true,
            allowedIntegrations: ['salesforce', 'slack'],
            enableAuditLog: true,
            dataRetentionPeriod: 2555,
            enableEncryption: true,
        },
        branding: {
            logo: 'https://example.com/logo.png',
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            fontFamily: 'Inter',
        },
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return c.json({ organization });
});

organizationRoutes.openapi(listOrganizationsRoute, async (c) => {
    const query = c.req.valid('query');

    // Simulate organization listing
    const organizations = Array.from({ length: Math.min(query.limit, 5) }, (_, i) => ({
        id: `org_${i + 1}`,
        name: `Organization ${i + 1}`,
        slug: `org-${i + 1}`,
        domain: `org${i + 1}.com`,
        status: 'ACTIVE' as const,
        tier: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'][i % 4] as any,
        memberCount: 10 + i * 5,
        teamCount: i + 1,
        settings: {
            enforceSSO: false,
            requireTwoFactor: false,
            allowedDomains: [],
            sessionTimeout: 480,
            defaultDocumentRetention: 365,
            allowExternalSharing: true,
            requireDocumentPassword: false,
            defaultSigningOrder: 'sequential' as const,
            allowDelegation: true,
            reminderFrequency: 3,
            enableWebhooks: true,
            enableAPIAccess: true,
            allowedIntegrations: [],
            enableAuditLog: true,
            dataRetentionPeriod: 2555,
            enableEncryption: true,
        },
        branding: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            fontFamily: 'Inter',
        },
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));

    const total = 25;

    return c.json({
        organizations,
        total,
        hasMore: query.offset + query.limit < total,
    });
});

organizationRoutes.openapi(updateOrganizationRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');

    const organization = {
        id: organizationId,
        name: body.name || 'Updated Organization',
        slug: 'updated-org',
        domain: body.domain,
        status: body.status || 'ACTIVE' as const,
        tier: body.tier || 'PROFESSIONAL' as const,
        memberCount: 25,
        teamCount: 5,
        settings: {
            enforceSSO: false,
            requireTwoFactor: true,
            allowedDomains: ['sample.com'],
            sessionTimeout: 480,
            defaultDocumentRetention: 365,
            allowExternalSharing: true,
            requireDocumentPassword: false,
            defaultSigningOrder: 'sequential' as const,
            allowDelegation: true,
            reminderFrequency: 3,
            enableWebhooks: true,
            enableAPIAccess: true,
            allowedIntegrations: ['salesforce', 'slack'],
            enableAuditLog: true,
            dataRetentionPeriod: 2555,
            enableEncryption: true,
        },
        branding: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            fontFamily: 'Inter',
        },
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return c.json({
        success: true,
        organization,
        message: 'Organization updated successfully',
    });
});

organizationRoutes.openapi(deleteOrganizationRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const { confirmationText } = c.req.valid('json');

    if (confirmationText !== 'DELETE') {
        return c.json({
            error: 'Invalid confirmation text. Please type "DELETE" to confirm.',
        }, 400);
    }

    return c.json({
        success: true,
        message: 'Organization deleted successfully',
    });
});

// Team Management Routes
organizationRoutes.openapi(createTeamRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const apiContext = c.get('apiContext');

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const team = {
        id: teamId,
        name: body.name,
        description: body.description,
        organizationId,
        permissions: body.permissions || { level: 'BASIC' as const, resources: [] },
        memberCount: 0,
        createdBy: apiContext.user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return c.json({
        success: true,
        team,
        message: 'Team created successfully',
    }, 201);
});

organizationRoutes.openapi(listTeamsRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const apiContext = c.get('apiContext');

    const teams = Array.from({ length: Math.min(query.limit, 3) }, (_, i) => ({
        id: `team_${i + 1}`,
        name: `Team ${i + 1}`,
        description: `Description for team ${i + 1}`,
        organizationId,
        permissions: { level: 'BASIC' as const, resources: [] },
        memberCount: 5 + i * 2,
        createdBy: apiContext.user?.id || '',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));

    const total = 8;

    return c.json({
        teams,
        total,
        hasMore: query.offset + query.limit < total,
    });
});

organizationRoutes.openapi(updateTeamRoute, async (c) => {
    const { organizationId, teamId } = c.req.valid('param');
    const body = c.req.valid('json');
    const apiContext = c.get('apiContext');

    const team = {
        id: teamId,
        name: body.name || 'Updated Team',
        description: body.description,
        organizationId,
        permissions: body.permissions || { level: 'BASIC' as const, resources: [] },
        memberCount: 5,
        createdBy: apiContext.user?.id || '',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return c.json({
        success: true,
        team,
        message: 'Team updated successfully',
    });
});

organizationRoutes.openapi(deleteTeamRoute, async (c) => {
    const { organizationId, teamId } = c.req.valid('param');

    return c.json({
        success: true,
        message: 'Team deleted successfully',
    });
});

// Member Management Routes
organizationRoutes.openapi(listMembersRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');

    const members = Array.from({ length: Math.min(query.limit, 5) }, (_, i) => ({
        id: `user_${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        role: ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'][i % 4] as any,
        status: 'ACTIVE' as const,
        organizationId,
        joinedAt: new Date(Date.now() - i * 86400000).toISOString(),
        lastActiveAt: new Date(Date.now() - i * 3600000).toISOString(),
        teams: [`team_${i + 1}`],
    }));

    const total = 25;

    return c.json({
        members,
        total,
        hasMore: query.offset + query.limit < total,
    });
});

organizationRoutes.openapi(inviteMemberRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const apiContext = c.get('apiContext');

    const invitation = {
        id: `invitation_${Date.now()}`,
        email: body.email,
        role: body.role,
        organizationId,
        teamIds: body.teamIds || [],
        message: body.message,
        invitedBy: apiContext.user?.id || '',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        status: 'PENDING' as const,
    };

    return c.json({
        success: true,
        invitation,
        message: 'Member invitation sent successfully',
    }, 201);
});

organizationRoutes.openapi(updateMemberRoleRoute, async (c) => {
    const { organizationId, userId } = c.req.valid('param');
    const { role } = c.req.valid('json');

    const member = {
        id: userId,
        email: 'user@example.com',
        name: 'Updated User',
        role,
        status: 'ACTIVE' as const,
        organizationId,
        joinedAt: new Date('2024-01-01').toISOString(),
        lastActiveAt: new Date().toISOString(),
        teams: ['team_1'],
    };

    return c.json({
        success: true,
        member,
        message: 'Member role updated successfully',
    });
});

organizationRoutes.openapi(removeMemberRoute, async (c) => {
    const { organizationId, userId } = c.req.valid('param');

    return c.json({
        success: true,
        message: 'Member removed successfully',
    });
});

// API Key Management Routes
organizationRoutes.openapi(createAPIKeyRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const body = c.req.valid('json');
    const apiContext = c.get('apiContext');

    const apiKey = {
        id: `key_${Date.now()}`,
        name: body.name,
        key: `dsa_${Math.random().toString(36).substring(2, 34)}`,
        organizationId,
        permissions: body.permissions,
        isActive: true,
        expiresAt: body.expiresAt,
        createdBy: apiContext.user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return c.json({
        success: true,
        apiKey,
        message: 'API key created successfully',
    }, 201);
});

organizationRoutes.openapi(listAPIKeysRoute, async (c) => {
    const { organizationId } = c.req.valid('param');
    const apiContext = c.get('apiContext');

    const apiKeys = Array.from({ length: 3 }, (_, i) => ({
        id: `key_${i + 1}`,
        name: `API Key ${i + 1}`,
        organizationId,
        permissions: ['read:documents', 'write:documents'],
        isActive: i !== 2, // Make one inactive for testing
        lastUsed: i === 0 ? new Date().toISOString() : undefined,
        expiresAt: i === 1 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        createdBy: apiContext.user?.id || '',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));

    return c.json({ apiKeys });
});

organizationRoutes.openapi(deleteAPIKeyRoute, async (c) => {
    const { organizationId, keyId } = c.req.valid('param');

    return c.json({
        success: true,
        message: 'API key deleted successfully',
    });
});