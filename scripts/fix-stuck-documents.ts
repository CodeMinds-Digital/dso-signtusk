import {
  DocumentStatus,
  SigningStatus,
} from "@signtusk/lib/constants/prisma-enums";
import { jobs } from "@signtusk/lib/jobs/client";
import { mapSecondaryIdToDocumentId } from "@signtusk/lib/utils/envelope";
import { prisma } from "@signtusk/prisma";

/**
 * Fix script for documents stuck in PENDING status after all recipients have signed
 *
 * This script:
 * 1. Finds envelopes where all recipients have signed but status is still PENDING
 * 2. Manually triggers the seal-document job for each
 *
 * Run with: npx tsx scripts/fix-stuck-documents.ts [--dry-run]
 */

async function fixStuckDocuments(dryRun: boolean = false) {
  try {
    console.log("Searching for stuck documents...\n");

    // Find envelopes where all recipients have signed but status is still PENDING
    const stuckEnvelopes = await prisma.envelope.findMany({
      where: {
        status: DocumentStatus.PENDING,
      },
      include: {
        recipients: true,
      },
    });

    console.log(`Found ${stuckEnvelopes.length} PENDING envelopes\n`);

    const toFix: typeof stuckEnvelopes = [];

    for (const envelope of stuckEnvelopes) {
      const allSigned = envelope.recipients.every(
        (r) => r.signingStatus === SigningStatus.SIGNED || r.role === "CC"
      );

      if (allSigned) {
        toFix.push(envelope);
        console.log(`✓ Envelope ${envelope.id} (${envelope.title})`);
        console.log(
          `  All ${envelope.recipients.length} recipients have signed`
        );
        console.log(`  Status: ${envelope.status} (should be COMPLETED)`);
        console.log("");
      }
    }

    if (toFix.length === 0) {
      console.log("No stuck documents found!");
      return;
    }

    console.log(`\nFound ${toFix.length} stuck document(s)\n`);

    if (dryRun) {
      console.log("DRY RUN MODE - No changes will be made");
      console.log("Run without --dry-run to fix these documents");
      return;
    }

    console.log("Triggering seal-document jobs...\n");

    for (const envelope of toFix) {
      try {
        const legacyDocumentId = mapSecondaryIdToDocumentId(
          envelope.secondaryId
        );

        console.log(`Processing envelope ${envelope.id}...`);

        await jobs.triggerJob({
          name: "internal.seal-document",
          payload: {
            documentId: legacyDocumentId,
            sendEmail: true,
            requestMetadata: {
              ipAddress: "127.0.0.1",
              userAgent: "fix-stuck-documents-script",
            },
          },
        });

        console.log(`✓ Job triggered for envelope ${envelope.id}`);
        console.log("");
      } catch (error) {
        console.error(
          `✗ Failed to trigger job for envelope ${envelope.id}:`,
          error
        );
        console.log("");
      }
    }

    console.log("\nDone! Check the background jobs table to monitor progress.");
    console.log("You can also check server logs for [SEAL-DOCUMENT] entries.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check for --dry-run flag
const dryRun = process.argv.includes("--dry-run");

if (dryRun) {
  console.log("=== DRY RUN MODE ===\n");
}

fixStuckDocuments(dryRun);
