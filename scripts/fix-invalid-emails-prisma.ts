#!/usr/bin/env tsx
/**
 * Fix Invalid Emails using Prisma
 *
 * This script connects to your Dokploy PostgreSQL database via Prisma
 * and fixes invalid email addresses.
 *
 * Run with: npx tsx scripts/fix-invalid-emails-prisma.ts
 */

import { prisma } from "@signtusk/prisma";

async function checkInvalidEmails() {
  console.log("\n==================================================");
  console.log("Fix Invalid Emails - Prisma Method");
  console.log("==================================================\n");

  console.log("📊 Step 1: Checking for invalid emails in User table...\n");

  // Find users with invalid emails
  const invalidUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: null },
        { email: "" },
        { email: { not: { contains: "@" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  console.log(`Found ${invalidUsers.length} users with invalid emails\n`);

  if (invalidUsers.length > 0) {
    console.log("Invalid users:");
    console.table(invalidUsers.slice(0, 10));
    console.log("");
  }

  return invalidUsers;
}

async function checkInvalidRecipients() {
  console.log("📊 Step 2: Checking for invalid emails in Recipient table...\n");

  // Find recipients with invalid emails
  const invalidRecipients = await prisma.recipient.findMany({
    where: {
      OR: [
        { email: null },
        { email: "" },
        { email: { not: { contains: "@" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sendStatus: true,
      createdAt: true,
    },
    take: 100,
  });

  console.log(
    `Found ${invalidRecipients.length} recipients with invalid emails\n`
  );

  if (invalidRecipients.length > 0) {
    console.log("Invalid recipients (showing first 10):");
    console.table(invalidRecipients.slice(0, 10));
    console.log("");
  }

  return invalidRecipients;
}

async function fixInvalidUsers(users: any[]) {
  if (users.length === 0) {
    console.log("✅ No invalid user emails to fix\n");
    return 0;
  }

  console.log("🔧 Fixing invalid user emails...\n");

  let fixed = 0;

  for (const user of users) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: `invalid_${user.id}@placeholder.local`,
        },
      });
      fixed++;
      console.log(
        `✅ Fixed user ${user.id}: ${user.email} → invalid_${user.id}@placeholder.local`
      );
    } catch (error) {
      console.error(`❌ Failed to fix user ${user.id}:`, error);
    }
  }

  console.log(`\n✅ Fixed ${fixed} out of ${users.length} users\n`);
  return fixed;
}

async function fixInvalidRecipients(recipients: any[]) {
  if (recipients.length === 0) {
    console.log("✅ No invalid recipient emails to fix\n");
    return 0;
  }

  console.log("🔧 Fixing invalid recipient emails...\n");

  let fixed = 0;

  for (const recipient of recipients) {
    try {
      await prisma.recipient.update({
        where: { id: recipient.id },
        data: {
          email: `invalid_recipient_${recipient.id}@placeholder.local`,
        },
      });
      fixed++;
      console.log(
        `✅ Fixed recipient ${recipient.id}: ${recipient.email} → invalid_recipient_${recipient.id}@placeholder.local`
      );
    } catch (error) {
      console.error(`❌ Failed to fix recipient ${recipient.id}:`, error);
    }
  }

  console.log(`\n✅ Fixed ${fixed} out of ${recipients.length} recipients\n`);
  return fixed;
}

async function verifyFix() {
  console.log("==================================================");
  console.log("✅ Step 3: Verifying fix...");
  console.log("==================================================\n");

  // Check for remaining invalid users
  const remainingUsers = await prisma.user.count({
    where: {
      OR: [
        { email: null },
        { email: "" },
        { email: { not: { contains: "@" } } },
      ],
    },
  });

  // Check for remaining invalid recipients
  const remainingRecipients = await prisma.recipient.count({
    where: {
      OR: [
        { email: null },
        { email: "" },
        { email: { not: { contains: "@" } } },
      ],
    },
  });

  console.log("📊 Verification Results:");
  console.log(`   - Invalid users remaining: ${remainingUsers}`);
  console.log(`   - Invalid recipients remaining: ${remainingRecipients}`);
  console.log("");

  if (remainingUsers === 0 && remainingRecipients === 0) {
    console.log("✅ SUCCESS! All invalid emails have been fixed.\n");
    return true;
  } else {
    console.log("⚠️  WARNING: Some invalid emails still remain\n");
    return false;
  }
}

async function main() {
  try {
    console.log("🔗 Connecting to database...\n");

    // Test connection
    await prisma.$connect();
    console.log("✅ Connected to database\n");

    // Check for invalid emails
    const invalidUsers = await checkInvalidEmails();
    const invalidRecipients = await checkInvalidRecipients();

    if (invalidUsers.length === 0 && invalidRecipients.length === 0) {
      console.log("==================================================");
      console.log("✅ No invalid emails found! Database is clean.");
      console.log("==================================================\n");
      return;
    }

    console.log("==================================================");
    console.log("⚠️  Invalid emails found!");
    console.log("==================================================\n");
    console.log(`Total invalid users: ${invalidUsers.length}`);
    console.log(`Total invalid recipients: ${invalidRecipients.length}`);
    console.log("");

    // Ask for confirmation
    console.log("This will update invalid emails to placeholder format:");
    console.log("  - Users: invalid_{id}@placeholder.local");
    console.log("  - Recipients: invalid_recipient_{id}@placeholder.local");
    console.log("");

    // In production, you'd want to add a confirmation prompt here
    // For now, we'll proceed automatically
    console.log("Proceeding with fix...\n");

    // Fix invalid emails
    const fixedUsers = await fixInvalidUsers(invalidUsers);
    const fixedRecipients = await fixInvalidRecipients(invalidRecipients);

    // Verify fix
    const success = await verifyFix();

    console.log("==================================================");
    console.log("📊 Summary:");
    console.log("==================================================");
    console.log(`   - Invalid users found: ${invalidUsers.length}`);
    console.log(`   - Invalid users fixed: ${fixedUsers}`);
    console.log(`   - Invalid recipients found: ${invalidRecipients.length}`);
    console.log(`   - Invalid recipients fixed: ${fixedRecipients}`);
    console.log(`   - Status: ${success ? "✅ FIXED" : "⚠️  PARTIAL"}`);
    console.log("");

    console.log("==================================================");
    console.log("Next steps:");
    console.log("==================================================");
    console.log("1. Restart your application to clear any caches");
    console.log("2. Test email functionality");
    console.log("3. Monitor for any TRPC validation errors");
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
