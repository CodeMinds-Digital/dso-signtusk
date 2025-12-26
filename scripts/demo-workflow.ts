#!/usr/bin/env tsx

/**
 * Demo Workflow Script
 * 
 * This script demonstrates the complete user workflow including:
 * - User authentication
 * - Document creation
 * - Signing workflow
 * - Organization management
 */

import { prisma } from '@signtusk/prisma';

interface DemoWorkflowOptions {
    userEmail: string;
    skipDocumentCreation?: boolean;
    verbose?: boolean;
}

async function demonstrateUserWorkflow(options: DemoWorkflowOptions) {
    const { userEmail, skipDocumentCreation = false, verbose = true } = options;

    if (verbose) {
        console.log(`\n🎭 Starting demo workflow for: ${userEmail}`);
    }

    try {
        // 1. Find the user
        const user = await prisma.user.findUnique({
            where: { email: userEmail.toLowerCase() },
            include: {
                organisations: {
                    include: {
                        teams: true,
                    },
                },
            },
        });

        if (!user) {
            throw new Error(`User not found: ${userEmail}`);
        }

        if (verbose) {
            console.log(`✅ User found: ${user.name} (ID: ${user.id})`);
            console.log(`   Email verified: ${user.emailVerified ? '✅' : '❌'}`);
            console.log(`   Roles: ${user.roles.join(', ')}`);
            console.log(`   Organizations: ${user.organisations.length}`);
        }

        // 2. Get user's organization and team
        const organisation = user.organisations[0];
        const team = organisation?.teams[0];

        if (!organisation || !team) {
            throw new Error('User has no organization or team');
        }

        if (verbose) {
            console.log(`   Organization: ${organisation.name}`);
            console.log(`   Team: ${team.name}`);
        }

        // 3. Check existing documents
        const existingDocuments = await prisma.document.findMany({
            where: { userId: user.id },
            take: 5,
        });

        if (verbose) {
            console.log(`   Existing documents: ${existingDocuments.length}`);
        }

        // 4. Create a new document if requested
        if (!skipDocumentCreation) {
            const newDocument = await prisma.document.create({
                data: {
                    title: `Demo Document - ${new Date().toISOString().split('T')[0]}`,
                    status: 'DRAFT',
                    userId: user.id,
                    teamId: team.id,
                    documentData: Buffer.from(`Demo document content for ${user.name}`),
                    documentMeta: {
                        fileName: `demo-${Date.now()}.pdf`,
                        mimeType: 'application/pdf',
                        bytes: 2048,
                    },
                },
            });

            if (verbose) {
                console.log(`✅ New document created: ${newDocument.title} (ID: ${newDocument.id})`);
            }
        }

        // 5. Get user's recent activity
        const recentActivity = await prisma.auditEvent.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });

        if (verbose && recentActivity.length > 0) {
            console.log(`   Recent activity: ${recentActivity.length} events`);
            recentActivity.forEach((event, index) => {
                console.log(`     ${index + 1}. ${event.type} - ${event.createdAt.toISOString()}`);
            });
        }

        return {
            user,
            organisation,
            team,
            documents: existingDocuments,
            recentActivity,
        };

    } catch (error) {
        console.error(`❌ Demo workflow failed for ${userEmail}:`, error);
        throw error;
    }
}

async function runAllDemoWorkflows() {
    console.log('🎭 Running demo workflows for all demo users...\n');

    const demoEmails = [
        'admin@demo.docusign-alternative.com',
        'manager@demo.docusign-alternative.com',
        'user@demo.docusign-alternative.com',
        'john.doe@demo.docusign-alternative.com',
    ];

    const results = [];

    for (const email of demoEmails) {
        try {
            const result = await demonstrateUserWorkflow({
                userEmail: email,
                skipDocumentCreation: false,
                verbose: true,
            });
            results.push(result);
            console.log(''); // Add spacing between users
        } catch (error) {
            console.error(`Failed workflow for ${email}:`, error);
        }
    }

    return results;
}

async function displaySystemStats() {
    console.log('\n📊 System Statistics:');
    console.log('='.repeat(40));

    try {
        const stats = await Promise.all([
            prisma.user.count(),
            prisma.organisation.count(),
            prisma.team.count(),
            prisma.document.count(),
            prisma.auditEvent.count(),
        ]);

        console.log(`👥 Total Users: ${stats[0]}`);
        console.log(`🏢 Total Organizations: ${stats[1]}`);
        console.log(`👨‍👩‍👧‍👦 Total Teams: ${stats[2]}`);
        console.log(`📄 Total Documents: ${stats[3]}`);
        console.log(`📋 Total Audit Events: ${stats[4]}`);

        // Get user breakdown by role
        const adminCount = await prisma.user.count({
            where: { roles: { has: 'ADMIN' } },
        });

        console.log(`\n👑 Admin Users: ${adminCount}`);
        console.log(`👤 Regular Users: ${stats[0] - adminCount}`);

        // Get document status breakdown
        const documentStats = await prisma.document.groupBy({
            by: ['status'],
            _count: { status: true },
        });

        console.log('\n📄 Documents by Status:');
        documentStats.forEach(stat => {
            console.log(`   ${stat.status}: ${stat._count.status}`);
        });

    } catch (error) {
        console.error('❌ Failed to get system stats:', error);
    }
}

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected');

        // Run demo workflows
        await runAllDemoWorkflows();

        // Display system statistics
        await displaySystemStats();

        console.log('\n✅ Demo workflow completed successfully!');

    } catch (error) {
        console.error('❌ Demo workflow failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

export { demonstrateUserWorkflow, runAllDemoWorkflows };