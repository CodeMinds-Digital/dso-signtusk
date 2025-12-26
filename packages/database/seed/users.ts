import { PrismaClient, Organization, User } from '@prisma/client';

export async function seedUsers(prisma: PrismaClient, organizations: Organization[]): Promise<User[]> {
    const users = [
        // Acme Corporation users
        {
            id: 'user_john_doe_001',
            email: 'john.doe@acme.com',
            name: 'John Doe',
            organizationId: organizations[0].id,
            avatar: 'https://example.com/avatars/john-doe.jpg',
        },
        {
            id: 'user_jane_smith_002',
            email: 'jane.smith@acme.com',
            name: 'Jane Smith',
            organizationId: organizations[0].id,
            avatar: 'https://example.com/avatars/jane-smith.jpg',
        },
        {
            id: 'user_bob_wilson_003',
            email: 'bob.wilson@acme.com',
            name: 'Bob Wilson',
            organizationId: organizations[0].id,
        },

        // TechStart Inc users
        {
            id: 'user_alice_johnson_004',
            email: 'alice.johnson@techstart.io',
            name: 'Alice Johnson',
            organizationId: organizations[1].id,
            avatar: 'https://example.com/avatars/alice-johnson.jpg',
        },
        {
            id: 'user_charlie_brown_005',
            email: 'charlie.brown@techstart.io',
            name: 'Charlie Brown',
            organizationId: organizations[1].id,
        },

        // Legal Partners LLC users
        {
            id: 'user_diana_prince_006',
            email: 'diana.prince@legalpartners.com',
            name: 'Diana Prince',
            organizationId: organizations[2].id,
            avatar: 'https://example.com/avatars/diana-prince.jpg',
        },
        {
            id: 'user_edward_norton_007',
            email: 'edward.norton@legalpartners.com',
            name: 'Edward Norton',
            organizationId: organizations[2].id,
        },
    ];

    const createdUsers: User[] = [];

    for (const userData of users) {
        const user = await prisma.user.create({
            data: userData,
        });
        createdUsers.push(user);
    }

    return createdUsers;
}