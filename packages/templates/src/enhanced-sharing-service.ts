import { PrismaClient } from '@signtusk/database';
import { TRPCError } from '@trpc/server';
import { pino } from 'pino';
import {
    TemplatePermissionManager,
    ShareTargetType,
    TemplatePermissionLevel
} from './permission-manager';

const logger = pino({ name: 'enhanced-template-sharing-service' });

/**
 * Share request data
 */
export interface ShareRequestData {
    templateId: string;
    shareType: ShareTargetType;
    targetId?: string;
    targetEmail?: string;
    permissions: {
        canView: boolean;
        canUse: boolean;
        canDuplicate: boolean;
        canEdit: boolean;
        canShare: boolean;
        canDelete: boolean;
    };
    options?: {
        expiresAt?: Date;
        password?: string;
        maxUses?: number;
        message?: string;
        requireApproval?: boolean;
    };
}

/**
 * Share response data
 */
export interface ShareResponseData {
    success: boolean;
    shareId?: string;
    approvalId?: string;
    shareToken?: string;
    requiresApproval: boolean;
    message: string;
    expiresAt?: Date;
}

/**
 * Template access data
 */
export interface TemplateAccessData {
    templateId: string;
    userId: string;
    permissions: Record<string, boolean>;
    accessSource: string;
    canAccess: boolean;
    restrictions?: {
        expiresAt?: Date;
        maxUses?: number;
        usesRemaining?: number;
    };
}

/**
 * Enhanced template sharing service with comprehensive permission management
 */
export class EnhancedTemplateSharingService {
    private permissionManager: TemplatePermissionManager;

    constructor(private db: PrismaClient) {
        this.permissionManager = new TemplatePermissionManager(db);
    }

    /**
     * Share template with comprehensive permission management
     */
    async shareTemplate(
        shareRequest: ShareRequestData,
        requestedBy: string,
        organizationId: string
    ): Promise<ShareResponseData> {
        try {
            logger.info({
                templateId: shareRequest.templateId,
                shareType: shareRequest.shareType,
                requestedBy
            }, 'Processing template share request');

            // Validate the share request
            await this.validateShareRequest(shareRequest, organizationId);

            // Check user permissions
            const userPermissions = await this.permissionManager.getUserPermissions(
                shareRequest.templateId,
                requestedBy,
                organizationId
            );

            if (!userPermissions.permissions.canShare) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions to share this template',
                });
            }

            // Process the share request
            const result = await this.permissionManager.shareTemplate(
                shareRequest.templateId,
                shareRequest.shareType,
                shareRequest.targetId,
                shareRequest.permissions,
                requestedBy,
                organizationId,
                shareRequest.options || {}
            );

            // Generate share token for link sharing
            let shareToken: string | undefined;
            if (shareRequest.shareType === ShareTargetType.LINK && result.shareId) {
                const share = await this.db.templateShare.findFirst({
                    where: { id: result.shareId },
                    select: { shareToken: true },
                });
                shareToken = share?.shareToken;
            }

            // Send notifications if needed
            await this.sendShareNotifications(shareRequest, result, requestedBy, organizationId);

            return {
                success: true,
                shareId: result.shareId,
                approvalId: result.approvalId,
                shareToken,
                requiresApproval: result.requiresApproval,
                message: result.message,
                expiresAt: shareRequest.options?.expiresAt,
            };
        } catch (error) {
            logger.error({ error, shareRequest, requestedBy }, 'Failed to share template');
            throw error;
        }
    }

    /**
     * Get user's access to a template
     */
    async getTemplateAccess(
        templateId: string,
        userId: string,
        organizationId: string,
        shareToken?: string
    ): Promise<TemplateAccessData> {
        try {
            // Check direct permissions first
            const userPermissions = await this.permissionManager.getUserPermissions(
                templateId,
                userId,
                organizationId
            );

            if (userPermissions.permissions.canView) {
                return {
                    templateId,
                    userId,
                    permissions: userPermissions.permissions,
                    accessSource: userPermissions.source,
                    canAccess: true,
                };
            }

            // Check share token access if provided
            if (shareToken) {
                const tokenAccess = await this.getTokenAccess(shareToken, userId);
                if (tokenAccess.canAccess) {
                    return tokenAccess;
                }
            }

            // No access
            return {
                templateId,
                userId,
                permissions: {},
                accessSource: 'none',
                canAccess: false,
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to get template access');
            throw error;
        }
    }

    /**
     * Update share permissions
     */
    async updateSharePermissions(
        shareId: string,
        permissions: Record<string, boolean>,
        updatedBy: string,
        organizationId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            return await this.permissionManager.updateSharePermissions(
                shareId,
                permissions,
                updatedBy,
                organizationId
            );
        } catch (error) {
            logger.error({ error, shareId, updatedBy }, 'Failed to update share permissions');
            throw error;
        }
    }

    /**
     * Revoke template share
     */
    async revokeShare(
        shareId: string,
        revokedBy: string,
        organizationId: string,
        reason?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            return await this.permissionManager.revokeShare(
                shareId,
                revokedBy,
                organizationId,
                reason
            );
        } catch (error) {
            logger.error({ error, shareId, revokedBy }, 'Failed to revoke share');
            throw error;
        }
    }

    /**
     * Get all shares for a template
     */
    async getTemplateShares(
        templateId: string,
        requestedBy: string,
        organizationId: string
    ): Promise<Array<{
        id: string;
        shareType: string;
        targetName?: string;
        targetEmail?: string;
        permissions: Record<string, boolean>;
        createdAt: Date;
        expiresAt?: Date;
        accessCount: number;
        maxAccess?: number;
        isActive: boolean;
        createdBy: {
            id: string;
            name: string;
            email: string;
        };
    }>> {
        try {
            return await this.permissionManager.getTemplateShares(
                templateId,
                requestedBy,
                organizationId
            );
        } catch (error) {
            logger.error({ error, templateId, requestedBy }, 'Failed to get template shares');
            throw error;
        }
    }

    /**
     * Process share approval
     */
    async processShareApproval(
        approvalId: string,
        action: 'approve' | 'reject',
        approverId: string,
        organizationId: string,
        reason?: string
    ): Promise<{ success: boolean; shareId?: string; message: string }> {
        try {
            return await this.permissionManager.processShareApproval(
                approvalId,
                action,
                approverId,
                organizationId,
                reason
            );
        } catch (error) {
            logger.error({ error, approvalId, action, approverId }, 'Failed to process share approval');
            throw error;
        }
    }

    /**
     * Get pending share approvals for a user
     */
    async getPendingApprovals(
        userId: string,
        organizationId: string
    ): Promise<Array<{
        id: string;
        templateName: string;
        requestedBy: {
            id: string;
            name: string;
            email: string;
        };
        shareType: string;
        targetName?: string;
        permissions: Record<string, boolean>;
        message?: string;
        createdAt: Date;
        expiresAt: Date;
    }>> {
        try {
            const approvals = await this.db.templateShareApproval.findMany({
                where: {
                    status: 'pending',
                    approvers: { has: userId },
                    expiresAt: { gt: new Date() },
                },
                include: {
                    template: {
                        select: {
                            name: true,
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
                orderBy: { createdAt: 'desc' },
            });

            return approvals.map(approval => ({
                id: approval.id,
                templateName: approval.template.name,
                requestedBy: approval.requester,
                shareType: approval.shareType,
                targetName: this.getTargetName(approval.shareType, approval.targetId || undefined),
                permissions: approval.permissions as Record<string, boolean>,
                message: approval.message || undefined,
                createdAt: approval.createdAt,
                expiresAt: approval.expiresAt,
            }));
        } catch (error) {
            logger.error({ error, userId }, 'Failed to get pending approvals');
            throw error;
        }
    }

    /**
     * Bulk share templates
     */
    async bulkShareTemplates(
        templateIds: string[],
        shareRequest: Omit<ShareRequestData, 'templateId'>,
        requestedBy: string,
        organizationId: string
    ): Promise<{
        successful: Array<{ templateId: string; shareId?: string; approvalId?: string }>;
        failed: Array<{ templateId: string; error: string }>;
        summary: {
            total: number;
            successful: number;
            failed: number;
            requiresApproval: number;
        };
    }> {
        try {
            const results = {
                successful: [] as Array<{ templateId: string; shareId?: string; approvalId?: string }>,
                failed: [] as Array<{ templateId: string; error: string }>,
                summary: {
                    total: templateIds.length,
                    successful: 0,
                    failed: 0,
                    requiresApproval: 0,
                },
            };

            for (const templateId of templateIds) {
                try {
                    const result = await this.shareTemplate(
                        { ...shareRequest, templateId },
                        requestedBy,
                        organizationId
                    );

                    results.successful.push({
                        templateId,
                        shareId: result.shareId,
                        approvalId: result.approvalId,
                    });

                    results.summary.successful++;
                    if (result.requiresApproval) {
                        results.summary.requiresApproval++;
                    }
                } catch (error) {
                    results.failed.push({
                        templateId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    results.summary.failed++;
                }
            }

            return results;
        } catch (error) {
            logger.error({ error, templateIds, requestedBy }, 'Failed to bulk share templates');
            throw error;
        }
    }

    /**
     * Get template sharing analytics
     */
    async getTemplateShareAnalytics(
        templateId: string,
        requestedBy: string,
        organizationId: string,
        dateRange?: { start: Date; end: Date }
    ): Promise<{
        totalShares: number;
        activeShares: number;
        sharesByType: Record<string, number>;
        accessCount: number;
        topAccessors: Array<{ userId: string; userName: string; accessCount: number }>;
        sharingTrend: Array<{ date: string; shareCount: number; accessCount: number }>;
    }> {
        try {
            // Verify user has permission to view analytics
            const userPermissions = await this.permissionManager.getUserPermissions(
                templateId,
                requestedBy,
                organizationId
            );

            if (!userPermissions.permissions.canShare && !userPermissions.permissions.canManagePermissions) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions to view sharing analytics',
                });
            }

            const dateFilter = dateRange ? {
                createdAt: {
                    gte: dateRange.start,
                    lte: dateRange.end,
                },
            } : {};

            // Get sharing statistics
            const [totalShares, activeShares, sharesByType, accessAnalytics] = await Promise.all([
                this.db.templateShare.count({
                    where: { templateId, ...dateFilter },
                }),
                this.db.templateShare.count({
                    where: { templateId, isActive: true, ...dateFilter },
                }),
                this.db.templateShare.groupBy({
                    by: ['shareType'],
                    where: { templateId, ...dateFilter },
                    _count: { id: true },
                }),
                this.db.templateShare.aggregate({
                    where: { templateId, ...dateFilter },
                    _sum: { accessCount: true },
                }),
            ]);

            const sharesByTypeMap = sharesByType.reduce((acc, item) => {
                acc[item.shareType] = item._count.id;
                return acc;
            }, {} as Record<string, number>);

            return {
                totalShares,
                activeShares,
                sharesByType: sharesByTypeMap,
                accessCount: accessAnalytics._sum.accessCount || 0,
                topAccessors: [], // Would need additional queries to implement
                sharingTrend: [], // Would need additional queries to implement
            };
        } catch (error) {
            logger.error({ error, templateId, requestedBy }, 'Failed to get sharing analytics');
            throw error;
        }
    }

    /**
     * Private helper methods
     */

    private async validateShareRequest(
        shareRequest: ShareRequestData,
        organizationId: string
    ): Promise<void> {
        // Validate template exists
        const template = await this.db.template.findFirst({
            where: { id: shareRequest.templateId },
        });

        if (!template) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Template not found',
            });
        }

        // Validate share type specific requirements
        switch (shareRequest.shareType) {
            case ShareTargetType.USER:
                if (!shareRequest.targetId && !shareRequest.targetEmail) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'User ID or email is required for user sharing',
                    });
                }
                break;

            case ShareTargetType.TEAM:
                if (!shareRequest.targetId) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Team ID is required for team sharing',
                    });
                }
                break;

            case ShareTargetType.ORGANIZATION:
            case ShareTargetType.PUBLIC:
            case ShareTargetType.LINK:
                // These don't require additional validation
                break;

            default:
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid share type',
                });
        }

        // Validate permissions
        const validPermissions = ['canView', 'canUse', 'canDuplicate', 'canEdit', 'canShare', 'canDelete'];
        const hasValidPermissions = Object.keys(shareRequest.permissions).every(
            perm => validPermissions.includes(perm)
        );

        if (!hasValidPermissions) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid permission specified',
            });
        }

        // Ensure at least view permission is granted
        if (!shareRequest.permissions.canView) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'View permission is required for sharing',
            });
        }
    }

    private async getTokenAccess(
        shareToken: string,
        userId?: string
    ): Promise<TemplateAccessData> {
        const share = await this.db.templateShare.findFirst({
            where: {
                shareToken,
                isActive: true,
            },
            include: {
                template: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!share) {
            return {
                templateId: '',
                userId: userId || '',
                permissions: {},
                accessSource: 'token',
                canAccess: false,
            };
        }

        // Check expiration
        if (share.expiresAt && share.expiresAt < new Date()) {
            return {
                templateId: share.templateId,
                userId: userId || '',
                permissions: {},
                accessSource: 'token',
                canAccess: false,
            };
        }

        // Check usage limits
        if (share.maxAccess && share.accessCount >= share.maxAccess) {
            return {
                templateId: share.templateId,
                userId: userId || '',
                permissions: {},
                accessSource: 'token',
                canAccess: false,
            };
        }

        return {
            templateId: share.templateId,
            userId: userId || '',
            permissions: share.permissions as Record<string, boolean>,
            accessSource: 'token',
            canAccess: true,
            restrictions: {
                expiresAt: share.expiresAt || undefined,
                maxUses: share.maxAccess || undefined,
                usesRemaining: share.maxAccess ? share.maxAccess - share.accessCount : undefined,
            },
        };
    }

    private async sendShareNotifications(
        shareRequest: ShareRequestData,
        result: any,
        requestedBy: string,
        organizationId: string
    ): Promise<void> {
        // Implementation would send appropriate notifications
        // For now, just log the notification
        logger.info({
            templateId: shareRequest.templateId,
            shareType: shareRequest.shareType,
            targetId: shareRequest.targetId,
            requestedBy,
            requiresApproval: result.requiresApproval,
        }, 'Share notification sent');
    }

    private getTargetName(shareType: string, targetId?: string): string | undefined {
        // This would need additional logic to resolve target names
        // For now, return the targetId
        return targetId;
    }
}