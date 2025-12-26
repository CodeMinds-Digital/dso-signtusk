import { PrismaClient } from '@prisma/client';
import { seedOrganizations } from './organizations';
import { seedUsers } from './users';
import { seedRoles } from './roles';
import { seedDocuments } from './documents';
import { seedTemplates } from './templates';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    try {
        // Clean existing data in development
        if (process.env.NODE_ENV === 'development') {
            console.log('🧹 Cleaning existing data...');
            await cleanDatabase();
        }

        // Seed in order of dependencies
        console.log('📊 Seeding organizations...');
        const organizations = await seedOrganizations(prisma);

        console.log('👥 Seeding roles...');
        await seedRoles(prisma, organizations);

        console.log('👤 Seeding users...');
        const users = await seedUsers(prisma, organizations);

        console.log('📄 Seeding documents...');
        await seedDocuments(prisma, organizations, users);

        console.log('📋 Seeding templates...');
        await seedTemplates(prisma, organizations, users);

        console.log('✅ Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        throw error;
    }
}

async function cleanDatabase() {
    // Delete in reverse order of dependencies
    await prisma.auditEvent.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.signature.deleteMany();
    await prisma.documentField.deleteMany();
    await prisma.recipient.deleteMany();
    await prisma.signingRequest.deleteMany();
    await prisma.templateShare.deleteMany();
    await prisma.templateRecipient.deleteMany();
    await prisma.templateField.deleteMany();
    await prisma.template.deleteMany();
    await prisma.documentShare.deleteMany();
    await prisma.documentVersion.deleteMany();
    await prisma.document.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.webhookDelivery.deleteMany();
    await prisma.webhook.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.usageRecord.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.apiToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.passkey.deleteMany();
    await prisma.twoFactorAuth.deleteMany();
    await prisma.teamRole.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });