#!/usr/bin/env node

// Simple script to create a test user in SQLite database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: 'file:./packages/prisma/dev.db'
            }
        }
    });

    try {
        console.log('🔄 Creating test user...');

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: 'Demo Admin',
                email: 'admin@demo.local',
                password: hashedPassword,
                roles: 'ADMIN,USER',
                emailVerified: new Date(),
            }
        });

        console.log('✅ Test user created successfully!');
        console.log('📧 Email: admin@demo.local');
        console.log('🔑 Password: admin123');
        console.log('👤 User ID:', user.id);

    } catch (error) {
        if (error.code === 'P2002') {
            console.log('ℹ️  User already exists: admin@demo.local');
        } else {
            console.error('❌ Error creating user:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();