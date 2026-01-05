#!/usr/bin/env tsx
import "dotenv/config";
import { prisma } from "@signtusk/prisma";
import { jobs } from "@signtusk/lib/jobs/client";
import {
  DocumentStatus,
  SigningStatus,
} from "@signtusk/lib/constants/prisma-enums";

async function testSealDocument(token: string) {
  console.log("=== TESTING SEAL-DOCUMENT JOB ===\n");

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
      recipients: true,
    },
  });

  if (!envelope) {
    console.error("❌ Envelope not found for token:", token);
    return;
  }

  const legacyDocumentId = parseInt(envelope.secondaryId.replace("doc_", ""));

  console.log("📄 Envelope ID:", envelope.id);
  console.log("📄 Document ID:", legacyDocumentId);
  console.log("📄 Title:", envelope.title);
  console.log("📄 Current Status:", envelope.status);
  console.log("");

  // Check if all recipients have signed
  const allSigned = envelope.recipients.every(
    (r) => r.signingStatus === SigningStatus.SIGNED || r.role === "CC"
  );

  console.log("✅ All recipients signed:", allSigned ? "YES" : "NO");

  if (!allSigned) {
    console.log("\n⚠️  Cannot test seal-document - not all recipients signed");
    console.log("\nRecipients status:");
    for (const r of envelope.recipients) {
      console.log(`  - ${r.email}: ${r.signingStatus}`);
    }
    return;
  }

  if (envelope.status === DocumentStatus.COMPLETED) {
    console.log("\n✅ Document already COMPLETED");
    console.log("   No need to run seal-document again");
    return;
  }

  console.log("\n🚀 Triggering seal-document job...");

  try {
    await jobs.triggerJob({
      name: "internal.seal-document",
      payload: {
        documentId: legacyDocumentId,
      },
    });

    console.log("✅ Job triggered successfully!");
    console.log("\nWait a few seconds, then check:");
    console.log("1. Document status should change to COMPLETED");
    console.log("2. PDF should be signed and downloadable");
    console.log("3. Complete page should show 'Everyone has signed'");
    console.log("\nTo check status:");
    console.log(`npx tsx scripts/check-completion-flow.ts ${token}`);
  } catch (error: any) {
    console.error("\n❌ Failed to trigger job:");
    console.error(error.message);
    console.error("\nThis likely means:");
    console.error("1. Job queue is not running");
    console.error("2. Job definition is not registered");
    console.error("3. Database connection issue");
  }
}

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.error("Usage: npx tsx scripts/test-seal-document.ts <token>");
  console.error(
    "\nExample: npx tsx scripts/test-seal-document.ts St3TgPEP-AjfQZQoAYjWZ"
  );
  process.exit(1);
}

testSealDocument(token)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
