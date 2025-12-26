#!/usr/bin/env tsx

/**
 * Simple Demo Setup (No Docker Required)
 * 
 * This script creates a minimal demo environment using SQLite
 * and demonstrates the core functionality without external dependencies.
 */

import { Role } from '@prisma/client';
import { hashSync } from '@signtusk/lib/server-only/auth/hash';
import { prisma } from '@signtusk/prisma';

interface SimpleDemoUser {
    name: string;
    email: string;
    password: string;
    isAdmin?: boolean;
}

const SIMPLE_DEMO_USERS: SimpleDemoUser[] = [
    {
        name: 'Demo Admin',
        email: 'admin@demo.local',
        password: 'admin123',
        isAdmin: true,
    },
    {
        name: 'Demo User',
        email: 'user@demo.local',
        password: 'user123',
        isAdmin: false,
    },
];

async function createSimpleDemoUser(config: SimpleDemoUser) {
    console.log(`Creating user: ${config.name} (${config.email})`);

    try {
        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { email: config.email },
        });

        if (existing) {
            console.log(`  ⚠️  User already exists, skipping...`);
            return existing;
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                name: config.name,
                email: config.email,
                password: hashSync(config.password),
                emailVerified: new Date(),
                roles: config.isAdmin ? [Role.USER, Role.ADMIN] : [Role.USER],
            },
        });

        console.log(`  ✅ User created with ID: ${user.id}`);
        return user;

    } catch (error) {
        console.error(`  ❌ Failed to create user:`, error);
        throw error;
    }
}

async function setupSimpleDemo() {
    console.log('🚀 Setting up simple demo environment...\n');

    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected\n');

        // Clean up existing demo users
        console.log('🧹 Cleaning up existing demo users...');
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: SIMPLE_DEMO_USERS.map(u => u.email),
                },
            },
        });
        console.log('✅ Cleanup complete\n');

        // Create demo users
        console.log('👥 Creating demo users...');
        const users = [];
        for (const userConfig of SIMPLE_DEMO_USERS) {
            const user = await createSimpleDemoUser(userConfig);
            users.push(user);
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 SIMPLE DEMO SETUP COMPLETE!');
        console.log('='.repeat(50));

        console.log('\n📋 Demo Credentials:');
        SIMPLE_DEMO_USERS.forEach(user => {
            console.log(`\n👤 ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Role: ${user.isAdmin ? 'Admin' : 'User'}`);
        });

        console.log('\n🌐 Next Steps:');
        console.log('1. Start the app: npm run dev');
        console.log('2. Open: http://localhost:3000');
        console.log('3. Sign in with the credentials above');

        console.log('\n💡 Note: This demo uses SQLite and minimal features');
        console.log('For full features, set up Docker services with npm run dev:services');

        return users;

    } catch (error) {
        console.error('❌ Demo setup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    await setupSimpleDemo();
}

if (require.main === module) {
    main().catch(console.error);
}

export { setupSimpleDemo, createSimpleDemoUser };