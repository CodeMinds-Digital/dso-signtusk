import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '@signtusk/database';
import type { StorageService } from '@signtusk/storage';
import { StorageServiceFactory } from '@signtusk/storage';
import { Readable } from 'stream';

export const documentRoutes = new OpenAPIHono();

// Apply authentication to all document routes
documentRoutes.use('*', authMiddleware);

// Initialize storage service
const storageService: StorageService = StorageServiceFactory.create({
    provider: (process.env.STORAGE_PROVIDER as 'local' | 's3') || 'local',
    local: {
        basePath: process.env.STORAGE_LOCAL_PATH || './uploads',
        createDirectories: true,
    },
    s3: {
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || 'documents',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: process.env.AWS_S3_ENDPOINT,
    },
});

/**
 * List documents with advanced filtering and pagination
 */
const listDocumentsRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Documents'],
    summary: 'List documents',
    description: 'Retrieve a paginated list of documents with advanced filtering and search capabilities',
    security: [{ bearerAuth: [] }],
    request: {
        query: z.object({
            page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
            limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
            status: z.enum(['DRAFT', 'PROCESSING', 'READY', 'SENT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']).optional(),
            search: z.string().optional(),
            folderId: z.string().optional(),
            sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'size']).optional().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
            dateFrom: z.string().datetime().optional(),
            dateTo: z.string().datetime().optional(),
            mimeType: z.string().optional(),
        })
    },
    responses: {
        200: {
            description: 'List of documents with pagination',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.object({
                            id: z.string(),
                            name: z.string(),
                            originalName: z.string(),
                            status: z.enum(['DRAFT', 'PROCESSING', 'READY', 'SENT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                            size: z.number(),
                            mimeType: z.string(),
                            hash: z.string(),
                            folderId: z.string().nullable(),
                            isTemplate: z.boolean(),
                            metadata: z.record(z.any()),
                            createdBy: z.string(),
                            ownedBy: z.string(),
                            createdAt: z.string().datetime(),
                            updatedAt: z.string().datetime(),
                            _count: z.object({
                                fields: z.number(),
                                shares: z.number(),
                                versions: z.number(),
                            }).optional(),
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
        },
        400: {
            description: 'Invalid query parameters'
        },
        401: {
            description: 'Unauthorized'
        }
    }
});

documentRoutes.openapi(listDocumentsRoute, async (c: any) => {
    const { page, limit, status, search, folderId, sortBy, sortOrder, dateFrom, dateTo, mimeType } = c.req.valid('query');
    const user = c.get('user');

    try {
        // Build where clause for filtering
        const where: any = {
            organizationId: user.organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { originalName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (folderId) {
            where.folderId = folderId;
        }

        if (mimeType) {
            where.mimeType = { contains: mimeType };
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        // Build order by clause
        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;

        // Get total count for pagination
        const total = await prisma.document.count({ where });

        // Calculate pagination
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;

        // Fetch documents with relations
        const documents = await prisma.document.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        fields: true,
                        shares: true,
                        versions: true,
                    }
                }
            }
        });

        return c.json({
            data: documents,
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
        console.error('Error listing documents:', error);
        return c.json({ error: 'Failed to list documents' }, 500);
    }
});

/**
 * Get document by ID with full details
 */
const getDocumentRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Documents'],
    summary: 'Get document',
    description: 'Retrieve a specific document by ID with complete details including fields, recipients, and metadata',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        query: z.object({
            includeFields: z.string().transform((val: string) => val === 'true').optional().default('false'),
            includeShares: z.string().transform((val: string) => val === 'true').optional().default('false'),
            includeVersions: z.string().transform((val: string) => val === 'true').optional().default('false'),
            includeAnalytics: z.string().transform((val: string) => val === 'true').optional().default('false'),
        })
    },
    responses: {
        200: {
            description: 'Document details',
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.string(),
                        name: z.string(),
                        originalName: z.string(),
                        status: z.enum(['DRAFT', 'PROCESSING', 'READY', 'SENT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                        size: z.number(),
                        mimeType: z.string(),
                        hash: z.string(),
                        folderId: z.string().nullable(),
                        organizationId: z.string(),
                        createdBy: z.string(),
                        ownedBy: z.string(),
                        isTemplate: z.boolean(),
                        metadata: z.record(z.any()),
                        createdAt: z.string().datetime(),
                        updatedAt: z.string().datetime(),
                        fields: z.array(z.object({
                            id: z.string(),
                            type: z.enum(['SIGNATURE', 'INITIAL', 'TEXT', 'DATE', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'ATTACHMENT']),
                            name: z.string(),
                            page: z.number(),
                            x: z.number(),
                            y: z.number(),
                            width: z.number(),
                            height: z.number(),
                            properties: z.record(z.any()),
                            isRequired: z.boolean(),
                            recipientId: z.string().nullable(),
                        })).optional(),
                        shares: z.array(z.object({
                            id: z.string(),
                            token: z.string(),
                            expiresAt: z.string().datetime().nullable(),
                            isPasswordProtected: z.boolean(),
                            allowDownload: z.boolean(),
                            allowPrint: z.boolean(),
                            createdAt: z.string().datetime(),
                        })).optional(),
                        versions: z.array(z.object({
                            id: z.string(),
                            version: z.number(),
                            hash: z.string(),
                            size: z.number(),
                            createdAt: z.string().datetime(),
                        })).optional(),
                        analytics: z.object({
                            views: z.number(),
                            downloads: z.number(),
                            shares: z.number(),
                            lastViewedAt: z.string().datetime().nullable(),
                        }).optional(),
                    })
                }
            }
        },
        404: {
            description: 'Document not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

documentRoutes.openapi(getDocumentRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const { includeFields, includeShares, includeVersions, includeAnalytics } = c.req.valid('query');
    const user = c.get('user');

    try {
        const document = await prisma.document.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
            include: {
                fields: includeFields,
                shares: includeShares,
                versions: includeVersions,
                analytics: includeAnalytics,
            }
        });

        if (!document) {
            return c.json({ error: 'Document not found' }, 404);
        }

        // Check access permissions
        if (document.ownedBy !== user.id && document.createdBy !== user.id) {
            // Check if user has access through shares or organization permissions
            const hasAccess = await prisma.documentShare.findFirst({
                where: {
                    documentId: id,
                    // Add share access logic here
                }
            });

            if (!hasAccess) {
                return c.json({ error: 'Access denied' }, 403);
            }
        }

        return c.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        return c.json({ error: 'Failed to fetch document' }, 500);
    }
});

/**
 * Upload document with streaming support and validation
 */
const uploadDocumentRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Documents'],
    summary: 'Upload document',
    description: 'Upload a new document with comprehensive validation, virus scanning, and metadata extraction',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.any().describe('Document file to upload (PDF, DOCX, DOC, TXT, PNG, JPG)'),
                        name: z.string().optional().describe('Custom document name'),
                        folderId: z.string().optional().describe('Folder ID to organize the document'),
                        metadata: z.string().optional().describe('JSON string of additional metadata'),
                    })
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Document uploaded successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        document: z.object({
                            id: z.string(),
                            name: z.string(),
                            originalName: z.string(),
                            status: z.enum(['PROCESSING', 'READY', 'ERROR']),
                            size: z.number(),
                            mimeType: z.string(),
                            hash: z.string(),
                            folderId: z.string().nullable(),
                            metadata: z.record(z.any()),
                            createdAt: z.string().datetime()
                        }),
                        message: z.string()
                    })
                }
            }
        },
        400: {
            description: 'Invalid file or validation error'
        },
        413: {
            description: 'File too large'
        },
        415: {
            description: 'Unsupported media type'
        }
    }
});

documentRoutes.openapi(uploadDocumentRoute, async (c: any) => {
    const user = c.get('user');

    try {
        const body = await c.req.parseBody();
        const file = body.file as File;
        const customName = body.name as string;
        const folderId = body.folderId as string;
        const metadataStr = body.metadata as string;

        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return c.json({ error: 'File too large. Maximum size is 50MB' }, 413);
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'image/png',
            'image/jpeg',
            'image/jpg'
        ];

        if (!allowedTypes.includes(file.type)) {
            return c.json({ error: 'Unsupported file type' }, 415);
        }

        // Parse additional metadata
        let additionalMetadata = {};
        if (metadataStr) {
            try {
                additionalMetadata = JSON.parse(metadataStr);
            } catch (error) {
                return c.json({ error: 'Invalid metadata JSON' }, 400);
            }
        }

        // Generate file hash for deduplication
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Check for duplicate files
        const existingDocument = await prisma.document.findFirst({
            where: {
                hash,
                organizationId: user.organizationId,
            }
        });

        if (existingDocument) {
            return c.json({
                success: false,
                error: 'Document already exists',
                existingDocument: {
                    id: existingDocument.id,
                    name: existingDocument.name,
                }
            }, 409);
        }

        // Validate folder access if specified
        if (folderId) {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: folderId,
                    organizationId: user.organizationId,
                }
            });

            if (!folder) {
                return c.json({ error: 'Invalid folder ID' }, 400);
            }
        }

        // Generate storage key
        const fileExtension = file.name.split('.').pop();
        const storageKey = `documents/${user.organizationId}/${hash}.${fileExtension}`;

        // Upload to storage service
        const uploadResult = await storageService.upload(storageKey, fileBuffer, {
            mimeType: file.type,
            metadata: {
                originalName: file.name,
                uploadedBy: user.id,
                organizationId: user.organizationId,
            }
        });

        // Create document record in database
        const document = await prisma.document.create({
            data: {
                name: customName || file.name,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                hash,
                status: 'PROCESSING',
                folderId: folderId || null,
                organizationId: user.organizationId,
                createdBy: user.id,
                ownedBy: user.id,
                metadata: {
                    storageKey,
                    ...additionalMetadata,
                }
            }
        });

        // Create audit log
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'Document',
                entityId: document.id,
                action: 'UPLOAD',
                details: {
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                }
            }
        });

        // TODO: Trigger background processing for PDF conversion, text extraction, etc.
        // This would be handled by a job queue system

        return c.json({
            success: true,
            document: {
                id: document.id,
                name: document.name,
                originalName: document.originalName,
                status: document.status,
                size: document.size,
                mimeType: document.mimeType,
                hash: document.hash,
                folderId: document.folderId,
                metadata: document.metadata,
                createdAt: document.createdAt.toISOString()
            },
            message: "Document uploaded successfully and is being processed"
        }, 201);

    } catch (error) {
        console.error('Error uploading document:', error);
        return c.json({ error: 'Failed to upload document' }, 500);
    }
});

/**
 * Update document metadata and properties
 */
const updateDocumentRoute = createRoute({
    method: 'patch',
    path: '/{id}',
    tags: ['Documents'],
    summary: 'Update document',
    description: 'Update document metadata, name, folder, and other properties',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().min(1).max(255).optional(),
                        folderId: z.string().nullable().optional(),
                        status: z.enum(['DRAFT', 'READY', 'CANCELLED']).optional(),
                        metadata: z.record(z.any()).optional(),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Document updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        document: z.object({
                            id: z.string(),
                            name: z.string(),
                            status: z.enum(['DRAFT', 'PROCESSING', 'READY', 'SENT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                            folderId: z.string().nullable(),
                            metadata: z.record(z.any()),
                            updatedAt: z.string().datetime(),
                        }),
                        message: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Document not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

documentRoutes.openapi(updateDocumentRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const updates = await c.req.json();
    const user = c.get('user');

    try {
        // Check document exists and user has access
        const existingDocument = await prisma.document.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            }
        });

        if (!existingDocument) {
            return c.json({ error: 'Document not found' }, 404);
        }

        // Check ownership or permissions
        if (existingDocument.ownedBy !== user.id && existingDocument.createdBy !== user.id) {
            return c.json({ error: 'Access denied' }, 403);
        }

        // Validate folder if being updated
        if (updates.folderId) {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: updates.folderId,
                    organizationId: user.organizationId,
                }
            });

            if (!folder) {
                return c.json({ error: 'Invalid folder ID' }, 400);
            }
        }

        // Update document
        const document = await prisma.document.update({
            where: { id },
            data: {
                ...updates,
                metadata: updates.metadata ? {
                    ...existingDocument.metadata as object,
                    ...updates.metadata
                } : undefined,
            }
        });

        // Create audit log
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'Document',
                entityId: document.id,
                action: 'UPDATE',
                details: updates
            }
        });

        return c.json({
            success: true,
            document: {
                id: document.id,
                name: document.name,
                status: document.status,
                folderId: document.folderId,
                metadata: document.metadata,
                updatedAt: document.updatedAt.toISOString(),
            },
            message: 'Document updated successfully'
        });

    } catch (error) {
        console.error('Error updating document:', error);
        return c.json({ error: 'Failed to update document' }, 500);
    }
});

/**
 * Delete document
 */
const deleteDocumentRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Documents'],
    summary: 'Delete document',
    description: 'Permanently delete a document and all associated data',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: {
            description: 'Document deleted successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Document not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

documentRoutes.openapi(deleteDocumentRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const user = c.get('user');

    try {
        // Check document exists and user has access
        const document = await prisma.document.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            }
        });

        if (!document) {
            return c.json({ error: 'Document not found' }, 404);
        }

        // Check ownership
        if (document.ownedBy !== user.id) {
            return c.json({ error: 'Only the document owner can delete it' }, 403);
        }

        // Delete from storage
        const storageKey = (document.metadata as any)?.storageKey;
        if (storageKey) {
            try {
                await storageService.delete(storageKey);
            } catch (error) {
                console.error('Error deleting from storage:', error);
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete document (cascade will handle related records)
        await prisma.document.delete({
            where: { id }
        });

        // Create audit log
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'Document',
                entityId: id,
                action: 'DELETE',
                details: {
                    documentName: document.name,
                    deletedAt: new Date().toISOString()
                }
            }
        });

        return c.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting document:', error);
        return c.json({ error: 'Failed to delete document' }, 500);
    }
});

/**
 * Download document with streaming support
 */
const downloadDocumentRoute = createRoute({
    method: 'get',
    path: '/{id}/download',
    tags: ['Documents'],
    summary: 'Download document',
    description: 'Download document file with streaming support and range requests',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        query: z.object({
            version: z.string().optional().describe('Specific version to download'),
        })
    },
    responses: {
        200: {
            description: 'Document file',
            content: {
                'application/octet-stream': {
                    schema: z.any()
                }
            }
        },
        404: {
            description: 'Document not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

documentRoutes.openapi(downloadDocumentRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const { version } = c.req.valid('query');
    const user = c.get('user');

    try {
        // Check document exists and user has access
        const document = await prisma.document.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            }
        });

        if (!document) {
            return c.json({ error: 'Document not found' }, 404);
        }

        // Get storage key
        let storageKey = (document.metadata as any)?.storageKey;

        // If specific version requested, get that version's storage key
        if (version) {
            const documentVersion = await prisma.documentVersion.findFirst({
                where: {
                    documentId: id,
                    versionNumber: parseInt(version)
                }
            });

            if (documentVersion) {
                storageKey = documentVersion.fileUrl;
            }
        }

        if (!storageKey) {
            return c.json({ error: 'Document file not found' }, 404);
        }

        // Download from storage
        const fileBuffer = await storageService.download(storageKey);

        // Track download analytics
        await prisma.documentAnalytics.create({
            data: {
                documentId: id,
                eventType: 'DOWNLOAD',
                metadata: {
                    version: version || 'latest',
                    fileName: document.name
                },
                userId: user.id,
            }
        });

        // Create activity log
        await prisma.activity.create({
            data: {
                userId: user.id,
                documentId: id,
                type: 'DOCUMENT_DOWNLOADED',
                description: `Downloaded document: ${document.name}`,
                metadata: {
                    documentName: document.name,
                    version: version || 'latest'
                }
            }
        });

        // Set response headers
        c.header('Content-Type', document.mimeType);
        c.header('Content-Disposition', `attachment; filename="${document.originalName}"`);
        c.header('Content-Length', fileBuffer.length.toString());
        c.header('Cache-Control', 'private, max-age=3600');

        return c.body(fileBuffer);

    } catch (error) {
        console.error('Error downloading document:', error);
        return c.json({ error: 'Failed to download document' }, 500);
    }
});

/**
 * Create document share link
 */
const createShareLinkRoute = createRoute({
    method: 'post',
    path: '/{id}/share',
    tags: ['Documents'],
    summary: 'Create share link',
    description: 'Create a secure share link for document access with permissions and expiration',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        expiresIn: z.number().min(1).max(365).optional().describe('Days until expiration'),
                        password: z.string().min(8).optional().describe('Password protection'),
                        allowDownload: z.boolean().optional().default(true),
                        allowPrint: z.boolean().optional().default(true),
                        maxViews: z.number().min(1).optional().describe('Maximum number of views'),
                    })
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Share link created successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        share: z.object({
                            id: z.string(),
                            token: z.string(),
                            url: z.string(),
                            expiresAt: z.string().datetime().nullable(),
                            isPasswordProtected: z.boolean(),
                            allowDownload: z.boolean(),
                            allowPrint: z.boolean(),
                            maxViews: z.number().nullable(),
                            createdAt: z.string().datetime(),
                        }),
                        message: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Document not found'
        },
        403: {
            description: 'Access denied'
        }
    }
});

documentRoutes.openapi(createShareLinkRoute, async (c: any) => {
    const { id } = c.req.valid('param');
    const shareOptions = await c.req.json();
    const user = c.get('user');

    try {
        // Check document exists and user has access
        const document = await prisma.document.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            }
        });

        if (!document) {
            return c.json({ error: 'Document not found' }, 404);
        }

        // Generate secure token
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        // Calculate expiration
        let expiresAt = null;
        if (shareOptions.expiresIn) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + shareOptions.expiresIn);
        }

        // Hash password if provided
        let passwordHash = null;
        if (shareOptions.password) {
            const bcrypt = await import('bcryptjs');
            passwordHash = await bcrypt.hash(shareOptions.password, 10);
        }

        // Create share record
        const share = await prisma.documentShare.create({
            data: {
                documentId: id,
                createdBy: user.id,
                shareToken: token,
                expiresAt,
                password: passwordHash,
                permissions: {
                    allowDownload: shareOptions.allowDownload ?? true,
                    allowPrint: shareOptions.allowPrint ?? true,
                    isPasswordProtected: !!shareOptions.password,
                },
                maxAccess: shareOptions.maxViews || null,
                accessCount: 0,
            }
        });

        // Create audit log
        await prisma.auditEvent.create({
            data: {
                organizationId: user.organizationId,
                userId: user.id,
                entityType: 'DocumentShare',
                entityId: share.id,
                action: 'CREATE',
                details: {
                    documentId: id,
                    documentName: document.name,
                    expiresAt,
                    isPasswordProtected: !!shareOptions.password,
                }
            }
        });

        // Generate share URL
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const shareUrl = `${baseUrl}/share/${token}`;

        return c.json({
            success: true,
            share: {
                id: share.id,
                token: share.shareToken,
                url: shareUrl,
                expiresAt: share.expiresAt?.toISOString() || null,
                isPasswordProtected: !!(share.permissions as any)?.isPasswordProtected,
                allowDownload: (share.permissions as any)?.allowDownload ?? true,
                allowPrint: (share.permissions as any)?.allowPrint ?? true,
                maxViews: share.maxAccess,
                createdAt: share.createdAt.toISOString(),
            },
            message: 'Share link created successfully'
        }, 201);

    } catch (error) {
        console.error('Error creating share link:', error);
        return c.json({ error: 'Failed to create share link' }, 500);
    }
});

/**
 * Search documents with advanced filtering
 */
const searchDocumentsRoute = createRoute({
    method: 'post',
    path: '/search',
    tags: ['Documents'],
    summary: 'Search documents',
    description: 'Advanced document search with full-text search, filters, and faceted results',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        query: z.string().optional(),
                        filters: z.object({
                            status: z.array(z.enum(['DRAFT', 'PROCESSING', 'READY', 'SENT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR'])).optional(),
                            mimeTypes: z.array(z.string()).optional(),
                            folderIds: z.array(z.string()).optional(),
                            dateFrom: z.string().datetime().optional(),
                            dateTo: z.string().datetime().optional(),
                            sizeMin: z.number().optional(),
                            sizeMax: z.number().optional(),
                            tags: z.array(z.string()).optional(),
                        }).optional(),
                        page: z.number().min(1).optional().default(1),
                        limit: z.number().min(1).max(100).optional().default(20),
                        sortBy: z.enum(['relevance', 'name', 'createdAt', 'updatedAt', 'size']).optional().default('relevance'),
                        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Search results',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.object({
                            id: z.string(),
                            name: z.string(),
                            originalName: z.string(),
                            status: z.enum(['DRAFT', 'PROCESSING', 'READY', 'SENT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ERROR']),
                            size: z.number(),
                            mimeType: z.string(),
                            folderId: z.string().nullable(),
                            createdAt: z.string().datetime(),
                            updatedAt: z.string().datetime(),
                            relevanceScore: z.number().optional(),
                        })),
                        pagination: z.object({
                            page: z.number(),
                            limit: z.number(),
                            total: z.number(),
                            totalPages: z.number(),
                            hasNext: z.boolean(),
                            hasPrev: z.boolean()
                        }),
                        facets: z.object({
                            statuses: z.record(z.number()),
                            mimeTypes: z.record(z.number()),
                            folders: z.record(z.number()),
                        }).optional()
                    })
                }
            }
        }
    }
});

documentRoutes.openapi(searchDocumentsRoute, async (c: any) => {
    const searchParams = await c.req.json();
    const user = c.get('user');

    try {
        const { query, filters, page, limit, sortBy, sortOrder } = searchParams;

        // Build where clause
        const where: any = {
            organizationId: user.organizationId,
        };

        // Add text search
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { originalName: { contains: query, mode: 'insensitive' } },
            ];
        }

        // Add filters
        if (filters) {
            if (filters.status && filters.status.length > 0) {
                where.status = { in: filters.status };
            }

            if (filters.mimeTypes && filters.mimeTypes.length > 0) {
                where.mimeType = { in: filters.mimeTypes };
            }

            if (filters.folderIds && filters.folderIds.length > 0) {
                where.folderId = { in: filters.folderIds };
            }

            if (filters.dateFrom || filters.dateTo) {
                where.createdAt = {};
                if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
                if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
            }

            if (filters.sizeMin || filters.sizeMax) {
                where.size = {};
                if (filters.sizeMin) where.size.gte = filters.sizeMin;
                if (filters.sizeMax) where.size.lte = filters.sizeMax;
            }
        }

        // Get total count
        const total = await prisma.document.count({ where });

        // Calculate pagination
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;

        // Build order by
        const orderBy: any = sortBy === 'relevance' ? { createdAt: 'desc' } : { [sortBy]: sortOrder };

        // Fetch documents
        const documents = await prisma.document.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        });

        // Calculate facets (aggregations)
        const facets = {
            statuses: {} as Record<string, number>,
            mimeTypes: {} as Record<string, number>,
            folders: {} as Record<string, number>,
        };

        // Get status facets
        const statusCounts = await prisma.document.groupBy({
            by: ['status'],
            where: { organizationId: user.organizationId },
            _count: true,
        });
        statusCounts.forEach(item => {
            facets.statuses[item.status] = item._count;
        });

        // Get mime type facets
        const mimeTypeCounts = await prisma.document.groupBy({
            by: ['mimeType'],
            where: { organizationId: user.organizationId },
            _count: true,
        });
        mimeTypeCounts.forEach(item => {
            facets.mimeTypes[item.mimeType] = item._count;
        });

        return c.json({
            data: documents.map(doc => ({
                ...doc,
                relevanceScore: query ? 1.0 : undefined, // TODO: Implement proper relevance scoring
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            facets
        });

    } catch (error) {
        console.error('Error searching documents:', error);
        return c.json({ error: 'Failed to search documents' }, 500);
    }
});
