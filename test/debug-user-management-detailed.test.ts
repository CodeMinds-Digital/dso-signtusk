import { describe, it, expect, beforeEach } from 'vitest';
import { UserManagementService } from '../packages/auth/src/user-management-service';
import type {
    UserInvitationData,
    RoleAssignmentData,
    AccessControlCheck
} from '../packages/auth/src/user-management-service';
import type { User } from '../packages/auth/src/types';
import type { Organization } from '../packages/auth/src/organization-types';
import { OrganizationStatus, OrganizationTier } from '../packages/auth/src/organization-types';
import { generateId } from '../packages/lib/src/utils';

describe('User Management Service Debug Tests', () => {
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

    it('should debug role assignment and retrieval', async () => {
        // Create test user
        const user: User = {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            passwordHash: 'hash123',
            organizationId: 'test-org-123',
            roles: [],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testUsers.set(user.id, user);
        userManagementService.setUsers(testUsers);

        // Create the admin role first
        const rbacService = (userManagementService as any).rbacService;
        const adminRole = await rbacService.createRole({
            name: 'admin',
            description: 'Administrator role',
            type: 'custom', // Use lowercase
            permissions: []
        });

        console.log('Created admin role:', adminRole);
        console.log('Initial user:', user);
        console.log('Initial role assignments:', userManagementService.getRoleAssignments().size);

        // Assign role using the actual role ID
        const assignmentData: RoleAssignmentData = {
            userId: user.id,
            roleIds: [adminRole.id], // Use the actual role ID
            assignedBy: user.id
        };

        const assignResult = await userManagementService.assignRole(assignmentData);
        console.log('Assignment result:', assignResult);
        console.log('Role assignments after assignment:', userManagementService.getRoleAssignments().size);
        console.log('All role assignments:', Array.from(userManagementService.getRoleAssignments().values()));

        expect(assignResult.success).toBe(true);
        expect(assignResult.assignments).toBeDefined();
        expect(assignResult.assignments!.length).toBeGreaterThan(0);

        // Retrieve roles
        const userRoles = await userManagementService.getUserRoles(user.id);
        console.log('Retrieved user roles:', userRoles);

        expect(userRoles.length).toBeGreaterThan(0);
        expect(userRoles.map(r => r.roleId)).toContain(adminRole.id);
    });

    it('should debug activity logging', async () => {
        // Create test user
        const user: User = {
            id: 'test-user-456',
            email: 'test2@example.com',
            name: 'Test User 2',
            passwordHash: 'hash456',
            organizationId: 'test-org-456',
            roles: [],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testUsers.set(user.id, user);
        userManagementService.setUsers(testUsers);

        console.log('Initial activity events:', userManagementService.getActivityEvents().length);

        // Log activity
        await userManagementService.logUserActivity({
            userId: user.id,
            organizationId: user.organizationId,
            action: 'test_action',
            resource: 'test_resource',
            resourceId: 'test-resource-123',
            details: { test: 'data' }
        });

        console.log('Activity events after logging:', userManagementService.getActivityEvents().length);
        console.log('All activity events:', userManagementService.getActivityEvents());

        // Query activities
        const activities = await userManagementService.queryUserActivity({
            userId: user.id,
            limit: 10
        });

        console.log('Queried activities:', activities);

        expect(activities.length).toBeGreaterThan(0);
        expect(activities[0].userId).toBe(user.id);
        expect(activities[0].action).toBe('test_action');
    });

    it('should debug invitation process', async () => {
        // Create test organization
        const organization: Organization = {
            id: 'test-org-789',
            name: 'Test Organization',
            slug: 'test-org',
            status: OrganizationStatus.ACTIVE,
            tier: OrganizationTier.PROFESSIONAL,
            settings: {
                enforceSSO: false,
                requireTwoFactor: false,
                allowedDomains: [],
                sessionTimeout: 60,
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
                enableAuditLog: true,
                dataRetentionPeriod: 2555,
                enableEncryption: true
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
            memberCount: 1,
            teamCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Create inviter user
        const inviter: User = {
            id: 'inviter-123',
            email: 'inviter@example.com',
            name: 'Inviter User',
            passwordHash: 'hash789',
            organizationId: organization.id,
            roles: ['admin'],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testOrganizations.set(organization.id, organization);
        testUsers.set(inviter.id, inviter);
        userManagementService.setUsers(testUsers);
        userManagementService.setOrganizations(testOrganizations);

        console.log('Initial invitations:', userManagementService.getInvitations().size);

        // Create invitation
        const invitationData: UserInvitationData = {
            email: 'invitee@example.com',
            name: 'Invitee User',
            organizationId: organization.id,
            roleIds: ['user']
        };

        const inviteResult = await userManagementService.inviteUser(invitationData, inviter.id);
        console.log('Invitation result:', inviteResult);
        console.log('Invitations after invite:', userManagementService.getInvitations().size);
        console.log('All invitations:', Array.from(userManagementService.getInvitations().values()));

        expect(inviteResult.success).toBe(true);
        expect(inviteResult.invitation).toBeDefined();
        expect(inviteResult.invitation!.email).toBe('invitee@example.com');
    });

    it('should debug duplicate role assignment prevention', async () => {
        // Create test user
        const user: User = {
            id: 'test-user-duplicate',
            email: 'duplicate@example.com',
            name: 'Duplicate Test User',
            passwordHash: 'hash-duplicate',
            organizationId: 'test-org-duplicate',
            roles: [],
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        testUsers.set(user.id, user);
        userManagementService.setUsers(testUsers);

        // Create the manager role first
        const rbacService = (userManagementService as any).rbacService;
        const managerRole = await rbacService.createRole({
            name: 'manager',
            description: 'Manager role',
            type: 'custom',
            permissions: []
        });

        const assignmentData: RoleAssignmentData = {
            userId: user.id,
            roleIds: [managerRole.id], // Use the actual role ID
            assignedBy: user.id
        };

        // First assignment
        const firstResult = await userManagementService.assignRole(assignmentData);
        console.log('First assignment result:', firstResult);
        console.log('Role assignments after first:', userManagementService.getRoleAssignments().size);

        // Second assignment (should be prevented)
        const secondResult = await userManagementService.assignRole(assignmentData);
        console.log('Second assignment result:', secondResult);
        console.log('Role assignments after second:', userManagementService.getRoleAssignments().size);

        expect(firstResult.success).toBe(true);
        expect(firstResult.assignments!.length).toBeGreaterThan(0);

        expect(secondResult.success).toBe(true);
        expect(secondResult.assignments!.length).toBe(0); // No new assignments
    });
});