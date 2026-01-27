#!/usr/bin/env tsx
/**
 * Diagnostic script to identify why resend document is failing
 * Run with: npx tsx scripts/diagnose-resend-issue.ts
 */

import { prisma } from "@signtusk/prisma";

async function diagnoseResendIssue() {
  console.log("🔍 Diagnosing Resend Document Issue...\n");

  // 1. Check environment variables
  console.log("1️⃣ Checking Environment Variables:");
  console.log(
    "   NEXT_PRIVATE_SMTP_TRANSPORT:",
    process.env.NEXT_PRIVATE_SMTP_TRANSPORT || "NOT SET"
  );
  console.log(
    "   NEXT_PRIVATE_RESEND_API_KEY:",
    process.env.NEXT_PRIVATE_RESEND_API_KEY ? "✅ SET" : "❌ NOT SET"
  );
  console.log(
    "   NEXT_PUBLIC_WEBAPP_URL:",
    process.env.NEXT_PUBLIC_WEBAPP_URL || "NOT SET"
  );
  console.log(
    "   NEXT_PRIVATE_SMTP_FROM_ADDRESS:",
    process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS || "NOT SET"
  );
  console.log(
    "   NEXT_PRIVATE_SMTP_FROM_NAME:",
    process.env.NEXT_PRIVATE_SMTP_FROM_NAME || "NOT SET"
  );
  console.log("");

  // 2. Check database connection
  console.log("2️⃣ Checking Database Connection:");
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("   ✅ Database connection successful");
  } catch (error) {
    console.log("   ❌ Database connection failed:", error);
    return;
  }
  console.log("");

  // 3. Check for pending documents
  console.log("3️⃣ Checking Pending Documents:");
  try {
    const pendingDocs = await prisma.envelope.findMany({
      where: {
        status: "PENDING",
        type: "DOCUMENT",
      },
      include: {
        recipients: {
          where: {
            signingStatus: "NOT_SIGNED",
          },
        },
      },
      take: 5,
    });

    console.log(`   Found ${pendingDocs.length} pending documents`);

    if (pendingDocs.length > 0) {
      console.log("\n   Sample document:");
      const doc = pendingDocs[0];
      console.log(`   - ID: ${doc.id}`);
      console.log(`   - Title: ${doc.title}`);
      console.log(`   - Recipients: ${doc.recipients.length}`);
      console.log(
        `   - Unsigned recipients: ${doc.recipients.filter((r) => r.signingStatus === "NOT_SIGNED").length}`
      );
    }
  } catch (error) {
    console.log("   ❌ Failed to query documents:", error);
  }
  console.log("");

  // 4. Check email audit logs
  console.log("4️⃣ Checking Recent Email Audit Logs:");
  try {
    const recentLogs = await prisma.documentAuditLog.findMany({
      where: {
        type: "EMAIL_SENT",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(`   Found ${recentLogs.length} recent email logs`);

    if (recentLogs.length > 0) {
      console.log("\n   Most recent email:");
      const log = recentLogs[0];
      console.log(`   - Created: ${log.createdAt}`);
      console.log(`   - Data:`, JSON.stringify(log.data, null, 2));
    }
  } catch (error) {
    console.log("   ❌ Failed to query audit logs:", error);
  }
  console.log("");

  // 5. Test email configuration
  console.log("5️⃣ Testing Email Configuration:");
  try {
    const { mailer } = await import("@signtusk/email/mailer");
    console.log("   ✅ Mailer module loaded successfully");

    // Try to get transport info (without actually sending)
    console.log(
      "   Transport type:",
      process.env.NEXT_PRIVATE_SMTP_TRANSPORT || "smtp-auth (default)"
    );

    if (process.env.NEXT_PRIVATE_SMTP_TRANSPORT === "resend") {
      if (!process.env.NEXT_PRIVATE_RESEND_API_KEY) {
        console.log(
          "   ❌ CRITICAL: Resend transport selected but API key is missing!"
        );
        console.log(
          "   💡 Solution: Set NEXT_PRIVATE_RESEND_API_KEY in your .env file"
        );
      } else {
        console.log("   ✅ Resend API key is configured");
      }
    }
  } catch (error) {
    console.log("   ❌ Failed to load mailer:", error);
  }
  console.log("");

  // 6. Check for common issues
  console.log("6️⃣ Common Issues Check:");
  const issues: string[] = [];

  if (
    !process.env.NEXT_PRIVATE_RESEND_API_KEY &&
    process.env.NEXT_PRIVATE_SMTP_TRANSPORT === "resend"
  ) {
    issues.push("Resend API key is missing");
  }

  if (!process.env.NEXT_PUBLIC_WEBAPP_URL) {
    issues.push("NEXT_PUBLIC_WEBAPP_URL is not set");
  }

  if (!process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS) {
    issues.push("NEXT_PRIVATE_SMTP_FROM_ADDRESS is not set");
  }

  if (issues.length > 0) {
    console.log("   ❌ Found issues:");
    issues.forEach((issue) => console.log(`      - ${issue}`));
  } else {
    console.log("   ✅ No common configuration issues found");
  }
  console.log("");

  console.log("✅ Diagnosis complete!\n");
}

diagnoseResendIssue()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
