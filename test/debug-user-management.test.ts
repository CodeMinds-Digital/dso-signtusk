import { describe, it, expect, beforeEach } from 'vitest';
import { UserManagementService } from '../packages/auth/src/user-management-service';
import type { User } from '../packages/auth/src/types';
import type { Organization } from '../packages/auth/src/organization-types';
import { OrganizationStatus, OrganizationTier } from '../packages/auth/src/organization-types';

describe('Debug User Management Service', () => {
    let userManagementService: UserManagementService;
    let testUsers: Map<string, User>;
    let testOrganizations: Map<string, Organization>;

    beforeEach(() => {
        userManagementService = new UserManagementService();
        testUsers = new Map();
        testOrganizations = new Map();
        userManagementService.setUsers(testUsers);
        userManagementService.setOrganizations(testOrganizations);
    });

    it('should debug role assignment', async () => {
        const user: User = {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            passwordHash: 'hash123',
            organizationId: 'org-123',
            roles: [],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testUsers.set(user.id, user);
        userManagementService.setUsers(testUsers);

        console.log('Before assignment - users:', Array.from(testUsers.keys()));
        console.log('Before assignment - role assignments:', userManagementService.getRoleAssignments().size);

        const result = await userManagementService.assignRole({
            userId: user.id,
            roleIds: ['admin'],
            assignedBy: user.id
        });

        console.log('Assignment result:', result);
        console.log('After assignment - role assignments:', userManagementService.getRoleAssignments().size);
        console.log('Role assignments map:', Array.from(userManagementService.getRoleAssignments().entries()));

        const userRoles = await userManagementService.getUserRoles(user.id);
        console.log('Retrieved user roles:', userRoles);

        expect(result.success).toBe(true);
        expect(result.assignments).toBeDefined();
        expect(result.assignments!.length).toBeGreaterThan(0);
        expect(userRoles.length).toBeGreaterThan(0);
    });

    it('should debug invitation', async () => {
        const org: Organization = {
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            status: OrganizationStatus.ACTIVE,
            tier: OrganizationTier.FREE,
            settings: {
                enforceSSO: false,
                requireTwoFactor: false,
                allowedDomains: [],
                sessionTimeout: 30,
                defaultDocumentRetention: 365,
                allowExternalSharing: true,
                requireDocumentPassword: false,
                defaultSigningOrder: 'sequential',
                allowDelegation: true,
                reminderFrequency: 7,
                enableWebhooks: false,
                enableAPIAccess: false,
                allowedIntegrations: [],
                customLogo: '',
                primaryColor: '',
                customDomain: '',
                enableAuditLog: false,
                dataRetentionPeriod: 365,
                enableEncryption: false
            },
            branding: {
                logo: '',
                logoUrl: '',
                primaryColor: '',
                secondaryColor: '',
                fontFamily: '',
                customCSS: '',
                favicon: '',
                customDomain: '',
                emailTemplate: ''
            },
            memberCount: 0,
            teamCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const inviter: User = {
            id: 'inviter-123',
            email: 'inviter@example.com',
            name: 'Inviter User',
            passwordHash: 'hash123',
            organizationId: org.id,
            roles: ['admin'],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testOrganizations.set(org.id, org);
        testUsers.set(inviter.id, inviter);
        userManagementService.setUsers(testUsers);
        userManagementService.setOrganizations(testOrganizations);

        console.log('Before invitation - organizations:', Array.from(testOrganizations.keys()));
        console.log('Before invitation - users:', Array.from(testUsers.keys()));

        const result = await userManagementService.inviteUser({
            email: 'newuser@example.com',
            name: 'New User',
            organizationId: org.id,
            roleIds: ['user']
        }, inviter.id);

        console.log('Invitation result:', result);

        expect(result.success).toBe(true);
        expect(result.invitation).toBeDefined();
    });

    it('should debug activity logging', async () => {
        const user: User = {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            passwordHash: 'hash123',
            organizationId: 'org-123',
            roles: [],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testUsers.set(user.id, user);
        userManagementService.setUsers(testUsers);

        console.log('Before logging - activity events:', userManagementService.getActivityEvents().length);

        await userManagementService.logUserActivity({
            userId: user.id,
            organizationId: user.organizationId,
            action: 'test_action',
            resource: 'test_resource',
            resourceId: 'test-123',
            details: { test: 'data' }
        });

        console.log('After logging - activity events:', userManagementService.getActivityEvents().length);
        console.log('Activity events:', userManagementService.getActivityEvents());

        const activities = await userManagementService.queryUserActivity({
            userId: user.id,
            limit: 10
        });

        console.log('Queried activities:', activities);

        expect(activities.length).toBeGreaterThan(0);
    });
});