#!/usr/bin/env tsx

/**
 * Demo User Creation Script
 * 
 * This script creates demo users end-to-end for the Signtusk platform.
 * It demonstrates the complete user lifecycle including:
 * - User registration
 * - Email verification
 * - Organization setup
 * - Role assignment
 * - Onboarding flow
 * - Document creation capabilities
 */

import { Role, OrganisationType } from '@prisma/client';
import { customAlphabet } from 'nanoid';

import { hashSync } from '@signtusk/lib/server-only/auth/hash';
import { createPersonalOrganisation } from '@signtusk/lib/server-only/organisation/create-organisation';
import { prisma } from '@signtusk/prisma';
import { seedUser } from '@signtusk/prisma/seed/users';

const nanoid = customAlphabet('1234567890abcdef', 10);

interface DemoUserConfig {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user' | 'manager';
    organizationType: 'personal' | 'business';
    verified: boolean;
}

const DEMO_USERS: DemoUserConfig[] = [
    {
        name: 'Demo Admin',
        email: 'admin@demo.signtusk.com',
        password: 'DemoAdmin123!',
        role: 'admin',
        organizationType: 'business',
        verified: true,
    },
    {
        name: 'Demo Manager',
        email: 'manager@demo.signtusk.com',
        password: 'DemoManager123!',
        role: 'manager',
        organizationType: 'business',
        verified: true,
    },
    {
        name: 'Demo User',
        email: 'user@demo.signtusk.com',
        password: 'DemoUser123!',
        role: 'user',
        organizationType: 'personal',
        verified: true,
    },
    {
        name: 'John Doe',
        email: 'john.doe@demo.signtusk.com',
        password: 'JohnDoe123!',
        role: 'user',
        organizationType: 'personal',
        verified: false, // For testing email verification flow
    },
];

async function createDemoUser(config: DemoUserConfig) {
    console.log(`\n🔄 Creating demo user: ${config.name} (${config.email})`);

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: config.email.toLowerCase() },
        });

        if (existingUser) {
            console.log(`⚠️  User ${config.email} already exists, skipping...`);
            return existingUser;
        }

        // Create user with appropriate roles
        const roles = [Role.USER];
        if (config.role === 'admin') {
            roles.push(Role.ADMIN);
        }

        const user = await prisma.user.create({
            data: {
                name: config.name,
                email: config.email.toLowerCase(),
                password: hashSync(config.password),
                emailVerified: config.verified ? new Date() : undefined,
                roles,
            },
        });

        console.log(`✅ User created with ID: ${user.id}`);

        // Create organization
        await createPersonalOrganisation({
            userId: user.id,
            inheritMembers: true,
            type: config.organizationType === 'personal'
                ? OrganisationType.PERSONAL
                : OrganisationType.ORGANISATION,
        });

        const organisation = await prisma.organisation.findFirstOrThrow({
            where: { ownerUserId: user.id },
            include: { teams: true, organisationClaim: true },
        });

        // Enable legacy envelopes for demo purposes
        await prisma.organisationClaim.update({
            where: { id: organisation.organisationClaim.id },
            data: {
                flags: {
                    allowLegacyEnvelopes: true,
                },
            },
        });

        console.log(`✅ Organization created: ${organisation.name}`);

        // Create verification token for unverified users
        if (!config.verified) {
            await prisma.verificationToken.create({
                data: {
                    identifier: 'confirmation-email',
                    token: nanoid(),
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    userId: user.id,
                },
            });
            console.log(`📧 Verification token created for ${config.email}`);
        }

        return {
            user,
            organisation,
            team: organisation.teams[0],
        };

    } catch (error) {
        console.error(`❌ Failed to create user ${config.email}:`, error);
        throw error;
    }
}

async function createDemoDocuments(userId: number, teamId: string) {
    console.log(`\n📄 Creating demo documents for user ${userId}`);

    try {
        // Create a sample document
        const document = await prisma.document.create({
            data: {
                title: 'Demo Contract Agreement',
                status: 'DRAFT',
                userId,
                teamId,
                documentData: Buffer.from('Sample PDF content for demo'),
                documentMeta: {
                    fileName: 'demo-contract.pdf',
                    mimeType: 'application/pdf',
                    bytes: 1024,
                },
            },
        });

        console.log(`✅ Demo document created: ${document.title}`);
        return document;

    } catch (error) {
        console.error('❌ Failed to create demo documents:', error);
        throw error;
    }
}

async function setupDemoData() {
    console.log('🚀 Starting demo user creation process...\n');

    const createdUsers = [];

    for (const userConfig of DEMO_USERS) {
        try {
            const result = await createDemoUser(userConfig);
            if (result) {
                createdUsers.push(result);

                // Create demo documents for each user
                await createDemoDocuments(result.user.id, result.team.id);
            }
        } catch (error) {
            console.error(`Failed to create user ${userConfig.email}:`, error);
        }
    }

    return createdUsers;
}

async function displayDemoCredentials(users: any[]) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO USERS CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));

    console.log('\n📋 Demo User Credentials:');
    console.log('-'.repeat(40));

    DEMO_USERS.forEach((config, index) => {
        const user = users[index];
        if (user) {
            console.log(`\n👤 ${config.name}`);
            console.log(`   Email: ${config.email}`);
            console.log(`   Password: ${config.password}`);
            console.log(`   Role: ${config.role}`);
            console.log(`   Organization: ${config.organizationType}`);
            console.log(`   Verified: ${config.verified ? '✅' : '❌'}`);
            console.log(`   User ID: ${user.user.id}`);
            console.log(`   Team ID: ${user.team.id}`);
        }
    });

    console.log('\n🌐 Application URLs:');
    console.log('-'.repeat(40));
    console.log('   Main App: http://localhost:3000');
    console.log('   Sign In: http://localhost:3000/signin');
    console.log('   Sign Up: http://localhost:3000/signup');

    console.log('\n📝 Next Steps:');
    console.log('-'.repeat(40));
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to http://localhost:3000');
    console.log('3. Sign in with any of the demo credentials above');
    console.log('4. Explore the document signing workflow');

    console.log('\n💡 Tips:');
    console.log('-'.repeat(40));
    console.log('• Use the admin account for full system access');
    console.log('• The unverified user can test email verification flow');
    console.log('• Each user has a demo document ready for testing');
    console.log('• Organizations are pre-configured with appropriate settings');
}

async function cleanupExistingDemoUsers() {
    console.log('🧹 Cleaning up existing demo users...');

    const demoEmails = DEMO_USERS.map(u => u.email.toLowerCase());

    try {
        // Delete users and their related data (cascade should handle most)
        const deletedCount = await prisma.user.deleteMany({
            where: {
                email: {
                    in: demoEmails,
                },
            },
        });

        console.log(`✅ Cleaned up ${deletedCount.count} existing demo users`);
    } catch (error) {
        console.log('⚠️  No existing demo users to clean up');
    }
}

async function main() {
    try {
        // Check database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Clean up existing demo users
        await cleanupExistingDemoUsers();

        // Create demo users
        const users = await setupDemoData();

        // Display credentials
        await displayDemoCredentials(users);

        console.log('\n✅ Demo user creation completed successfully!');

    } catch (error) {
        console.error('❌ Demo user creation failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
if (require.main === module) {
    main();
}

export { createDemoUser, setupDemoData, DEMO_USERS };