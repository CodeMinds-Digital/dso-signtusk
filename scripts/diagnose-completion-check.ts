#!/usr/bin/env tsx
import {
  RecipientRole,
  SigningStatus,
} from "@signtusk/lib/constants/prisma-enums";
import { prisma } from "@signtusk/prisma";
import "dotenv/config";

async function diagnoseCompletionCheck(token: string) {
  console.log("=== DIAGNOSING COMPLETION CHECK ===\n");

  // Find envelope by recipient token
  const envelope = await prisma.envelope.findFirst({
    where: {
      recipients: {
        some: {
          token,
        },
      },
    },
    include: {
      recipients: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          signingStatus: true,
        },
      },
    },
  });

  if (!envelope) {
    console.error("❌ Envelope not found for token:", token);
    return;
  }

  console.log("📄 Envelope ID:", envelope.id);
  console.log("📄 Title:", envelope.title);
  console.log("");

  // Show all recipients
  console.log("👥 RECIPIENTS:");
  for (const recipient of envelope.recipients) {
    console.log(`  - ${recipient.email} (${recipient.role})`);
    console.log(`    Signing Status: ${recipient.signingStatus}`);
  }
  console.log("");

  // Manual check
  const allSignedManual = envelope.recipients.every(
    (r) =>
      r.signingStatus === SigningStatus.SIGNED || r.role === RecipientRole.CC
  );
  console.log("✅ Manual check - All signed:", allSignedManual ? "YES" : "NO");
  console.log("");

  // Database query check (same as in complete-document-with-token)
  console.log("🔍 TESTING DATABASE QUERY:");
  console.log("Running the exact query from complete-document-with-token...\n");

  const haveAllRecipientsSigned = await prisma.envelope.findFirst({
    where: {
      id: envelope.id,
      recipients: {
        every: {
          OR: [
            { signingStatus: SigningStatus.SIGNED },
            { role: RecipientRole.CC },
          ],
        },
      },
    },
  });

  console.log("Query result:", haveAllRecipientsSigned ? "FOUND" : "NULL");
  console.log("");

  if (!haveAllRecipientsSigned) {
    console.log(
      "❌ ISSUE FOUND: Query returns NULL even though all recipients signed!"
    );
    console.log("");
    console.log("This means the query condition is not matching.");
    console.log("Let me check each recipient individually...\n");

    for (const recipient of envelope.recipients) {
      const isSigned = recipient.signingStatus === SigningStatus.SIGNED;
      const isCC = recipient.role === RecipientRole.CC;
      const shouldMatch = isSigned || isCC;

      console.log(`Recipient: ${recipient.email}`);
      console.log(`  - signingStatus: ${recipient.signingStatus}`);
      console.log(`  - role: ${recipient.role}`);
      console.log(`  - Is SIGNED: ${isSigned}`);
      console.log(`  - Is CC: ${isCC}`);
      console.log(`  - Should match: ${shouldMatch ? "YES ✅" : "NO ❌"}`);
      console.log("");
    }

    // Try alternative query
    console.log("🔍 TRYING ALTERNATIVE QUERY:");
    const alternativeCheck = await prisma.envelope.findFirst({
      where: {
        id: envelope.id,
      },
      include: {
        recipients: true,
      },
    });

    if (alternativeCheck) {
      const allSigned = alternativeCheck.recipients.every(
        (r) =>
          r.signingStatus === SigningStatus.SIGNED ||
          r.role === RecipientRole.CC
      );
      console.log(
        "Alternative check result:",
        allSigned ? "ALL SIGNED ✅" : "NOT ALL SIGNED ❌"
      );
    }
  } else {
    console.log("✅ Query works correctly!");
    console.log("The seal-document job should have been triggered.");
    console.log("");
    console.log("If the job wasn't triggered, check:");
    console.log("1. Is the jobs.triggerJob() function working?");
    console.log("2. Are there any errors in the logs?");
    console.log("3. Is the job worker running?");
  }

  console.log("");
  console.log("=== DIAGNOSIS COMPLETE ===");
}

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.error("Usage: npx tsx scripts/diagnose-completion-check.ts <token>");
  console.error(
    "\nExample: npx tsx scripts/diagnose-completion-check.ts St3TgPEP-AjfQZQoAYjWZ"
  );
  process.exit(1);
}

diagnoseCompletionCheck(token)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
