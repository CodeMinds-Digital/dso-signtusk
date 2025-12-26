import { describe, it, expect, beforeEach } from 'vitest';
import { UserManagementService } from '../packages/auth/src/user-management-service';
import type {
    RoleAssignmentData,
    AccessControlCheck
} from '../packages/auth/src/user-management-service';
import type { User } from '../packages/auth/src/types';

describe('Debug Specific Property Test Failure', () => {
    let userManagementService: UserManagementService;
    let testUsers: Map<string, User>;

    beforeEach(() => {
        userManagementService = new UserManagementService();
        testUsers = new Map();
        userManagementService.setUsers(testUsers);
    });

    it('should debug the exact failing case from property test', async () => {
        // This is the exact failing case from the property test
        const user: User = {
            id: "-00000A000",
            email: "a@a.aa",
            name: "00",
            passwordHash: "                    ",
            organizationId: "0-00000000",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        testUsers.set(user.id, user);
        userManagementService.setUsers(testUsers);

        console.log('=== DEBUGGING ROLE ASSIGNMENT FAILURE ===');
        console.log('User:', user);
        console.log('Initial role assignments count:', userManagementService.getRoleAssignments().size);

        // Try to assign admin role
        const assignmentData: RoleAssignmentData = {
            userId: user.id,
            roleIds: ['admin'],
            assignedBy: user.id
        };

        console.log('Assignment data:', assignmentData);

        const assignResult = await userManagementService.assignRole(assignmentData);
        console.log('Assignment result:', assignResult);
        console.log('Role assignments after assignment:', userManagementService.getRoleAssignments().size);
        console.log('All role assignments:', Array.from(userManagementService.getRoleAssignments().values()));

        if (assignResult.success && assignResult.assignments) {
            console.log('Assignments created:', assignResult.assignments.length);
            console.log('Assignment details:', assignResult.assignments);

            // Try to retrieve roles
            console.log('=== RETRIEVING ROLES ===');
            const userRoles = await userManagementService.getUserRoles(user.id);
            console.log('Retrieved user roles:', userRoles);
            console.log('Expected role count:', assignResult.assignments.length);
            console.log('Actual role count:', userRoles.length);

            // Check if the role assignment is in the map
            for (const assignment of assignResult.assignments) {
                const storedAssignment = userManagementService.getRoleAssignments().get(assignment.id);
                console.log(`Assignment ${assignment.id} in map:`, storedAssignment);
            }

            // This is where the property test fails
            expect(userRoles.length).toBeGreaterThan(0);
            expect(userRoles.map(r => r.roleId)).toContain('admin');

            // Test access control
            const accessCheck: AccessControlCheck = {
                userId: user.id,
                resource: 'user',
                action: 'read'
            };

            const accessResult = await userManagementService.checkAccess(accessCheck);
            console.log('Access check result:', accessResult);
            expect(accessResult.roles).toContain('admin');
        } else {
            console.log('Assignment failed:', assignResult.error);
            throw new Error(`Assignment failed: ${assignResult.error}`);
        }
    });

    it('should debug activity logging failure', async () => {
        // This reproduces the activity logging failure with same IDs
        const user1: User = {
            id: "0000000000", // Same ID
            email: "a@a.aa",
            name: "-0",
            passwordHash: "                    ",
            organizationId: "00000A0000",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        const user2: User = {
            id: "0000AA-000", // Different ID
            email: "a@a.aa",
            name: "A-",
            passwordHash: "                    ",
            organizationId: "-00A000AA0",
            roles: [],
            emailVerified: false,
            isActive: false,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z")
        };

        console.log('=== DEBUGGING ACTIVITY LOGGING ===');
        console.log('User1:', user1);
        console.log('User2:', user2);

        testUsers.set(user1.id, user1);
        testUsers.set(user2.id, user2);
        userManagementService.setUsers(testUsers);

        console.log('Users in map:', testUsers.size);
        console.log('User1 in map:', testUsers.get(user1.id));
        console.log('User2 in map:', testUsers.get(user2.id));

        // Log activity for user1
        console.log('Logging activity for user1...');
        await userManagementService.logUserActivity({
            userId: user1.id,
            organizationId: user1.organizationId,
            action: 'user_invited',
            resource: 'user',
            resourceId: 'test-resource',
            details: { test: 'user1' }
        });

        // Log activity for user2 with different action
        console.log('Logging activity for user2...');
        await userManagementService.logUserActivity({
            userId: user2.id,
            organizationId: user2.organizationId,
            action: 'different_action',
            resource: 'different_resource',
            resourceId: 'test-resource-2',
            details: { test: 'user2' }
        });

        console.log('All activities:', userManagementService.getActivityEvents());

        // Query activities for user1
        const user1Activities = await userManagementService.queryUserActivity({
            userId: user1.id,
            limit: 100
        });

        console.log('Activities for user1:', user1Activities);
        console.log('Expected: > 0, Actual:', user1Activities.length);

        // This is where the property test fails
        expect(user1Activities.length).toBeGreaterThan(0);
        for (const activity of user1Activities) {
            expect(activity.userId).toBe(user1.id);
        }
    });
});