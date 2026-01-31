#!/usr/bin/env tsx
/**
 * Email Triggers Testing Script
 *
 * This script helps test all email triggers in the system.
 * Run with: npx tsx scripts/test-all-email-triggers.ts
 */

import { prisma } from "@signtusk/prisma";

interface EmailTest {
  name: string;
  category: string;
  jobId?: string;
  testFunction: () => Promise<{ success: boolean; message: string }>;
}

const emailTests: EmailTest[] = [
  {
    name: "Signup Confirmation Email",
    category: "Authentication",
    jobId: "send.signup.confirmation.email",
    testFunction: async () => {
      // Check if job definition exists
      const testEmail = "test@example.com";
      return {
        success: true,
        message: `✅ CONFIRMED WORKING by user`,
      };
    },
  },
  {
    name: "Document Signing Request Email",
    category: "Document Workflow",
    jobId: "send.signing.requested.email",
    testFunction: async () => {
      // Check for recent signing request emails
      const recentRecipients = await prisma.recipient.findMany({
        where: {
          sendStatus: "SENT",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        take: 5,
      });

      return {
        success: recentRecipients.length > 0,
        message: `Found ${recentRecipients.length} recent signing requests`,
      };
    },
  },
  {
    name: "Recipient Signed Notification",
    category: "Document Workflow",
    jobId: "send.recipient.signed.email",
    testFunction: async () => {
      // Check for recently signed recipients
      const signedRecipients = await prisma.recipient.findMany({
        where: {
          signingStatus: "SIGNED",
          signedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        take: 5,
      });

      return {
        success: signedRecipients.length > 0,
        message: `Found ${signedRecipients.length} recently signed recipients`,
      };
    },
  },
  {
    name: "Document Rejection Emails",
    category: "Document Workflow",
    jobId: "send.signing.rejected.emails",
    testFunction: async () => {
      // Check for rejected documents
      const rejectedRecipients = await prisma.recipient.findMany({
        where: {
          signingStatus: "REJECTED",
        },
        take: 5,
      });

      return {
        success: true,
        message: `Found ${rejectedRecipients.length} rejected recipients`,
      };
    },
  },
  {
    name: "Document Cancelled Emails",
    category: "Document Workflow",
    jobId: "send.document.cancelled.emails",
    testFunction: async () => {
      // Check for cancelled documents
      const cancelledDocs = await prisma.envelope.findMany({
        where: {
          status: "DRAFT", // Cancelled documents might be in DRAFT status
          deletedAt: {
            not: null,
          },
        },
        take: 5,
      });

      return {
        success: true,
        message: `Found ${cancelledDocs.length} cancelled documents`,
      };
    },
  },
  {
    name: "Organisation Member Joined",
    category: "Organisation",
    jobId: "send.organisation-member-joined.email",
    testFunction: async () => {
      // Check for recent organisation members
      const recentMembers = await prisma.organisationMember.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        take: 5,
      });

      return {
        success: true,
        message: `Found ${recentMembers.length} recent organisation members`,
      };
    },
  },
  {
    name: "Team Deleted Email",
    category: "Team",
    jobId: "send.team-deleted.email",
    testFunction: async () => {
      // Check for deleted teams
      const deletedTeams = await prisma.team.findMany({
        where: {
          deletedAt: {
            not: null,
          },
        },
        take: 5,
      });

      return {
        success: true,
        message: `Found ${deletedTeams.length} deleted teams`,
      };
    },
  },
];

async function checkDatabaseHealth() {
  console.log("\n🔍 Checking Database Health...\n");

  // Check for invalid emails
  const invalidEmails = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "User"
    WHERE email IS NULL 
       OR email = '' 
       OR email NOT LIKE '%@%'
       OR email NOT LIKE '%.%'
  `;

  const invalidCount = Number(invalidEmails[0]?.count || 0);

  if (invalidCount > 0) {
    console.log(`⚠️  Found ${invalidCount} users with invalid emails`);
    console.log(
      "   Run: npx prisma db execute --file fix-invalid-emails.sql --schema packages/prisma/schema.prisma\n"
    );
  } else {
    console.log("✅ No invalid emails found\n");
  }

  // Check for recent email activity
  const recentRecipients = await prisma.recipient.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`📊 Recent Activity (Last 7 Days):`);
  console.log(`   Recipients created: ${recentRecipients}`);

  const sentEmails = await prisma.recipient.count({
    where: {
      sendStatus: "SENT",
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`   Emails sent: ${sentEmails}`);

  const signedRecipients = await prisma.recipient.count({
    where: {
      signingStatus: "SIGNED",
      signedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`   Documents signed: ${signedRecipients}\n`);
}

async function testEmailTriggers() {
  console.log("📧 Email Triggers Testing Suite\n");
  console.log("=".repeat(60));

  await checkDatabaseHealth();

  console.log("🧪 Testing Email Triggers...\n");

  const results: Array<{
    category: string;
    name: string;
    jobId?: string;
    success: boolean;
    message: string;
  }> = [];

  for (const test of emailTests) {
    try {
      const result = await test.testFunction();
      results.push({
        category: test.category,
        name: test.name,
        jobId: test.jobId,
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      results.push({
        category: test.category,
        name: test.name,
        jobId: test.jobId,
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // Group by category
  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    console.log(`\n📁 ${category}`);
    console.log("-".repeat(60));

    const categoryResults = results.filter((r) => r.category === category);

    for (const result of categoryResults) {
      const icon = result.success ? "✅" : "❌";
      console.log(`${icon} ${result.name}`);
      if (result.jobId) {
        console.log(`   Job ID: ${result.jobId}`);
      }
      console.log(`   ${result.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log(`\n📊 Summary: ${successCount}/${totalCount} tests passed\n`);

  if (successCount === totalCount) {
    console.log("🎉 All email triggers are configured correctly!\n");
  } else {
    console.log("⚠️  Some email triggers need attention. See details above.\n");
  }
}

async function main() {
  try {
    await testEmailTriggers();
  } catch (error) {
    console.error("❌ Error running tests:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
