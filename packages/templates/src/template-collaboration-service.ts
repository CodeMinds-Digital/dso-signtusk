import { PrismaClient } from '@signtusk/database';
import { pino } from 'pino';
import { z } from 'zod';

const logger = pino({ name: 'template-collaboration-service' });

// Collaboration schemas
export const TemplateCommentSchema = z.object({
    templateId: z.string(),
    content: z.string().min(1).max(2000),
    parentId: z.string().optional(),
    mentions: z.array(z.string()).default([]),
    attachments: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number(),
    })).default([]),
});

export const TemplateReviewRequestSchema = z.object({
    templateId: z.string(),
    versionId: z.string().optional(),
    reviewerId: z.string(),
    dueDate: z.date().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    checklist: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        isRequired: z.boolean().default(false),
        isCompleted: z.boolean().default(false),
    })).default([]),
    comments: z.string().optional(),
});

export const TemplateCollaboratorSchema = z.object({
    templateId: z.string(),
    userId: z.string(),
    role: z.enum(['VIEWER', 'COMMENTER', 'EDITOR', 'REVIEWER', 'ADMIN']).default('VIEWER'),
    permissions: z.object({
        canView: z.boolean().default(true),
        canComment: z.boolean().default(false),
        canEdit: z.boolean().default(false),
        canReview: z.boolean().default(false),
        canManageCollaborators: z.boolean().default(false),
        canDelete: z.boolean().default(false),
    }).default({}),
});

export const TemplateVersionCreateSchema = z.object({
    templateId: z.string(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    changes: z.array(z.object({
        type: z.enum(['field_added', 'field_removed', 'field_modified', 'recipient_added', 'recipient_removed', 'recipient_modified', 'workflow_changed', 'settings_changed']),
        description: z.string(),
        details: z.record(z.any()).default({}),
        timestamp: z.date().default(() => new Date()),
    })).default([]),
});

// Type exports
export type TemplateComment = z.infer<typeof TemplateCommentSchema>;
export type TemplateReviewRequest = z.infer<typeof TemplateReviewRequestSchema>;
export type TemplateCollaborator = z.infer<typeof TemplateCollaboratorSchema>;
export type TemplateVersionCreate = z.infer<typeof TemplateVersionCreateSchema>;

export interface TemplateCollaborationResult {
    success: boolean;
    data?: any;
    message?: string;
    errors?: string[];
}

export interface TemplateEditSession {
    id: string;
    templateId: string;
    userId: string;
    userName: string;
    startedAt: Date;
    lastActivityAt: Date;
    isActive: boolean;
    changes: any[];
}

export interface TemplateChangeNotification {
    id: string;
    templateId: string;
    changeType: string;
    changeDescription: string;
    changedBy: {
        id: string;
        name: string;
        email: string;
    };
    versionId?: string;
    isRead: boolean;
    createdAt: Date;
}

export class TemplateCollaborationService {
    constructor(private db: PrismaClient) { }

    /**
     * Enable collaborative editing for a template
     */
    async enableCollaboration(
        templateId: string,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Check if user has permission to enable collaboration
            const template = await this.db.template.findFirst({
                where: {
                    id: templateId,
                    organizationId,
                },
                include: {
                    creator: true,
                },
            });

            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found'],
                };
            }

            if (template.createdBy !== userId) {
                return {
                    success: false,
                    errors: ['Only template owner can enable collaboration'],
                };
            }

            // Enable collaboration
            await this.db.template.update({
                where: { id: templateId },
                data: {
                    isCollaborative: true,
                    updatedAt: new Date(),
                },
            });

            // Add creator as admin collaborator
            await this.db.templateCollaborator.upsert({
                where: {
                    templateId_userId: {
                        templateId,
                        userId,
                    },
                },
                create: {
                    templateId,
                    userId,
                    role: 'ADMIN',
                    permissions: {
                        canView: true,
                        canComment: true,
                        canEdit: true,
                        canReview: true,
                        canManageCollaborators: true,
                        canDelete: true,
                    },
                    addedBy: userId,
                },
                update: {
                    role: 'ADMIN',
                    permissions: {
                        canView: true,
                        canComment: true,
                        canEdit: true,
                        canReview: true,
                        canManageCollaborators: true,
                        canDelete: true,
                    },
                    isActive: true,
                },
            });

            // Create notification
            await this.createChangeNotification(
                templateId,
                userId,
                'CREATED',
                'Collaboration enabled for template',
                userId
            );

            logger.info({ templateId, userId }, 'Template collaboration enabled');

            return {
                success: true,
                message: 'Collaboration enabled successfully',
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to enable collaboration');
            return {
                success: false,
                errors: ['Failed to enable collaboration'],
            };
        }
    }

    /**
     * Add a collaborator to a template
     */
    async addCollaborator(
        data: TemplateCollaborator,
        addedBy: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Validate input
            const validatedData = TemplateCollaboratorSchema.parse(data);

            // Check if template exists and is collaborative
            const template = await this.db.template.findFirst({
                where: {
                    id: validatedData.templateId,
                    organizationId,
                    isCollaborative: true,
                },
            });

            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found or collaboration not enabled'],
                };
            }

            // Check if user adding collaborator has permission
            const adderPermissions = await this.getUserPermissions(
                validatedData.templateId,
                addedBy,
                organizationId
            );

            if (!adderPermissions.canManageCollaborators) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot manage collaborators'],
                };
            }

            // Check if user exists in organization
            const user = await this.db.user.findFirst({
                where: {
                    id: validatedData.userId,
                    organizationId,
                },
            });

            if (!user) {
                return {
                    success: false,
                    errors: ['User not found in organization'],
                };
            }

            // Set default permissions based on role
            const rolePermissions = this.getRolePermissions(validatedData.role);
            const finalPermissions = {
                ...rolePermissions,
                ...validatedData.permissions,
            };

            // Add collaborator
            const collaborator = await this.db.templateCollaborator.upsert({
                where: {
                    templateId_userId: {
                        templateId: validatedData.templateId,
                        userId: validatedData.userId,
                    },
                },
                create: {
                    templateId: validatedData.templateId,
                    userId: validatedData.userId,
                    role: validatedData.role,
                    permissions: finalPermissions,
                    addedBy,
                },
                update: {
                    role: validatedData.role,
                    permissions: finalPermissions,
                    isActive: true,
                    lastActiveAt: new Date(),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // Create notification for the added user
            await this.createChangeNotification(
                validatedData.templateId,
                validatedData.userId,
                'COLLABORATOR_ADDED',
                `Added as ${validatedData.role.toLowerCase()} collaborator`,
                addedBy
            );

            logger.info({
                templateId: validatedData.templateId,
                userId: validatedData.userId,
                role: validatedData.role,
                addedBy
            }, 'Collaborator added to template');

            return {
                success: true,
                data: collaborator,
                message: 'Collaborator added successfully',
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    errors: error.errors.map(e => e.message),
                };
            }

            logger.error({ error, data, addedBy }, 'Failed to add collaborator');
            return {
                success: false,
                errors: ['Failed to add collaborator'],
            };
        }
    }

    /**
     * Remove a collaborator from a template
     */
    async removeCollaborator(
        templateId: string,
        userId: string,
        removedBy: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Check permissions
            const removerPermissions = await this.getUserPermissions(
                templateId,
                removedBy,
                organizationId
            );

            if (!removerPermissions.canManageCollaborators && removedBy !== userId) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot manage collaborators'],
                };
            }

            // Remove collaborator
            await this.db.templateCollaborator.update({
                where: {
                    templateId_userId: {
                        templateId,
                        userId,
                    },
                },
                data: {
                    isActive: false,
                },
            });

            // Create notification
            await this.createChangeNotification(
                templateId,
                userId,
                'COLLABORATOR_REMOVED',
                'Removed from template collaboration',
                removedBy
            );

            logger.info({ templateId, userId, removedBy }, 'Collaborator removed from template');

            return {
                success: true,
                message: 'Collaborator removed successfully',
            };
        } catch (error) {
            logger.error({ error, templateId, userId, removedBy }, 'Failed to remove collaborator');
            return {
                success: false,
                errors: ['Failed to remove collaborator'],
            };
        }
    }

    /**
     * Get template collaborators
     */
    async getCollaborators(
        templateId: string,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Check if user has access to template
            const hasAccess = await this.hasTemplateAccess(templateId, userId, organizationId);
            if (!hasAccess) {
                return {
                    success: false,
                    errors: ['Access denied'],
                };
            }

            const collaborators = await this.db.templateCollaborator.findMany({
                where: {
                    templateId,
                    isActive: true,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    adder: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: [
                    { role: 'asc' },
                    { addedAt: 'asc' },
                ],
            });

            return {
                success: true,
                data: collaborators,
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to get collaborators');
            return {
                success: false,
                errors: ['Failed to get collaborators'],
            };
        }
    }

    /**
     * Add a comment to a template
     */
    async addComment(
        data: TemplateComment,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Validate input
            const validatedData = TemplateCommentSchema.parse(data);

            // Check permissions
            const permissions = await this.getUserPermissions(
                validatedData.templateId,
                userId,
                organizationId
            );

            if (!permissions.canComment) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot comment'],
                };
            }

            // Create comment
            const comment = await this.db.templateComment.create({
                data: {
                    templateId: validatedData.templateId,
                    userId,
                    parentId: validatedData.parentId,
                    content: validatedData.content,
                    mentions: validatedData.mentions,
                    attachments: validatedData.attachments,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    replies: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatar: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });

            // Create notifications for mentioned users
            if (validatedData.mentions.length > 0) {
                await Promise.all(
                    validatedData.mentions.map(mentionedUserId =>
                        this.createChangeNotification(
                            validatedData.templateId,
                            mentionedUserId,
                            'COMMENTED',
                            `Mentioned you in a comment: "${validatedData.content.substring(0, 100)}..."`,
                            userId
                        )
                    )
                );
            }

            // Create general comment notification for collaborators
            await this.notifyCollaborators(
                validatedData.templateId,
                userId,
                'COMMENTED',
                `Added a comment: "${validatedData.content.substring(0, 100)}..."`
            );

            logger.info({ templateId: validatedData.templateId, userId, commentId: comment.id }, 'Comment added to template');

            return {
                success: true,
                data: comment,
                message: 'Comment added successfully',
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    errors: error.errors.map(e => e.message),
                };
            }

            logger.error({ error, data, userId }, 'Failed to add comment');
            return {
                success: false,
                errors: ['Failed to add comment'],
            };
        }
    }

    /**
     * Get template comments
     */
    async getComments(
        templateId: string,
        userId: string,
        organizationId: string,
        options: {
            includeResolved?: boolean;
            parentId?: string;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<TemplateCollaborationResult> {
        try {
            // Check access
            const hasAccess = await this.hasTemplateAccess(templateId, userId, organizationId);
            if (!hasAccess) {
                return {
                    success: false,
                    errors: ['Access denied'],
                };
            }

            const where: any = {
                templateId,
                parentId: options.parentId || null,
            };

            if (!options.includeResolved) {
                where.isResolved = false;
            }

            const comments = await this.db.templateComment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    resolver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    replies: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatar: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: options.limit || 50,
                skip: options.offset || 0,
            });

            return {
                success: true,
                data: comments,
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to get comments');
            return {
                success: false,
                errors: ['Failed to get comments'],
            };
        }
    }

    /**
     * Resolve a comment
     */
    async resolveComment(
        commentId: string,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Get comment and check permissions
            const comment = await this.db.templateComment.findUnique({
                where: { id: commentId },
                include: { template: true },
            });

            if (!comment) {
                return {
                    success: false,
                    errors: ['Comment not found'],
                };
            }

            const permissions = await this.getUserPermissions(
                comment.templateId,
                userId,
                organizationId
            );

            if (!permissions.canComment && comment.userId !== userId) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot resolve comment'],
                };
            }

            // Resolve comment
            await this.db.templateComment.update({
                where: { id: commentId },
                data: {
                    isResolved: true,
                    resolvedBy: userId,
                    resolvedAt: new Date(),
                },
            });

            logger.info({ commentId, userId, templateId: comment.templateId }, 'Comment resolved');

            return {
                success: true,
                message: 'Comment resolved successfully',
            };
        } catch (error) {
            logger.error({ error, commentId, userId }, 'Failed to resolve comment');
            return {
                success: false,
                errors: ['Failed to resolve comment'],
            };
        }
    }

    /**
     * Request a template review
     */
    async requestReview(
        data: TemplateReviewRequest,
        requestedBy: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Validate input
            const validatedData = TemplateReviewRequestSchema.parse(data);

            // Check permissions
            const permissions = await this.getUserPermissions(
                validatedData.templateId,
                requestedBy,
                organizationId
            );

            if (!permissions.canEdit && !permissions.canManageCollaborators) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot request reviews'],
                };
            }

            // Check if reviewer exists and has review permissions
            const reviewerPermissions = await this.getUserPermissions(
                validatedData.templateId,
                validatedData.reviewerId,
                organizationId
            );

            if (!reviewerPermissions.canReview) {
                return {
                    success: false,
                    errors: ['Reviewer does not have review permissions'],
                };
            }

            // Create review request
            const review = await this.db.templateReview.create({
                data: {
                    templateId: validatedData.templateId,
                    versionId: validatedData.versionId,
                    reviewerId: validatedData.reviewerId,
                    requestedBy,
                    dueDate: validatedData.dueDate,
                    priority: validatedData.priority,
                    checklist: validatedData.checklist,
                    comments: validatedData.comments,
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    requester: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // Create notification for reviewer
            await this.createChangeNotification(
                validatedData.templateId,
                validatedData.reviewerId,
                'REVIEWED',
                'Review requested for template',
                requestedBy
            );

            logger.info({
                templateId: validatedData.templateId,
                reviewerId: validatedData.reviewerId,
                requestedBy,
                reviewId: review.id
            }, 'Template review requested');

            return {
                success: true,
                data: review,
                message: 'Review requested successfully',
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    errors: error.errors.map(e => e.message),
                };
            }

            logger.error({ error, data, requestedBy }, 'Failed to request review');
            return {
                success: false,
                errors: ['Failed to request review'],
            };
        }
    }

    /**
     * Complete a template review
     */
    async completeReview(
        reviewId: string,
        decision: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES' | 'APPROVED_WITH_CONDITIONS',
        comments: string,
        checklist: any[],
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Get review and check permissions
            const review = await this.db.templateReview.findUnique({
                where: { id: reviewId },
                include: {
                    template: true,
                    requester: true,
                },
            });

            if (!review) {
                return {
                    success: false,
                    errors: ['Review not found'],
                };
            }

            if (review.reviewerId !== userId) {
                return {
                    success: false,
                    errors: ['Permission denied: not assigned reviewer'],
                };
            }

            if (review.status !== 'PENDING' && review.status !== 'IN_PROGRESS') {
                return {
                    success: false,
                    errors: ['Review already completed'],
                };
            }

            // Complete review
            const completedReview = await this.db.templateReview.update({
                where: { id: reviewId },
                data: {
                    status: 'COMPLETED',
                    decision,
                    comments,
                    checklist,
                    completedAt: new Date(),
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    requester: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // Create notification for requester
            await this.createChangeNotification(
                review.templateId,
                review.requestedBy,
                'REVIEWED',
                `Review completed with decision: ${decision}`,
                userId
            );

            logger.info({
                reviewId,
                templateId: review.templateId,
                decision,
                userId
            }, 'Template review completed');

            return {
                success: true,
                data: completedReview,
                message: 'Review completed successfully',
            };
        } catch (error) {
            logger.error({ error, reviewId, userId }, 'Failed to complete review');
            return {
                success: false,
                errors: ['Failed to complete review'],
            };
        }
    }

    /**
     * Create a new template version with change tracking
     */
    async createVersion(
        data: TemplateVersionCreate,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Validate input
            const validatedData = TemplateVersionCreateSchema.parse(data);

            // Check permissions
            const permissions = await this.getUserPermissions(
                validatedData.templateId,
                userId,
                organizationId
            );

            if (!permissions.canEdit) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot create versions'],
                };
            }

            // Get current version number
            const latestVersion = await this.db.templateVersion.findFirst({
                where: { templateId: validatedData.templateId },
                orderBy: { version: 'desc' },
            });

            const newVersionNumber = (latestVersion?.version || 0) + 1;

            // Create version
            const version = await this.db.templateVersion.create({
                data: {
                    templateId: validatedData.templateId,
                    version: newVersionNumber,
                    name: validatedData.name,
                    description: validatedData.description,
                    changes: validatedData.changes,
                    createdBy: userId,
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // Notify collaborators
            await this.notifyCollaborators(
                validatedData.templateId,
                userId,
                'VERSION_CREATED',
                `Created version ${newVersionNumber}: ${validatedData.name}`,
                version.id
            );

            logger.info({
                templateId: validatedData.templateId,
                versionId: version.id,
                version: newVersionNumber,
                userId
            }, 'Template version created');

            return {
                success: true,
                data: version,
                message: 'Version created successfully',
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    errors: error.errors.map(e => e.message),
                };
            }

            logger.error({ error, data, userId }, 'Failed to create version');
            return {
                success: false,
                errors: ['Failed to create version'],
            };
        }
    }

    /**
     * Lock template for editing
     */
    async lockTemplate(
        templateId: string,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Check permissions
            const permissions = await this.getUserPermissions(templateId, userId, organizationId);
            if (!permissions.canEdit) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot edit template'],
                };
            }

            // Check current lock status
            const template = await this.db.template.findFirst({
                where: {
                    id: templateId,
                    organizationId,
                },
                include: {
                    locker: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found'],
                };
            }

            if (template.lockStatus === 'LOCKED' && template.lockedBy !== userId) {
                return {
                    success: false,
                    errors: [`Template is locked by ${template.locker?.name}`],
                };
            }

            // Lock template
            await this.db.template.update({
                where: { id: templateId },
                data: {
                    lockStatus: 'LOCKED',
                    lockedBy: userId,
                    lockedAt: new Date(),
                },
            });

            // Start edit session
            const editSession = await this.db.templateEditSession.create({
                data: {
                    templateId,
                    userId,
                },
            });

            // Notify collaborators
            await this.notifyCollaborators(
                templateId,
                userId,
                'LOCKED',
                'Template locked for editing'
            );

            logger.info({ templateId, userId, sessionId: editSession.id }, 'Template locked for editing');

            return {
                success: true,
                data: { editSession },
                message: 'Template locked successfully',
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to lock template');
            return {
                success: false,
                errors: ['Failed to lock template'],
            };
        }
    }

    /**
     * Unlock template
     */
    async unlockTemplate(
        templateId: string,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Check if user can unlock
            const template = await this.db.template.findFirst({
                where: {
                    id: templateId,
                    organizationId,
                },
            });

            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found'],
                };
            }

            const permissions = await this.getUserPermissions(templateId, userId, organizationId);
            const canUnlock = template.lockedBy === userId || permissions.canManageCollaborators;

            if (!canUnlock) {
                return {
                    success: false,
                    errors: ['Permission denied: cannot unlock template'],
                };
            }

            // Unlock template
            await this.db.template.update({
                where: { id: templateId },
                data: {
                    lockStatus: 'UNLOCKED',
                    lockedBy: null,
                    lockedAt: null,
                },
            });

            // End edit sessions
            await this.db.templateEditSession.updateMany({
                where: {
                    templateId,
                    userId,
                    isActive: true,
                },
                data: {
                    isActive: false,
                    endedAt: new Date(),
                },
            });

            // Notify collaborators
            await this.notifyCollaborators(
                templateId,
                userId,
                'UNLOCKED',
                'Template unlocked'
            );

            logger.info({ templateId, userId }, 'Template unlocked');

            return {
                success: true,
                message: 'Template unlocked successfully',
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to unlock template');
            return {
                success: false,
                errors: ['Failed to unlock template'],
            };
        }
    }

    /**
     * Get active edit sessions for a template
     */
    async getActiveEditSessions(
        templateId: string,
        userId: string,
        organizationId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            // Check access
            const hasAccess = await this.hasTemplateAccess(templateId, userId, organizationId);
            if (!hasAccess) {
                return {
                    success: false,
                    errors: ['Access denied'],
                };
            }

            const sessions = await this.db.templateEditSession.findMany({
                where: {
                    templateId,
                    isActive: true,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: { startedAt: 'desc' },
            });

            return {
                success: true,
                data: sessions,
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to get edit sessions');
            return {
                success: false,
                errors: ['Failed to get edit sessions'],
            };
        }
    }

    /**
     * Get change notifications for a user
     */
    async getChangeNotifications(
        userId: string,
        organizationId: string,
        options: {
            templateId?: string;
            isRead?: boolean;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<TemplateCollaborationResult> {
        try {
            const where: any = {
                userId,
                template: {
                    organizationId,
                },
            };

            if (options.templateId) {
                where.templateId = options.templateId;
            }

            if (options.isRead !== undefined) {
                where.isRead = options.isRead;
            }

            const notifications = await this.db.templateChangeNotification.findMany({
                where,
                include: {
                    template: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    changer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    version: {
                        select: {
                            id: true,
                            version: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: options.limit || 50,
                skip: options.offset || 0,
            });

            return {
                success: true,
                data: notifications,
            };
        } catch (error) {
            logger.error({ error, userId }, 'Failed to get change notifications');
            return {
                success: false,
                errors: ['Failed to get change notifications'],
            };
        }
    }

    /**
     * Mark notifications as read
     */
    async markNotificationsAsRead(
        notificationIds: string[],
        userId: string
    ): Promise<TemplateCollaborationResult> {
        try {
            await this.db.templateChangeNotification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });

            return {
                success: true,
                message: 'Notifications marked as read',
            };
        } catch (error) {
            logger.error({ error, notificationIds, userId }, 'Failed to mark notifications as read');
            return {
                success: false,
                errors: ['Failed to mark notifications as read'],
            };
        }
    }

    // Private helper methods

    private async getUserPermissions(
        templateId: string,
        userId: string,
        organizationId: string
    ): Promise<{
        canView: boolean;
        canComment: boolean;
        canEdit: boolean;
        canReview: boolean;
        canManageCollaborators: boolean;
        canDelete: boolean;
    }> {
        try {
            // Check if user is template owner
            const template = await this.db.template.findFirst({
                where: {
                    id: templateId,
                    organizationId,
                },
            });

            if (!template) {
                return {
                    canView: false,
                    canComment: false,
                    canEdit: false,
                    canReview: false,
                    canManageCollaborators: false,
                    canDelete: false,
                };
            }

            // Owner has all permissions
            if (template.createdBy === userId) {
                return {
                    canView: true,
                    canComment: true,
                    canEdit: true,
                    canReview: true,
                    canManageCollaborators: true,
                    canDelete: true,
                };
            }

            // Check collaborator permissions
            const collaborator = await this.db.templateCollaborator.findUnique({
                where: {
                    templateId_userId: {
                        templateId,
                        userId,
                    },
                },
            });

            if (collaborator && collaborator.isActive) {
                const permissions = collaborator.permissions as any;
                return {
                    canView: permissions.canView || false,
                    canComment: permissions.canComment || false,
                    canEdit: permissions.canEdit || false,
                    canReview: permissions.canReview || false,
                    canManageCollaborators: permissions.canManageCollaborators || false,
                    canDelete: permissions.canDelete || false,
                };
            }

            // Check if template is public
            if (template.isPublic) {
                return {
                    canView: true,
                    canComment: false,
                    canEdit: false,
                    canReview: false,
                    canManageCollaborators: false,
                    canDelete: false,
                };
            }

            // No permissions
            return {
                canView: false,
                canComment: false,
                canEdit: false,
                canReview: false,
                canManageCollaborators: false,
                canDelete: false,
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to get user permissions');
            return {
                canView: false,
                canComment: false,
                canEdit: false,
                canReview: false,
                canManageCollaborators: false,
                canDelete: false,
            };
        }
    }

    private getRolePermissions(role: string): Record<string, boolean> {
        const rolePermissions: Record<string, Record<string, boolean>> = {
            VIEWER: {
                canView: true,
                canComment: false,
                canEdit: false,
                canReview: false,
                canManageCollaborators: false,
                canDelete: false,
            },
            COMMENTER: {
                canView: true,
                canComment: true,
                canEdit: false,
                canReview: false,
                canManageCollaborators: false,
                canDelete: false,
            },
            EDITOR: {
                canView: true,
                canComment: true,
                canEdit: true,
                canReview: false,
                canManageCollaborators: false,
                canDelete: false,
            },
            REVIEWER: {
                canView: true,
                canComment: true,
                canEdit: false,
                canReview: true,
                canManageCollaborators: false,
                canDelete: false,
            },
            ADMIN: {
                canView: true,
                canComment: true,
                canEdit: true,
                canReview: true,
                canManageCollaborators: true,
                canDelete: true,
            },
        };

        return rolePermissions[role] || rolePermissions.VIEWER;
    }

    private async hasTemplateAccess(
        templateId: string,
        userId: string,
        organizationId: string
    ): Promise<boolean> {
        const permissions = await this.getUserPermissions(templateId, userId, organizationId);
        return permissions.canView;
    }

    private async createChangeNotification(
        templateId: string,
        userId: string,
        changeType: string,
        changeDescription: string,
        changedBy: string,
        versionId?: string
    ): Promise<void> {
        try {
            await this.db.templateChangeNotification.create({
                data: {
                    templateId,
                    userId,
                    changeType: changeType as any,
                    changeDescription,
                    changedBy,
                    versionId,
                },
            });
        } catch (error) {
            logger.error({ error, templateId, userId, changeType }, 'Failed to create change notification');
        }
    }

    private async notifyCollaborators(
        templateId: string,
        excludeUserId: string,
        changeType: string,
        changeDescription: string,
        versionId?: string
    ): Promise<void> {
        try {
            const collaborators = await this.db.templateCollaborator.findMany({
                where: {
                    templateId,
                    isActive: true,
                    userId: { not: excludeUserId },
                },
            });

            await Promise.all(
                collaborators.map(collaborator =>
                    this.createChangeNotification(
                        templateId,
                        collaborator.userId,
                        changeType,
                        changeDescription,
                        excludeUserId,
                        versionId
                    )
                )
            );
        } catch (error) {
            logger.error({ error, templateId, changeType }, 'Failed to notify collaborators');
        }
    }
}