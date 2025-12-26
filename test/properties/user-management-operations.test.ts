import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getUserManagementService, UserManagementService } from '../../packages/auth/src/user-management-service';
import type {
    User,
    UserInvitationData,
    RoleAssignmentData,
    AccessControlCheck,
    UserActivityQuery
} from '../../packages/auth/src/user-management-service';
import type { Organization } from '../../packages/auth/src/organization-types';
import { generateId } from '../../packages/lib/src/utils';

/**
 * Property-based tests for user management operations
 * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
 * **Validates: Requirements 7.3**
 */

describe('User Management Operations Properties', () => {
    let userManagementService: UserManagementService;
    let testUsers: Map<string, User>;
    let testOrganizations: Map<string, Organization>;
    let rbacService: any;
    let predefinedRoles: string[];

    beforeEach(async () => {
        userManagementService = getUserManagementService();

        // Get the RBAC service to create roles
        rbacService = (userManagementService as any).rbacService;

        // Initialize system roles first
        await rbacService.initializeSystemRoles();

        // Set up test data
        testUsers = new Map();
        testOrganizations = new Map();

        userManagementService.setUsers(testUsers);
        userManagementService.setOrganizations(testOrganizations);

        // Clear any existing data to avoid state pollution
        userManagementService.clearRoleAssignments();
        userManagementService.clearActivityEvents();

        // Use system role IDs for testing - map simple names to actual role IDs
        predefinedRoles = [];
        const roleMapping = {
            'admin': 'role_super_admin',
            'manager': 'role_org_admin',
            'user': 'role_org_member',
            'viewer': 'role_doc_viewer',
            'editor': 'role_doc_editor'
        };

        // Verify system roles exist and collect their IDs
        for (const [simpleName, systemRoleId] of Object.entries(roleMapping)) {
            const existingRole = await rbacService.getRole(systemRoleId);
            if (existingRole) {
                predefinedRoles.push(existingRole.id);
            } else {
                // Fallback: create a custom role if system role doesn't exist
                try {
                    const role = await rbacService.createRole({
                        name: simpleName,
                        description: `${simpleName} role for testing`,
                        type: 'custom',
                        permissions: []
                    });
                    predefinedRoles.push(role.id);
                } catch (error) {
                    console.warn(`Failed to create role ${simpleName}:`, error);
                }
            }
        }
    });

    // ========================================================================
    // GENERATORS
    // ========================================================================

    const arbitraryUser = () => fc.record({
        id: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 10, maxLength: 20 }),
        email: fc.emailAddress(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        passwordHash: fc.string({ minLength: 20, maxLength: 60 }),
        organizationId: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 10, maxLength: 20 }),
        roles: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
        emailVerified: fc.boolean(),
        isActive: fc.boolean(),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
    });

    const arbitraryOrganization = () => fc.record({
        id: fc.string({ minLength: 10, maxLength: 20 }),
        name: fc.string({ minLength: 1, maxLength: 100 }),
        slug: fc.string({ minLength: 3, maxLength: 50 }),
        status: fc.constantFrom('active', 'inactive', 'suspended', 'pending'),
        tier: fc.constantFrom('free', 'starter', 'professional', 'enterprise'),
        settings: fc.record({
            enforceSSO: fc.boolean(),
            requireTwoFactor: fc.boolean(),
            allowedDomains: fc.array(fc.domain(), { maxLength: 3 }),
            sessionTimeout: fc.integer({ min: 5, max: 1440 })
        }),
        branding: fc.record({
            primaryColor: fc.string(),
            secondaryColor: fc.string(),
            fontFamily: fc.string()
        }),
        memberCount: fc.integer({ min: 0, max: 1000 }),
        teamCount: fc.integer({ min: 0, max: 50 }),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
    });

    const arbitraryUserInvitation = () => fc.record({
        email: fc.emailAddress(),
        name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        organizationId: fc.hexaString({ minLength: 10, maxLength: 20 }),
        roleIds: fc.array(fc.constantFrom('role_super_admin', 'role_org_admin', 'role_org_member', 'role_doc_viewer', 'role_doc_editor'), { minLength: 1, maxLength: 3 }),
        teamIds: fc.array(fc.hexaString({ minLength: 10, maxLength: 20 }), { maxLength: 2 }),
        message: fc.option(fc.string({ maxLength: 500 })),
        expiresAt: fc.option(fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }))
    });

    const arbitraryRoleAssignment = () => fc.record({
        userId: fc.hexaString({ minLength: 10, maxLength: 20 }),
        roleIds: fc.array(fc.constantFrom('role_super_admin', 'role_org_admin', 'role_org_member', 'role_doc_viewer', 'role_doc_editor'), { minLength: 1, maxLength: 3 }),
        organizationId: fc.option(fc.hexaString({ minLength: 10, maxLength: 20 })),
        teamId: fc.option(fc.hexaString({ minLength: 10, maxLength: 20 })),
        assignedBy: fc.hexaString({ minLength: 10, maxLength: 20 }),
        reason: fc.option(fc.string({ maxLength: 500 }))
    });

    const arbitraryAccessControlCheck = () => fc.record({
        userId: fc.hexaString({ minLength: 10, maxLength: 20 }),
        resource: fc.constantFrom('user', 'document', 'template', 'organization', 'team'),
        action: fc.constantFrom('read', 'write', 'delete', 'share', 'admin'),
        resourceId: fc.option(fc.hexaString({ minLength: 10, maxLength: 20 })),
        context: fc.option(fc.record({
            organizationId: fc.hexaString({ minLength: 10, maxLength: 20 }),
            teamId: fc.option(fc.hexaString({ minLength: 10, maxLength: 20 }))
        }))
    });

    // ========================================================================
    // USER INVITATION PROPERTIES
    // ========================================================================

    describe('User Invitation Properties', () => {
        it('should handle user invitations correctly for all valid inputs', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryOrganization(),
                    arbitraryUser(),
                    arbitraryUserInvitation(),
                    async (organization, inviter, invitationData) => {
                        // Set up test data
                        testOrganizations.set(organization.id, organization);
                        testUsers.set(inviter.id, { ...inviter, organizationId: organization.id });

                        // Update invitation data to use valid organization
                        const validInvitationData: UserInvitationData = {
                            ...invitationData,
                            organizationId: organization.id
                        };

                        // Property: User invitation should work correctly for valid data
                        const result = await userManagementService.inviteUser(
                            validInvitationData,
                            inviter.id
                        );

                        // Should succeed for valid organization and inviter
                        expect(result.success).toBe(true);
                        expect(result.invitation).toBeDefined();

                        if (result.invitation) {
                            // Invitation should have correct properties
                            expect(result.invitation.email).toBe(validInvitationData.email.toLowerCase());
                            expect(result.invitation.name).toBe(validInvitationData.name);
                            expect(result.invitation.organizationId).toBe(validInvitationData.organizationId);
                            expect(result.invitation.roleIds).toEqual(validInvitationData.roleIds);
                            expect(result.invitation.status).toBe('pending');
                            expect(result.invitation.invitedBy).toBe(inviter.id);
                            expect(result.invitation.token).toBeDefined();
                            expect(result.invitation.createdAt).toBeInstanceOf(Date);
                            expect(result.invitation.expiresAt).toBeInstanceOf(Date);
                            expect(result.invitation.expiresAt.getTime()).toBeGreaterThan(Date.now());
                        }

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should prevent duplicate invitations for the same email and organization', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryOrganization(),
                    arbitraryUser(),
                    arbitraryUserInvitation(),
                    async (organization, inviter, invitationData) => {
                        // Set up test data
                        testOrganizations.set(organization.id, organization);
                        testUsers.set(inviter.id, { ...inviter, organizationId: organization.id });

                        const validInvitationData: UserInvitationData = {
                            ...invitationData,
                            organizationId: organization.id
                        };

                        // Property: Duplicate invitations should be prevented
                        const firstResult = await userManagementService.inviteUser(
                            validInvitationData,
                            inviter.id
                        );

                        const secondResult = await userManagementService.inviteUser(
                            validInvitationData,
                            inviter.id
                        );

                        // First invitation should succeed
                        expect(firstResult.success).toBe(true);

                        // Second invitation should fail due to duplicate
                        expect(secondResult.success).toBe(false);
                        expect(secondResult.error).toContain('already sent');

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should handle invitation acceptance correctly', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryOrganization(),
                    arbitraryUser(),
                    arbitraryUser(),
                    arbitraryUserInvitation(),
                    async (organization, inviter, invitee, invitationData) => {
                        // Set up test data
                        testOrganizations.set(organization.id, organization);
                        testUsers.set(inviter.id, { ...inviter, organizationId: organization.id });

                        // Set invitee email to match invitation
                        const inviteeWithMatchingEmail = {
                            ...invitee,
                            email: invitationData.email,
                            organizationId: 'different-org' // Different org initially
                        };
                        testUsers.set(invitee.id, inviteeWithMatchingEmail);

                        const validInvitationData: UserInvitationData = {
                            ...invitationData,
                            organizationId: organization.id
                        };

                        // Property: Invitation acceptance should work correctly
                        const inviteResult = await userManagementService.inviteUser(
                            validInvitationData,
                            inviter.id
                        );

                        expect(inviteResult.success).toBe(true);
                        expect(inviteResult.invitation).toBeDefined();

                        if (inviteResult.invitation) {
                            const acceptResult = await userManagementService.acceptInvitation(
                                inviteResult.invitation.token,
                                invitee.id
                            );

                            // Acceptance should succeed for valid token and matching email
                            expect(acceptResult).toBe(true);

                            // User should be updated with new organization
                            const updatedUser = testUsers.get(invitee.id);
                            expect(updatedUser?.organizationId).toBe(organization.id);

                            // Invitation status should be updated
                            const invitations = userManagementService.getInvitations();
                            const invitation = invitations.get(inviteResult.invitation.id);
                            expect(invitation?.status).toBe('accepted');
                            expect(invitation?.acceptedAt).toBeInstanceOf(Date);
                        }

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================================================
    // ROLE ASSIGNMENT PROPERTIES
    // ========================================================================

    describe('Role Assignment Properties', () => {
        it('should assign roles correctly for all valid inputs', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    arbitraryUser(),
                    arbitraryRoleAssignment(),
                    async (targetUser, assignerUser, roleAssignmentData) => {
                        // Set up test data
                        testUsers.set(targetUser.id, targetUser);
                        testUsers.set(assignerUser.id, assignerUser);

                        const validAssignmentData: RoleAssignmentData = {
                            ...roleAssignmentData,
                            userId: targetUser.id,
                            assignedBy: assignerUser.id
                        };

                        // Property: Role assignment should work correctly for valid data
                        const result = await userManagementService.assignRole(validAssignmentData);

                        // Should succeed for valid users
                        expect(result.success).toBe(true);
                        expect(result.assignments).toBeDefined();
                        expect(result.assignments!.length).toBeGreaterThan(0);

                        // Each assignment should have correct properties
                        for (const assignment of result.assignments!) {
                            expect(assignment.userId).toBe(targetUser.id);
                            expect(assignment.assignedBy).toBe(assignerUser.id);
                            expect(assignment.isActive).toBe(true);
                            expect(assignment.assignedAt).toBeInstanceOf(Date);
                            expect(validAssignmentData.roleIds).toContain(assignment.roleId);
                        }

                        // Should be able to retrieve assigned roles
                        const userRoles = await userManagementService.getUserRoles(
                            targetUser.id,
                            validAssignmentData.organizationId,
                            validAssignmentData.teamId
                        );

                        expect(userRoles.length).toBeGreaterThanOrEqual(result.assignments!.length);

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should prevent duplicate role assignments', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    arbitraryUser(),
                    arbitraryRoleAssignment(),
                    async (targetUser, assignerUser, roleAssignmentData) => {
                        // Set up test data
                        testUsers.set(targetUser.id, targetUser);
                        testUsers.set(assignerUser.id, assignerUser);

                        const validAssignmentData: RoleAssignmentData = {
                            ...roleAssignmentData,
                            userId: targetUser.id,
                            assignedBy: assignerUser.id
                        };

                        // Property: Duplicate role assignments should be prevented
                        const firstResult = await userManagementService.assignRole(validAssignmentData);
                        const secondResult = await userManagementService.assignRole(validAssignmentData);

                        // First assignment should succeed
                        expect(firstResult.success).toBe(true);
                        expect(firstResult.assignments!.length).toBeGreaterThan(0);

                        // Second assignment should succeed but not create duplicates
                        expect(secondResult.success).toBe(true);
                        expect(secondResult.assignments!.length).toBe(0); // No new assignments

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should handle role revocation correctly', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    arbitraryUser(),
                    arbitraryRoleAssignment(),
                    async (targetUser, revokerUser, roleAssignmentData) => {
                        // Set up test data
                        testUsers.set(targetUser.id, targetUser);
                        testUsers.set(revokerUser.id, revokerUser);

                        const validAssignmentData: RoleAssignmentData = {
                            ...roleAssignmentData,
                            userId: targetUser.id,
                            assignedBy: revokerUser.id
                        };

                        // Property: Role revocation should work correctly
                        // First assign roles
                        const assignResult = await userManagementService.assignRole(validAssignmentData);
                        expect(assignResult.success).toBe(true);

                        // Then revoke them
                        const revokeResult = await userManagementService.revokeRole(
                            targetUser.id,
                            validAssignmentData.roleIds,
                            revokerUser.id,
                            validAssignmentData.organizationId,
                            validAssignmentData.teamId
                        );

                        // Revocation should succeed
                        expect(revokeResult).toBe(true);

                        // Roles should no longer be active
                        const userRoles = await userManagementService.getUserRoles(
                            targetUser.id,
                            validAssignmentData.organizationId,
                            validAssignmentData.teamId
                        );

                        // Should have no active roles for the revoked role IDs
                        const activeRevokedRoles = userRoles.filter(role =>
                            validAssignmentData.roleIds.includes(role.roleId)
                        );
                        expect(activeRevokedRoles.length).toBe(0);

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================================================
    // ACCESS CONTROL PROPERTIES
    // ========================================================================

    describe('Access Control Properties', () => {
        it('should check access permissions consistently', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    arbitraryAccessControlCheck(),
                    fc.constantFrom('role_super_admin', 'role_org_admin', 'role_org_member', 'role_doc_viewer'),
                    async (user, accessCheck, userRole) => {
                        // Set up test data - ensure user exists in the service
                        testUsers.set(user.id, user);
                        userManagementService.setUsers(testUsers);

                        // Assign role to user first
                        const assignResult = await userManagementService.assignRole({
                            userId: user.id,
                            roleIds: [userRole],
                            assignedBy: user.id
                        });

                        // Ensure role assignment succeeded
                        expect(assignResult.success).toBe(true);

                        const validAccessCheck: AccessControlCheck = {
                            ...accessCheck,
                            userId: user.id
                        };

                        // Property: Access control should be consistent and deterministic
                        const result1 = await userManagementService.checkAccess(validAccessCheck);
                        const result2 = await userManagementService.checkAccess(validAccessCheck);

                        // Results should be identical
                        expect(result1.hasAccess).toBe(result2.hasAccess);
                        expect(result1.permissions).toEqual(result2.permissions);
                        expect(result1.roles).toEqual(result2.roles);

                        // Admin should have access to everything
                        if (userRole === 'role_super_admin') {
                            expect(result1.hasAccess).toBe(true);
                            expect(result1.permissions).toContain('*:*');
                        }

                        // Viewer should have limited access
                        if (userRole === 'role_doc_viewer') {
                            if (accessCheck.action === 'read') {
                                expect(result1.hasAccess).toBe(true);
                            }
                            // Viewers should not have write/delete access
                            if (['write', 'delete', 'admin'].includes(accessCheck.action)) {
                                expect(result1.hasAccess).toBe(false);
                            }
                        }

                        // Result should include role information
                        expect(result1.roles).toContain(userRole);

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should handle access control for users without roles', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    arbitraryAccessControlCheck(),
                    async (user, accessCheck) => {
                        // Set up test data - user without any roles
                        testUsers.set(user.id, user);
                        userManagementService.setUsers(testUsers);

                        const validAccessCheck: AccessControlCheck = {
                            ...accessCheck,
                            userId: user.id
                        };

                        // Property: Users without roles should have no access
                        const result = await userManagementService.checkAccess(validAccessCheck);

                        // Should have no access without roles
                        expect(result.hasAccess).toBe(false);
                        expect(result.permissions).toEqual([]);
                        expect(result.roles).toEqual([]);
                        expect(result.reason).toBeDefined();

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================================================
    // ACTIVITY MONITORING PROPERTIES
    // ========================================================================

    describe('Activity Monitoring Properties', () => {
        it('should log and retrieve user activities correctly', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    fc.constantFrom('user_invited', 'role_assigned', 'role_revoked', 'document_created', 'template_shared'),
                    fc.constantFrom('user', 'document', 'template', 'organization'),
                    fc.record({
                        key1: fc.hexaString({ maxLength: 10 }),
                        key2: fc.integer(),
                        key3: fc.boolean()
                    }),
                    async (user, action, resource, details) => {
                        // Set up test data
                        testUsers.set(user.id, user);
                        userManagementService.setUsers(testUsers);

                        // Property: Activity logging should work correctly
                        await userManagementService.logUserActivity({
                            userId: user.id,
                            organizationId: user.organizationId,
                            action,
                            resource,
                            resourceId: generateId(),
                            details
                        });

                        // Should be able to retrieve the activity
                        const activities = await userManagementService.queryUserActivity({
                            userId: user.id,
                            actions: [action],
                            limit: 10
                        });

                        expect(activities.length).toBeGreaterThan(0);

                        const loggedActivity = activities.find(a =>
                            a.userId === user.id &&
                            a.action === action &&
                            a.resource === resource
                        );

                        expect(loggedActivity).toBeDefined();
                        expect(loggedActivity!.organizationId).toBe(user.organizationId);
                        expect(loggedActivity!.details).toEqual(details);
                        expect(loggedActivity!.timestamp).toBeInstanceOf(Date);

                        return true;
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should generate accurate activity summaries', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    fc.array(
                        fc.record({
                            action: fc.constantFrom('user_invited', 'role_assigned', 'document_created'),
                            resource: fc.constantFrom('user', 'document', 'template'),
                            details: fc.record({ test: fc.string() })
                        }),
                        { minLength: 1, maxLength: 10 }
                    ),
                    async (user, activities) => {
                        // Set up test data
                        testUsers.set(user.id, user);
                        userManagementService.setUsers(testUsers);

                        // Property: Activity summary should be accurate
                        // Log multiple activities
                        for (const activity of activities) {
                            await userManagementService.logUserActivity({
                                userId: user.id,
                                organizationId: user.organizationId,
                                action: activity.action,
                                resource: activity.resource,
                                resourceId: generateId(),
                                details: activity.details
                            });
                        }

                        // Get summary
                        const summary = await userManagementService.getUserActivitySummary(
                            user.id,
                            user.organizationId
                        );

                        // Summary should be accurate
                        expect(summary.totalEvents).toBeGreaterThanOrEqual(activities.length);

                        // Count events by action
                        const expectedActionCounts: Record<string, number> = {};
                        for (const activity of activities) {
                            expectedActionCounts[activity.action] = (expectedActionCounts[activity.action] || 0) + 1;
                        }

                        for (const [action, expectedCount] of Object.entries(expectedActionCounts)) {
                            expect(summary.eventsByAction[action]).toBeGreaterThanOrEqual(expectedCount);
                        }

                        // Should have last activity timestamp
                        expect(summary.lastActivity).toBeInstanceOf(Date);

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should filter activity queries correctly', () => {
            /**
             * **Feature: docusign-alternative-comprehensive, Property 33: User Management Operations**
             * **Validates: Requirements 7.3**
             */
            fc.assert(
                fc.property(
                    arbitraryUser(),
                    arbitraryUser(),
                    fc.constantFrom('user_invited', 'role_assigned', 'document_created'),
                    fc.constantFrom('user', 'document', 'template'),
                    async (user1, user2, action, resource) => {
                        // Set up test data
                        testUsers.set(user1.id, user1);
                        testUsers.set(user2.id, user2);
                        userManagementService.setUsers(testUsers);

                        // Property: Activity filtering should work correctly
                        // Log activities for both users
                        await userManagementService.logUserActivity({
                            userId: user1.id,
                            organizationId: user1.organizationId,
                            action,
                            resource,
                            resourceId: generateId(),
                            details: { test: 'user1' }
                        });

                        await userManagementService.logUserActivity({
                            userId: user2.id,
                            organizationId: user2.organizationId,
                            action: 'different_action',
                            resource: 'different_resource',
                            resourceId: generateId(),
                            details: { test: 'user2' }
                        });

                        // Query activities for user1 only
                        const user1Activities = await userManagementService.queryUserActivity({
                            userId: user1.id,
                            limit: 100
                        });

                        // Should only return user1's activities
                        expect(user1Activities.length).toBeGreaterThan(0);
                        for (const activity of user1Activities) {
                            expect(activity.userId).toBe(user1.id);
                        }

                        // Query by action
                        const actionActivities = await userManagementService.queryUserActivity({
                            actions: [action],
                            limit: 100
                        });

                        // Should only return activities with the specified action
                        for (const activity of actionActivities) {
                            expect(activity.action).toBe(action);
                        }

                        return true;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
});