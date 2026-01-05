#!/usr/bin/env tsx
import { completeDocumentWithToken } from "@signtusk/lib/server-only/document/complete-document-with-token";
import { mapSecondaryIdToDocumentId } from "@signtusk/lib/utils/envelope";
import { prisma } from "@signtusk/prisma";
import "dotenv/config";

async function manuallyCompleteDocument(token: string) {
  console.log("=== MANUALLY COMPLETING DOCUMENT ===\n");

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
        where: {
          token,
        },
      },
    },
  });

  if (!envelope) {
    console.error("❌ Envelope not found for token:", token);
    return;
  }

  if (envelope.recipients.length === 0) {
    console.error("❌ Recipient not found for token:", token);
    return;
  }

  const recipient = envelope.recipients[0];
  const documentId = mapSecondaryIdToDocumentId(envelope.secondaryId);

  console.log("📄 Envelope ID:", envelope.id);
  console.log("📄 Document ID:", documentId);
  console.log("📄 Title:", envelope.title);
  console.log("📄 Recipient:", recipient.email);
  console.log("📄 Current Status:", envelope.status);
  console.log("");

  console.log("🚀 Calling completeDocumentWithToken...\n");

  try {
    await completeDocumentWithToken({
      token,
      id: {
        type: "documentId",
        id: documentId,
      },
      userId: undefined,
    });

    console.log("✅ Document completion triggered successfully!\n");
    console.log("What happened:");
    console.log("1. Recipient marked as SIGNED (if not already)");
    console.log("2. Checked if all recipients have signed");
    console.log("3. If yes, triggered seal-document job");
    console.log("4. Job will run and complete the document\n");

    console.log("Wait a few seconds, then check:");
    console.log("1. Document status should change to COMPLETED");
    console.log("2. PDF should be signed and downloadable");
    console.log("3. Complete page should show 'Everyone has signed'\n");

    console.log("To verify:");
    console.log(`npx tsx scripts/check-completion-flow.ts ${token}`);
  } catch (error: any) {
    console.error("\n❌ Failed to complete document:");
    console.error(error.message);
    console.error("\nFull error:", error);

    if (error.message.includes("has already signed")) {
      console.log("\n⚠️  Recipient already signed.");
      console.log("This is expected if you already clicked Complete before.");
      console.log("The seal-document job should have been triggered.");
      console.log("\nCheck if the job exists:");
      console.log(`npx tsx scripts/check-completion-flow.ts ${token}`);
    }
  }
}

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.error("Usage: npx tsx scripts/manually-complete-document.ts <token>");
  console.error(
    "\nExample: npx tsx scripts/manually-complete-document.ts St3TgPEP-AjfQZQoAYjWZ"
  );
  console.error("\nThis will:");
  console.error("1. Call completeDocumentWithToken() function");
  console.error("2. Mark recipient as SIGNED");
  console.error("3. Trigger seal-document job if all recipients signed");
  console.error("4. Complete the document");
  process.exit(1);
}

manuallyCompleteDocument(token)
  .then(() => {
    console.log("\n=== DONE ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFatal error:", error);
    process.exit(1);
  });
