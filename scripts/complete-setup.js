const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function completeSetup() {
    const prisma = new PrismaClient();

    try {
        console.log('🚀 Running complete setup for DocuSign Alternative...');
        console.log('');

        // 1. Initialize counter records
        console.log('📊 Step 1: Initializing counter records...');

        await prisma.counter.upsert({
            where: { id: 'document' },
            update: {},
            create: {
                id: 'document',
                value: 0,
            }
        });

        await prisma.counter.upsert({
            where: { id: 'template' },
            update: {},
            create: {
                id: 'template',
                value: 0,
            }
        });

        console.log('✅ Counter records initialized');
        console.log('');

        // 2. Create demo users
        console.log('👤 Step 2: Creating demo users...');

        const adminPassword = await bcrypt.hash('admin123', 12);
        const userPassword = await bcrypt.hash('user123', 12);

        const adminUser = await prisma.user.upsert({
            where: { email: 'admin@demo.local' },
            update: {},
            create: {
                name: 'Demo Admin',
                email: 'admin@demo.local',
                password: adminPassword,
                roles: ['ADMIN', 'USER'],
                emailVerified: new Date(),
                source: 'manual',
                identityProvider: 'DOCUMENSO',
            }
        });

        const regularUser = await prisma.user.upsert({
            where: { email: 'user@demo.local' },
            update: {},
            create: {
                name: 'Demo User',
                email: 'user@demo.local',
                password: userPassword,
                roles: ['USER'],
                emailVerified: new Date(),
                source: 'manual',
                identityProvider: 'DOCUMENSO',
            }
        });

        console.log('✅ Demo users created');
        console.log('');

        // 3. Create organisation structure step by step
        console.log('🏢 Step 3: Creating organisation structure...');

        // Create organisation claim first
        const orgClaim = await prisma.organisationClaim.upsert({
            where: { id: 'demo-org-claim' },
            update: {},
            create: {
                id: 'demo-org-claim',
                teamCount: 10,
                memberCount: 100,
                envelopeItemCount: 1000,
                flags: {},
            }
        });

        // Create organisation global settings
        const orgGlobalSettings = await prisma.organisationGlobalSettings.upsert({
            where: { id: 'demo-org-settings' },
            update: {},
            create: {
                id: 'demo-org-settings',
                emailDocumentSettings: {},
            }
        });

        // Create organisation authentication portal
        const orgAuthPortal = await prisma.organisationAuthenticationPortal.upsert({
            where: { id: 'demo-org-auth-portal' },
            update: {},
            create: {
                id: 'demo-org-auth-portal',
            }
        });

        // Create organisation
        const org = await prisma.organisation.upsert({
            where: { url: 'demo-org' },
            update: {},
            create: {
                id: 'demo-org-id',
                name: 'Demo Organisation',
                url: 'demo-org',
                type: 'ORGANISATION',
                ownerUserId: adminUser.id,
                organisationClaimId: orgClaim.id,
                organisationGlobalSettingsId: orgGlobalSettings.id,
                organisationAuthenticationPortalId: orgAuthPortal.id,
            }
        });

        console.log('✅ Organisation created');

        // 4. Create team structure
        console.log('👥 Step 4: Creating team structure...');

        const teamGlobalSettings = await prisma.teamGlobalSettings.upsert({
            where: { id: 'demo-team-settings' },
            update: {},
            create: {
                id: 'demo-team-settings',
            }
        });

        const team = await prisma.team.upsert({
            where: { url: 'demo-team' },
            update: {},
            create: {
                name: 'Demo Team',
                url: 'demo-team',
                organisationId: org.id,
                teamGlobalSettingsId: teamGlobalSettings.id,
            }
        });

        console.log('✅ Team created');

        // 5. Create organisation memberships
        console.log('🤝 Step 5: Creating organisation memberships...');

        await prisma.organisationMember.upsert({
            where: {
                userId_organisationId: {
                    userId: adminUser.id,
                    organisationId: org.id
                }
            },
            update: {},
            create: {
                id: 'admin-member-id',
                userId: adminUser.id,
                organisationId: org.id,
            }
        });

        await prisma.organisationMember.upsert({
            where: {
                userId_organisationId: {
                    userId: regularUser.id,
                    organisationId: org.id
                }
            },
            update: {},
            create: {
                id: 'user-member-id',
                userId: regularUser.id,
                organisationId: org.id,
            }
        });

        console.log('✅ Organisation memberships created');

        // 6. Create demo folders
        console.log('📁 Step 6: Creating demo folders...');

        await prisma.folder.upsert({
            where: { id: 'demo-doc-folder' },
            update: {},
            create: {
                id: 'demo-doc-folder',
                name: 'Demo Documents',
                userId: adminUser.id,
                teamId: team.id,
                type: 'DOCUMENT',
                visibility: 'EVERYONE',
            }
        });

        await prisma.folder.upsert({
            where: { id: 'demo-template-folder' },
            update: {},
            create: {
                id: 'demo-template-folder',
                name: 'Demo Templates',
                userId: adminUser.id,
                teamId: team.id,
                type: 'TEMPLATE',
                visibility: 'EVERYONE',
            }
        });

        console.log('✅ Demo folders created');
        console.log('');

        console.log('🎉 Complete setup finished successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log('✅ Counter records initialized (document upload fixed)');
        console.log('✅ Demo users created');
        console.log('✅ Organisation structure created');
        console.log('✅ Team structure created');
        console.log('✅ Organisation memberships created');
        console.log('✅ Demo folders created');
        console.log('');
        console.log('🌐 Access your application:');
        console.log('   URL: http://localhost:3000');
        console.log('   Admin: admin@demo.local / admin123');
        console.log('   User:  user@demo.local / user123');
        console.log('');
        console.log('🚀 Document upload should now work perfectly!');

    } catch (error) {
        console.error('❌ Error during complete setup:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

completeSetup().catch(console.error);