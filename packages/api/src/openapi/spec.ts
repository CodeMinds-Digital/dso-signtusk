// Use a generic type instead of importing from @hono/zod-openapi to avoid build issues
interface OpenAPIObject {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
        contact?: {
            name?: string;
            email?: string;
            url?: string;
        };
        license?: {
            name: string;
            url?: string;
        };
        termsOfService?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    security?: Array<Record<string, string[]>>;
    components?: any;
    paths?: any;
    tags?: Array<{
        name: string;
        description?: string;
    }>;
}

/**
 * Comprehensive OpenAPI specification for DocuSign Alternative API
 */
export const openAPISpec: OpenAPIObject = {
    openapi: '3.0.3',
    info: {
        title: 'Signtusk API',
        version: '1.0.0',
        description: `
# Signtusk REST API

A comprehensive, enterprise-grade e-signature platform API providing full document signing capabilities.

## Features

- **Document Management**: Upload, process, and organize documents
- **Digital Signatures**: Cryptographically secure signature workflows
- **Template System**: Reusable document templates with field placement
- **Organization Management**: Multi-tenant architecture with team support
- **Workflow Automation**: Advanced signing workflows with conditional logic
- **Analytics & Reporting**: Comprehensive usage analytics and custom reports
- **Integration Platform**: Webhooks, real-time updates, and third-party integrations

## Authentication

The API supports multiple authentication methods:

1. **Bearer Token**: JWT tokens for user authentication
2. **API Key**: Server-to-server authentication using API keys
3. **OAuth 2.0**: Third-party application integration

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Default**: 100 requests per 15 minutes per IP
- **Authentication**: 10 requests per 15 minutes per IP
- **API Key**: 1000 requests per hour per API key

Rate limit information is provided in response headers:
- \`X-RateLimit-Limit\`: Request limit for the current window
- \`X-RateLimit-Remaining\`: Remaining requests in the current window
- \`X-RateLimit-Reset\`: Unix timestamp when the rate limit resets

## Error Handling

The API uses standard HTTP status codes and returns detailed error information:

\`\`\`json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      {
        "path": "email",
        "message": "Invalid email format",
        "code": "invalid_string"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/auth/login",
  "requestId": "req_1705312200_abc123"
}
\`\`\`

## Versioning

The API uses URL-based versioning:
- Current version: \`/api/v1\`
- Version information: \`/api/versions\`

## Content Negotiation

The API supports multiple response formats:
- **JSON** (default): \`application/json\`
- **XML**: \`application/xml\`

Specify the desired format using the \`Accept\` header.
    `,
        contact: {
            name: 'Signtusk API Support',
            email: 'api-support@signtusk.com',
            url: 'https://docs.docusign-alternative.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        },
        termsOfService: 'https://docusign-alternative.com/terms'
    },
    servers: [
        {
            url: 'https://api.docusign-alternative.com',
            description: 'Production server'
        },
        {
            url: 'https://api-staging.docusign-alternative.com',
            description: 'Staging server'
        },
        {
            url: 'http://localhost:8080',
            description: 'Development server'
        }
    ],
    security: [
        {
            bearerAuth: []
        },
        {
            apiKey: []
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT token for user authentication'
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key for server-to-server authentication'
            }
        },
        schemas: {
            Error: {
                type: 'object',
                required: ['error', 'message', 'timestamp', 'path'],
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error type'
                    },
                    message: {
                        type: 'string',
                        description: 'Human-readable error message'
                    },
                    code: {
                        type: 'string',
                        description: 'Machine-readable error code'
                    },
                    details: {
                        type: 'object',
                        description: 'Additional error details'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Error timestamp'
                    },
                    path: {
                        type: 'string',
                        description: 'Request path that caused the error'
                    },
                    requestId: {
                        type: 'string',
                        description: 'Unique request identifier'
                    }
                }
            },
            User: {
                type: 'object',
                required: ['id', 'email', 'name', 'organizationId', 'createdAt'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique user identifier'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'User email address'
                    },
                    name: {
                        type: 'string',
                        description: 'User full name'
                    },
                    organizationId: {
                        type: 'string',
                        description: 'Organization identifier'
                    },
                    emailVerified: {
                        type: 'boolean',
                        description: 'Whether email is verified'
                    },
                    roles: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: 'User roles'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'User creation timestamp'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last update timestamp'
                    }
                }
            },
            Document: {
                type: 'object',
                required: ['id', 'name', 'status', 'createdAt'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique document identifier'
                    },
                    name: {
                        type: 'string',
                        description: 'Document name'
                    },
                    originalName: {
                        type: 'string',
                        description: 'Original filename'
                    },
                    status: {
                        type: 'string',
                        enum: ['draft', 'pending', 'completed', 'cancelled', 'expired'],
                        description: 'Document status'
                    },
                    size: {
                        type: 'string',
                        description: 'File size (human readable)'
                    },
                    recipients: {
                        type: 'integer',
                        description: 'Number of recipients'
                    },
                    completedSignatures: {
                        type: 'integer',
                        description: 'Number of completed signatures'
                    },
                    totalSignatures: {
                        type: 'integer',
                        description: 'Total number of required signatures'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Creation timestamp'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last update timestamp'
                    }
                }
            },
            PaginatedResponse: {
                type: 'object',
                required: ['data', 'pagination'],
                properties: {
                    data: {
                        type: 'array',
                        items: {},
                        description: 'Response data array'
                    },
                    pagination: {
                        type: 'object',
                        required: ['page', 'limit', 'total', 'totalPages'],
                        properties: {
                            page: {
                                type: 'integer',
                                minimum: 1,
                                description: 'Current page number'
                            },
                            limit: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 100,
                                description: 'Items per page'
                            },
                            total: {
                                type: 'integer',
                                minimum: 0,
                                description: 'Total number of items'
                            },
                            totalPages: {
                                type: 'integer',
                                minimum: 0,
                                description: 'Total number of pages'
                            },
                            hasNext: {
                                type: 'boolean',
                                description: 'Whether there are more pages'
                            },
                            hasPrev: {
                                type: 'boolean',
                                description: 'Whether there are previous pages'
                            }
                        }
                    }
                }
            }
        },
        responses: {
            BadRequest: {
                description: 'Bad Request',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        }
                    }
                }
            },
            Unauthorized: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        }
                    }
                }
            },
            Forbidden: {
                description: 'Forbidden',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        }
                    }
                }
            },
            NotFound: {
                description: 'Not Found',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        }
                    }
                }
            },
            TooManyRequests: {
                description: 'Too Many Requests',
                headers: {
                    'Retry-After': {
                        description: 'Number of seconds to wait before retrying',
                        schema: {
                            type: 'integer'
                        }
                    }
                },
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        }
                    }
                }
            },
            InternalServerError: {
                description: 'Internal Server Error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        }
                    }
                }
            }
        },
        parameters: {
            Page: {
                name: 'page',
                in: 'query',
                description: 'Page number for pagination',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    default: 1
                }
            },
            Limit: {
                name: 'limit',
                in: 'query',
                description: 'Number of items per page',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 20
                }
            },
            Sort: {
                name: 'sort',
                in: 'query',
                description: 'Field to sort by',
                schema: {
                    type: 'string'
                }
            },
            Order: {
                name: 'order',
                in: 'query',
                description: 'Sort order',
                schema: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                    default: 'desc'
                }
            }
        }
    },
    paths: {
        '/v1/health': {
            get: {
                summary: 'Health Check',
                description: 'Check the health status of the API',
                tags: ['System'],
                responses: {
                    '200': {
                        description: 'API is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'healthy' },
                                        timestamp: { type: 'string', format: 'date-time' },
                                        version: { type: 'string', example: '1.0.0' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/v1/documents': {
            get: {
                summary: 'List documents',
                description: 'Retrieve a paginated list of documents',
                tags: ['Documents'],
                parameters: [
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/Limit' },
                    { $ref: '#/components/parameters/Sort' },
                    { $ref: '#/components/parameters/Order' }
                ],
                responses: {
                    '200': {
                        description: 'List of documents',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/PaginatedResponse' },
                                        {
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Document' }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Upload document',
                description: 'Upload a new document for signing',
                tags: ['Documents'],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['file', 'name'],
                                properties: {
                                    file: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'Document file (PDF, DOCX, etc.)'
                                    },
                                    name: {
                                        type: 'string',
                                        description: 'Document name'
                                    },
                                    folderId: {
                                        type: 'string',
                                        description: 'Optional folder ID'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Document uploaded successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Document' }
                            }
                        }
                    }
                }
            }
        },
        '/v1/documents/{id}': {
            get: {
                summary: 'Get document',
                description: 'Retrieve a specific document by ID',
                tags: ['Documents'],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'Document ID'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Document details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Document' }
                            }
                        }
                    }
                }
            },
            put: {
                summary: 'Update document',
                description: 'Update document metadata',
                tags: ['Documents'],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'Document ID'
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    folderId: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Document updated successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Document' }
                            }
                        }
                    }
                }
            },
            delete: {
                summary: 'Delete document',
                description: 'Delete a document',
                tags: ['Documents'],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'Document ID'
                    }
                ],
                responses: {
                    '204': {
                        description: 'Document deleted successfully'
                    }
                }
            }
        },
        '/v1/signing/requests': {
            post: {
                summary: 'Create signing request',
                description: 'Create a new signing request',
                tags: ['Signing'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['documentId', 'recipients'],
                                properties: {
                                    documentId: {
                                        type: 'string',
                                        description: 'Document ID to sign'
                                    },
                                    recipients: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['email', 'name', 'role'],
                                            properties: {
                                                email: { type: 'string', format: 'email' },
                                                name: { type: 'string' },
                                                role: { type: 'string', enum: ['signer', 'approver', 'viewer'] }
                                            }
                                        }
                                    },
                                    message: {
                                        type: 'string',
                                        description: 'Custom message for recipients'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Signing request created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        documentId: { type: 'string' },
                                        status: { type: 'string' },
                                        signingUrl: { type: 'string' },
                                        createdAt: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and session management'
        },
        {
            name: 'Users',
            description: 'User profile and account management'
        },
        {
            name: 'Documents',
            description: 'Document upload, processing, and management'
        },
        {
            name: 'Templates',
            description: 'Document template creation and management'
        },
        {
            name: 'Signing',
            description: 'Digital signature workflows and processes'
        },
        {
            name: 'Organizations',
            description: 'Organization and team management'
        },
        {
            name: 'Analytics',
            description: 'Usage analytics and reporting'
        },
        {
            name: 'Webhooks',
            description: 'Webhook configuration and management'
        },
        {
            name: 'System',
            description: 'System health and version information'
        }
    ]
};

export type OpenAPISpec = typeof openAPISpec;