import { PrismaClient, Organization } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient, organizations: Organization[]): Promise<void> {
    const systemRoles = [
        {
            name: 'Admin',
            description: 'Full system administration access',
            isSystem: true,
            permissions: [
                'users.create',
                'users.read',
                'users.update',
                'users.delete',
                'documents.create',
                'documents.read',
                'documents.update',
                'documents.delete',
                'templates.create',
                'templates.read',
                'templates.update',
                'templates.delete',
                'signing.create',
                'signing.read',
                'signing.update',
                'signing.delete',
                'organization.manage',
                'billing.manage',
                'integrations.manage',
            ],
        },
        {
            name: 'Manager',
            description: 'Team and document management access',
            isSystem: true,
            permissions: [
                'users.read',
                'users.update',
                'documents.create',
                'documents.read',
                'documents.update',
                'templates.create',
                'templates.read',
                'templates.update',
                'signing.create',
                'signing.read',
                'signing.update',
                'team.manage',
            ],
        },
        {
            name: 'User',
            description: 'Standard user access',
            isSystem: true,
            permissions: [
                'documents.create',
                'documents.read',
                'documents.update',
                'templates.read',
                'templates.use',
                'signing.create',
                'signing.read',
                'signing.sign',
            ],
        },
        {
            name: 'Viewer',
            description: 'Read-only access',
            isSystem: true,
            permissions: [
                'documents.read',
                'templates.read',
                'signing.read',
            ],
        },
    ];

    // Create system roles for each organization
    for (const organization of organizations) {
        for (const roleData of systemRoles) {
            await prisma.role.create({
                data: {
                    ...roleData,
                    organizationId: organization.id,
                },
            });
        }

        // Create organization-specific roles
        if (organization.slug === 'legal-partners') {
            await prisma.role.create({
                data: {
                    name: 'Legal Counsel',
                    description: 'Legal document review and approval',
                    organizationId: organization.id,
                    isSystem: false,
                    permissions: [
                        'documents.create',
                        'documents.read',
                        'documents.update',
                        'documents.approve',
                        'templates.create',
                        'templates.read',
                        'templates.update',
                        'signing.create',
                        'signing.read',
                        'signing.update',
                        'legal.review',
                        'compliance.audit',
                    ],
                },
            });
        }
    }

    // Assign roles to users
    const adminRole = await prisma.role.findFirst({
        where: {
            name: 'Admin',
            organizationId: organizations[0].id,
        },
    });

    const managerRole = await prisma.role.findFirst({
        where: {
            name: 'Manager',
            organizationId: organizations[1].id,
        },
    });

    const userRole = await prisma.role.findFirst({
        where: {
            name: 'User',
            organizationId: organizations[2].id,
        },
    });

    if (adminRole) {
        await prisma.userRole.create({
            data: {
                userId: 'user_john_doe_001',
                roleId: adminRole.id,
            },
        });
    }

    if (managerRole) {
        await prisma.userRole.create({
            data: {
                userId: 'user_alice_johnson_004',
                roleId: managerRole.id,
            },
        });
    }

    if (userRole) {
        await prisma.userRole.create({
            data: {
                userId: 'user_diana_prince_006',
                roleId: userRole.id,
            },
        });
    }
}