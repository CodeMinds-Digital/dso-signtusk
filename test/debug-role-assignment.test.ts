import { describe, it, expect, beforeEach } from 'vitest';
import { UserManagementService } from '../packages/auth/src/user-management-service';
import { RBACServiceImpl } from '../packages/auth/src/rbac-service';
import type { User } from '../packages/auth/src/types';
import type { Organization } from '../packages/auth/src/organization-types';
import { generateId } from '../packages/lib/src/utils';

describe('Debug Role Assignment', () => {
    let userManagementService: UserManagementService;
    let rbacService: RBACServiceImpl;

    beforeEach(async () => {
        rbacService = new RBACServiceImpl();
        await rbacService.initializeSystemRoles();

        userManagementService = new UserManagementService(rbacService);

        // Set up test data
        const testUsers = new Map<string, User>();
        const testOrganizations = new Map<string, Organization>();

        const testUser: User = {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            passwordHash: 'hashed-password',
            organizationId: 'test-org-123',
            roles: [],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const testOrg: Organization = {
            id: 'test-org-123',
            name: 'Test Organization',
            slug: 'test-org',
            status: 'active',
            tier: 'professional',
            settings: {
                enforceSSO: false,
                requireTwoFactor: false,
                allowedDomains: [],
                sessionTimeout: 60
            },
            branding: {
                primaryColor: '#000000',
                secondaryColor: '#ffffff',
                fontFamily: 'Arial'
            },
            memberCount: 1,
            teamCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testUsers.set(testUser.id, testUser);
        testOrganizations.set(testOrg.id, testOrg);

        userManagementService.setUsers(testUsers);
        userManagementService.setOrganizations(testOrganizations);
    });

    it('should debug role assignment', async () => {
        // Check what roles exist
        console.log('Available roles:');
        const systemRoles = rbacService.getSystemRoles();
        console.log('System roles:', Object.keys(systemRoles));

        for (const [key, role] of Object.entries(systemRoles)) {
            const existingRole = await rbacService.getRole(role.id);
            console.log(`Role ${key} (${role.id}):`, existingRole ? 'EXISTS' : 'NOT FOUND');
        }

        // Try to assign a role
        const assignResult = await userManagementService.assignRole({
            userId: 'test-user-123',
            roleIds: ['role_super_admin'],
            organizationId: 'test-org-123',
            assignedBy: 'test-user-123'
        });

        console.log('Assignment result:', assignResult);

        if (!assignResult.success) {
            console.log('Assignment failed:', assignResult.error);
        }

        expect(assignResult.success).toBe(true);
    });
});