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

describe('Reproduce Property Test Failures', () => {
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

    it('should reproduce role assignment failure case', async () => {
        // This reproduces the failing case from property tests
        const user: User = {
            id: "00000AAAA0",
            email: "a@a.aa",
            name: "00", // Very short name
            passwordHash: "      ", // Spaces only
            organizationId: "0000000000",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        testUsers.set(user.id, user);
        userManagementService.setUsers(testUsers);

        console.log('Testing with problematic user:', user);

        // Try to assign admin role
        const assignmentData: RoleAssignmentData = {
            userId: user.id,
            roleIds: ['admin'],
            assignedBy: user.id
        };

        const assignResult = await userManagementService.assignRole(assignmentData);
        console.log('Assignment result:', assignResult);

        if (assignResult.success && assignResult.assignments) {
            console.log('Assignments created:', assignResult.assignments.length);

            // Try to retrieve roles
            const userRoles = await userManagementService.getUserRoles(user.id);
            console.log('Retrieved roles:', userRoles);
            console.log('Role assignments in service:', Array.from(userManagementService.getRoleAssignments().values()));

            // This is where the property test fails
            expect(userRoles.length).toBeGreaterThan(0);
        }
    });

    it('should reproduce activity logging failure case', async () => {
        // This reproduces the activity logging failure
        const user1: User = {
            id: "0000000000",
            email: "a@a.aa",
            name: "AA",
            passwordHash: "      ",
            organizationId: "0000000000",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        const user2: User = {
            id: "0000000000", // Same ID as user1 - this might be the issue!
            email: "a@a.aa",
            name: "0A",
            passwordHash: "                    ",
            organizationId: "00000A0000",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        testUsers.set(user1.id, user1);
        testUsers.set(user2.id, user2); // This overwrites user1!
        userManagementService.setUsers(testUsers);

        console.log('Users in map:', testUsers.size);
        console.log('User1 ID:', user1.id);
        console.log('User2 ID:', user2.id);
        console.log('Final user in map:', testUsers.get(user1.id));

        // Log activity for user1
        await userManagementService.logUserActivity({
            userId: user1.id,
            organizationId: user1.organizationId,
            action: 'user_invited',
            resource: 'user',
            resourceId: 'test-resource',
            details: { test: 'user1' }
        });

        // Query activities for user1
        const user1Activities = await userManagementService.queryUserActivity({
            userId: user1.id,
            limit: 100
        });

        console.log('Activities for user1:', user1Activities);
        console.log('All activities:', userManagementService.getActivityEvents());

        // This is where the property test fails
        expect(user1Activities.length).toBeGreaterThan(0);
    });

    it('should reproduce invitation failure case', async () => {
        // This reproduces the invitation failure
        const organization: Organization = {
            id: "1001bF5030",
            name: "ja",
            slug: "na-",
            status: OrganizationStatus.ACTIVE,
            tier: OrganizationTier.FREE,
            settings: {
                enforceSSO: false,
                requireTwoFactor: false,
                allowedDomains: [],
                sessionTimeout: 5,
                defaultDocumentRetention: 30,
                allowExternalSharing: false,
                requireDocumentPassword: false,
                defaultSigningOrder: "sequential",
                allowDelegation: false,
                reminderFrequency: 1,
                enableWebhooks: false,
                enableAPIAccess: false,
                allowedIntegrations: [],
                customLogo: "",
                primaryColor: "",
                customDomain: "",
                enableAuditLog: false,
                dataRetentionPeriod: 90,
                enableEncryption: false
            },
            branding: {
                logo: "",
                logoUrl: "",
                primaryColor: "",
                secondaryColor: "",
                fontFamily: "",
                customCSS: "",
                favicon: "",
                customDomain: "",
                emailTemplate: ""
            },
            memberCount: 0,
            teamCount: 0,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        const inviter: User = {
            id: "fcdbkr_J20",
            email: "a@a.aa",
            name: "CA",
            passwordHash: "F8U                 ",
            organizationId: "A0000-0000", // Different from organization ID!
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        testOrganizations.set(organization.id, organization);
        testUsers.set(inviter.id, inviter);
        userManagementService.setUsers(testUsers);
        userManagementService.setOrganizations(testOrganizations);

        console.log('Organization ID:', organization.id);
        console.log('Inviter org ID:', inviter.organizationId);

        const invitationData: UserInvitationData = {
            email: "a@a.aa",
            name: "00",
            organizationId: organization.id,
            roleIds: ["A000"]
        };

        const inviteResult = await userManagementService.inviteUser(invitationData, inviter.id);
        console.log('Invitation result:', inviteResult);

        // This is where the property test fails
        expect(inviteResult.success).toBe(true);
    });

    it('should reproduce duplicate role assignment issue', async () => {
        // This reproduces the duplicate assignment issue
        const user1: User = {
            id: "0a0001BF-_",
            email: "a@a.da",
            name: "--", // Invalid name with dashes
            passwordHash: " )              &   ",
            organizationId: "FA00Aa0220",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        const user2: User = {
            id: "gHA01P00C0",
            email: "a@a.aa",
            name: "D0",
            passwordHash: " ! <'       \"       ",
            organizationId: "2ahF_a2__0",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2021-10-17T15:34:11.711Z"),
            updatedAt: new Date("2021-10-16T19:12:48.395Z")
        };

        testUsers.set(user1.id, user1);
        testUsers.set(user2.id, user2);
        userManagementService.setUsers(testUsers);

        const assignmentData: RoleAssignmentData = {
            userId: user1.id,
            roleIds: ["aTXQ", "im7fmT"], // Multiple roles
            assignedBy: user2.id
        };

        // First assignment
        const firstResult = await userManagementService.assignRole(assignmentData);
        console.log('First assignment result:', firstResult);

        // Second assignment (should not create duplicates)
        const secondResult = await userManagementService.assignRole(assignmentData);
        console.log('Second assignment result:', secondResult);
        console.log('All role assignments:', Array.from(userManagementService.getRoleAssignments().values()));

        expect(firstResult.success).toBe(true);
        expect(firstResult.assignments!.length).toBeGreaterThan(0);

        expect(secondResult.success).toBe(true);
        // This is where the property test fails - it expects 0 but gets 2
        expect(secondResult.assignments!.length).toBe(0);
    });
});