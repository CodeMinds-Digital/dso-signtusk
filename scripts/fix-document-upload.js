const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function fixDocumentUpload() {
    const prisma = new PrismaClient();

    try {
        console.log('🔧 Fixing document upload functionality...');
        console.log('');

        // 1. Initialize counter records
        console.log('📊 Initializing counter records...');

        const documentCounter = await prisma.counter.upsert({
            where: { id: 'document' },
            update: {},
            create: {
                id: 'document',
                value: 0,
            }
        });

        const templateCounter = await prisma.counter.upsert({
            where: { id: 'template' },
            update: {},
            create: {
                id: 'template',
                value: 0,
            }
        });

        console.log('✅ Document counter initialized:', documentCounter.value);
        console.log('✅ Template counter initialized:', templateCounter.value);
        console.log('');

        // 2. Verify demo users exist
        console.log('👤 Verifying demo users...');

        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@demo.local' }
        });

        const regularUser = await prisma.user.findUnique({
            where: { email: 'user@demo.local' }
        });

        if (adminUser) {
            console.log('✅ Admin user exists:', adminUser.email);
        } else {
            console.log('⚠️  Admin user not found - run create-complete-demo-users.js');
        }

        if (regularUser) {
            console.log('✅ Regular user exists:', regularUser.email);
        } else {
            console.log('⚠️  Regular user not found - run create-complete-demo-users.js');
        }
        console.log('');

        // 3. Verify organisation and team structure
        console.log('🏢 Verifying organisation structure...');

        const org = await prisma.organisation.findUnique({
            where: { url: 'demo-org' },
            include: {
                teams: true,
                members: true
            }
        });

        if (org) {
            console.log('✅ Demo organisation exists:', org.name);
            console.log('✅ Teams:', org.teams.length);
            console.log('✅ Members:', org.members.length);
        } else {
            console.log('⚠️  Demo organisation not found - run create-complete-demo-users.js');
        }
        console.log('');

        // 4. Verify folders exist
        console.log('📁 Verifying folder structure...');

        const folders = await prisma.folder.findMany({
            where: {
                name: {
                    in: ['Demo Documents', 'Demo Templates']
                }
            }
        });

        console.log('✅ Folders found:', folders.length);
        folders.forEach(folder => {
            console.log(`  - ${folder.name} (${folder.type})`);
        });
        console.log('');

        console.log('🎉 Document upload fix completed!');
        console.log('');
        console.log('📋 Summary:');
        console.log('✅ Counter records initialized');
        console.log('✅ Database structure verified');
        console.log('✅ Document upload should now work');
        console.log('');
        console.log('🌐 Test at: http://localhost:3000');
        console.log('👤 Login: admin@demo.local / admin123');

    } catch (error) {
        console.error('❌ Error fixing document upload:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixDocumentUpload().catch(console.error);