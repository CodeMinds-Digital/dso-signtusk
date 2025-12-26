import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateCollaborationService } from '../template-collaboration-service';

// Mock PrismaClient
const mockDb = {
    template: {
        findFirst: vi.fn(),
        update: vi.fn(),
    },
    templateCollaborator: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
    },
    templateComment: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
    },
    templateReview: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
    },
    templateVersion: {
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    templateEditSession: {
        create: vi.fn(),
        updateMany: vi.fn(),
        findMany: vi.fn(),
    },
    templateChangeNotification: {
        create: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
    },
    user: {
        findFirst: vi.fn(),
    },
} as any;

describe('TemplateCollaborationService', () => {
    let service: TemplateCollaborationService;

    beforeEach(() => {
        service = new TemplateCollaborationService(mockDb);
        vi.clearAllMocks();
    });

    describe('enableCollaboration', () => {
        it('should enable collaboration for template owner', async () => {
            const templateId = 'template-1';
            const userId = 'user-1';
            const organizationId = 'org-1';

            // Mock template exists and user is owner
            mockDb.template.findFirst.mockResolvedValue({
                id: templateId,
                createdBy: userId,
                organizationId,
                creator: { id: userId, name: 'Test User', email: 'test@example.com' },
            });

            mockDb.template.update.mockResolvedValue({});
            mockDb.templateCollaborator.upsert.mockResolvedValue({});

            const result = await service.enableCollaboration(templateId, userId, organizationId);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Collaboration enabled successfully');
            expect(mockDb.template.update).toHaveBeenCalledWith({
                where: { id: templateId },
                data: {
                    isCollaborative: true,
                    updatedAt: expect.any(Date),
                },
            });
        });

        it('should fail if user is not template owner', async () => {
            const templateId = 'template-1';
            const userId = 'user-1';
            const organizationId = 'org-1';

            // Mock template exists but user is not owner
            mockDb.template.findFirst.mockResolvedValue({
                id: templateId,
                createdBy: 'other-user',
                organizationId,
                creator: { id: 'other-user', name: 'Other User', email: 'other@example.com' },
            });

            const result = await service.enableCollaboration(templateId, userId, organizationId);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Only template owner can enable collaboration');
        });

        it('should fail if template not found', async () => {
            const templateId = 'template-1';
            const userId = 'user-1';
            const organizationId = 'org-1';

            mockDb.template.findFirst.mockResolvedValue(null);

            const result = await service.enableCollaboration(templateId, userId, organizationId);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Template not found');
        });
    });

    describe('addCollaborator', () => {
        it('should add collaborator with correct permissions', async () => {
            const collaboratorData = {
                templateId: 'template-1',
                userId: 'user-2',
                role: 'EDITOR' as const,
                permissions: {},
            };
            const addedBy = 'user-1';
            const organizationId = 'org-1';

            // Mock template exists and is collaborative
            mockDb.template.findFirst.mockResolvedValue({
                id: collaboratorData.templateId,
                organizationId,
                isCollaborative: true,
            });

            // Mock user exists
            mockDb.user.findFirst.mockResolvedValue({
                id: collaboratorData.userId,
                organizationId,
            });

            // Mock collaborator creation
            mockDb.templateCollaborator.upsert.mockResolvedValue({
                id: 'collab-1',
                ...collaboratorData,
                user: {
                    id: collaboratorData.userId,
                    name: 'Test User',
                    email: 'test@example.com',
                },
            });

            // Mock adder permissions (assume they can manage collaborators)
            service['getUserPermissions'] = vi.fn().mockResolvedValue({
                canManageCollaborators: true,
            });

            const result = await service.addCollaborator(collaboratorData, addedBy, organizationId);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Collaborator added successfully');
            expect(mockDb.templateCollaborator.upsert).toHaveBeenCalled();
        });
    });

    describe('addComment', () => {
        it('should add comment successfully', async () => {
            const commentData = {
                templateId: 'template-1',
                content: 'This is a test comment',
                mentions: [],
                attachments: [],
            };
            const userId = 'user-1';
            const organizationId = 'org-1';

            // Mock user permissions
            service['getUserPermissions'] = vi.fn().mockResolvedValue({
                canComment: true,
            });

            // Mock comment creation
            mockDb.templateComment.create.mockResolvedValue({
                id: 'comment-1',
                ...commentData,
                userId,
                user: {
                    id: userId,
                    name: 'Test User',
                    email: 'test@example.com',
                    avatar: null,
                },
                replies: [],
            });

            const result = await service.addComment(commentData, userId, organizationId);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Comment added successfully');
            expect(mockDb.templateComment.create).toHaveBeenCalled();
        });

        it('should fail if user cannot comment', async () => {
            const commentData = {
                templateId: 'template-1',
                content: 'This is a test comment',
                mentions: [],
                attachments: [],
            };
            const userId = 'user-1';
            const organizationId = 'org-1';

            // Mock user permissions (no comment permission)
            service['getUserPermissions'] = vi.fn().mockResolvedValue({
                canComment: false,
            });

            const result = await service.addComment(commentData, userId, organizationId);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Permission denied: cannot comment');
        });
    });

    describe('lockTemplate', () => {
        it('should lock template successfully', async () => {
            const templateId = 'template-1';
            const userId = 'user-1';
            const organizationId = 'org-1';

            // Mock user permissions
            service['getUserPermissions'] = vi.fn().mockResolvedValue({
                canEdit: true,
            });

            // Mock template exists and is unlocked
            mockDb.template.findFirst.mockResolvedValue({
                id: templateId,
                organizationId,
                lockStatus: 'UNLOCKED',
                lockedBy: null,
            });

            mockDb.template.update.mockResolvedValue({});
            mockDb.templateEditSession.create.mockResolvedValue({
                id: 'session-1',
                templateId,
                userId,
            });

            const result = await service.lockTemplate(templateId, userId, organizationId);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Template locked successfully');
            expect(mockDb.template.update).toHaveBeenCalledWith({
                where: { id: templateId },
                data: {
                    lockStatus: 'LOCKED',
                    lockedBy: userId,
                    lockedAt: expect.any(Date),
                },
            });
        });

        it('should fail if template is already locked by another user', async () => {
            const templateId = 'template-1';
            const userId = 'user-1';
            const organizationId = 'org-1';

            // Mock user permissions
            service['getUserPermissions'] = vi.fn().mockResolvedValue({
                canEdit: true,
            });

            // Mock template exists but is locked by another user
            mockDb.template.findFirst.mockResolvedValue({
                id: templateId,
                organizationId,
                lockStatus: 'LOCKED',
                lockedBy: 'other-user',
                locker: {
                    id: 'other-user',
                    name: 'Other User',
                    email: 'other@example.com',
                },
            });

            const result = await service.lockTemplate(templateId, userId, organizationId);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Template is locked by Other User');
        });
    });
});