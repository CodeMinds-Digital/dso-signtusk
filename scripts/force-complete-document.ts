#!/usr/bin/env tsx
import {
  DocumentStatus,
  SigningStatus,
} from "@signtusk/lib/constants/prisma-enums";
import { jobs } from "@signtusk/lib/jobs/client";
import { prisma } from "@signtusk/prisma";
import "dotenv/config";

async function forceCompleteDocument(token: string) {
  console.log("=== FORCE COMPLETING DOCUMENT ===\n");

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

  const documentId = parseInt(envelope.secondaryId.replace("document_", ""));

  console.log("📄 Envelope ID:", envelope.id);
  console.log("📄 Document ID:", documentId);
  console.log("📄 Title:", envelope.title);
  console.log("📄 Current Status:", envelope.status);
  console.log("");

  // Check if all recipients have signed
  const allSigned = envelope.recipients.every(
    (r) => r.signingStatus === SigningStatus.SIGNED || r.role === "CC"
  );

  console.log("👥 Recipients:");
  for (const r of envelope.recipients) {
    console.log(`  - ${r.email}: ${r.signingStatus} (${r.role})`);
  }
  console.log("");

  if (!allSigned) {
    console.error("❌ Not all recipients have signed yet!");
    console.log("\nCannot complete document until all recipients sign.");
    return;
  }

  console.log("✅ All recipients have signed\n");

  if (envelope.status === DocumentStatus.COMPLETED) {
    console.log("✅ Document is already COMPLETED");
    console.log("Nothing to do!");
    return;
  }

  console.log("🚀 Triggering seal-document job...\n");

  try {
    await jobs.triggerJob({
      name: "internal.seal-document",
      payload: {
        documentId: documentId,
      },
    });

    console.log("✅ seal-document job triggered successfully!\n");
    console.log("The job will:");
    console.log("1. Load the PDF");
    console.log("2. Insert signature fields");
    console.log("3. Sign the PDF with certificate");
    console.log("4. Update document status to COMPLETED");
    console.log("5. Send completion emails\n");

    console.log("Wait 10-30 seconds, then check:");
    console.log(`npx tsx scripts/check-completion-flow.ts ${token}\n`);

    console.log("Or view in browser:");
    console.log(`https://www.signtusk.com/sign/${token}/complete`);
  } catch (error: any) {
    console.error("\n❌ Failed to trigger job:");
    console.error(error.message);
    console.error("\nFull error:", error);
  }
}

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.error("Usage: npx tsx scripts/force-complete-document.ts <token>");
  console.error(
    "\nExample: npx tsx scripts/force-complete-document.ts St3TgPEP-AjfQZQoAYjWZ"
  );
  console.error("\nThis will:");
  console.error("1. Check if all recipients have signed");
  console.error("2. Trigger seal-document job");
  console.error("3. Complete the document");
  process.exit(1);
}

forceCompleteDocument(token)
  .then(() => {
    console.log("\n=== DONE ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFatal error:", error);
    process.exit(1);
  });
