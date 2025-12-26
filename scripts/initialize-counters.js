const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initializeCounters() {
    const prisma = new PrismaClient();

    try {
        console.log('🔄 Initializing counter records...');

        // Initialize document counter
        await prisma.counter.upsert({
            where: { id: 'document' },
            update: {},
            create: {
                id: 'document',
                value: 0,
            }
        });

        // Initialize template counter
        await prisma.counter.upsert({
            where: { id: 'template' },
            update: {},
            create: {
                id: 'template',
                value: 0,
            }
        });

        console.log('✅ Counter records initialized successfully!');
        console.log('📊 Document counter: 0');
        console.log('📊 Template counter: 0');
        console.log('');
        console.log('🎉 Document upload should now work correctly!');

    } catch (error) {
        console.error('❌ Error initializing counters:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

initializeCounters().catch(console.error);