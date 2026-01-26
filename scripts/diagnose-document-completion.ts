#!/usr/bin/env tsx

/**
 * Diagnostic script to check why documents are stuck in Processing state
 *
 * Usage:
 *   npm run with:env -- tsx scripts/diagnose-document-completion.ts <document-id>
 *
 * Example:
 *   npm run with:env -- tsx scripts/diagnose-document-completion.ts abc123
 */

import { DocumentStatus, RecipientRole, SigningStatus } from "@prisma/client";
import { prisma } from "@signtusk/prisma";
import { mapSecondaryIdToDocumentId } from "../packages/lib/utils/envelope";

async function diagnoseDocument(documentId: string) {
  console.log("🔍 Diagnosing Document Completion Issue\n");
  console.log(`Document ID: ${documentId}\n`);

  // Fetch document
  const envelope = await prisma.envelope.findFirst({
    where: {
      OR: [
        { id: documentId },
        { secondaryId: documentId },
        { secondaryId: mapSecondaryIdToDocumentId(documentId) },
      ],
    },
    include: {
      recipients: true,
      envelopeItems: {
        include: {
          field: {
            include: {
              signature: true,
            },
          },
        },
      },
    },
  });

  if (!envelope) {
    console.error("❌ Document not found");
    process.exit(1);
  }

  console.log("📄 Document Information:");
  console.log(`   ID: ${envelope.id}`);
  console.log(`   Secondary ID: ${envelope.secondaryId}`);
  console.log(`   Status: ${envelope.status}`);
  console.log(`   Created: ${envelope.createdAt}`);
  console.log(`   Updated: ${envelope.updatedAt}`);
  console.log(`   Completed: ${envelope.completedAt || "Not completed"}\n`);

  // Check recipients
  console.log("👥 Recipients:");
  const recipients = envelope.recipients.filter(
    (r) => r.role !== RecipientRole.CC
  );
  const ccRecipients = envelope.recipients.filter(
    (r) => r.role === RecipientRole.CC
  );

  recipients.forEach((recipient, index) => {
    console.log(`   ${index + 1}. ${recipient.name} <${recipient.email}>`);
    console.log(`      Role: ${recipient.role}`);
    console.log(`      Status: ${recipient.signingStatus}`);
    console.log(`      Signed At: ${recipient.signedAt || "Not signed"}`);
  });

  if (ccRecipients.length > 0) {
    console.log(`\n   CC Recipients: ${ccRecipients.length}`);
  }

  // Check if all signed
  const allSigned = recipients.every(
    (r) => r.signingStatus === SigningStatus.SIGNED
  );
  const anySigned = recipients.some(
    (r) => r.signingStatus === SigningStatus.SIGNED
  );
  const anyRejected = recipients.some(
    (r) => r.signingStatus === SigningStatus.REJECTED
  );

  console.log("\n📊 Signing Status:");
  console.log(`   All Signed: ${allSigned ? "✅ YES" : "❌ NO"}`);
  console.log(`   Any Signed: ${anySigned ? "✅ YES" : "❌ NO"}`);
  console.log(`   Any Rejected: ${anyRejected ? "✅ YES" : "❌ NO"}\n`);

  // Check fields
  const allFields = envelope.envelopeItems.flatMap((item) => item.field);
  const requiredFields = allFields.filter((f) => f.customText === "required");
  const signedFields = allFields.filter((f) => f.signature !== null);

  console.log("📝 Fields:");
  console.log(`   Total Fields: ${allFields.length}`);
  console.log(`   Required Fields: ${requiredFields.length}`);
  console.log(`   Signed Fields: ${signedFields.length}\n`);

  // Check background jobs
  const jobs = await prisma.backgroundJob.findMany({
    where: {
      jobId: "internal.seal-document",
      payload: {
        path: ["documentId"],
        equals: mapSecondaryIdToDocumentId(envelope.secondaryId),
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 5,
  });

  console.log("⚙️  Background Jobs (seal-document):");
  if (jobs.length === 0) {
    console.log("   ❌ No seal-document jobs found");
    console.log("   This means the job was never triggered!\n");
  } else {
    jobs.forEach((job, index) => {
      console.log(`   ${index + 1}. Job ID: ${job.id}`);
      console.log(`      Status: ${job.status}`);
      console.log(`      Submitted: ${job.submittedAt}`);
      console.log(`      Completed: ${job.completedAt || "Not completed"}`);
      console.log(`      Retries: ${job.retried}/${job.maxRetries}`);
    });
    console.log("");
  }

  // Diagnosis
  console.log("🔬 DIAGNOSIS:\n");

  if (envelope.status === DocumentStatus.COMPLETED) {
    console.log("✅ Document is COMPLETED - No issues!");
    return;
  }

  if (anyRejected) {
    console.log("⚠️  Document was REJECTED by a recipient");
    if (envelope.status !== DocumentStatus.REJECTED) {
      console.log("   ❌ But status is not REJECTED - this is wrong!");
      console.log("   → Run seal-document job to update status");
    }
    return;
  }

  if (!allSigned) {
    console.log("⏳ Not all recipients have signed yet");
    console.log("   This is normal - waiting for signatures");
    return;
  }

  // All signed but not completed
  console.log(
    "🚨 ISSUE DETECTED: All recipients signed but document not completed!\n"
  );

  if (jobs.length === 0) {
    console.log("❌ Problem: seal-document job was never triggered");
    console.log("\n💡 Possible Causes:");
    console.log("   1. Job system not configured properly");
    console.log("   2. Error in complete-document-with-token logic");
    console.log("   3. Database transaction failed");
    console.log("\n🔧 Solution:");
    console.log(
      "   Run: npm run with:env -- tsx scripts/manually-complete-document.ts",
      envelope.secondaryId
    );
  } else {
    const latestJob = jobs[0];

    if (latestJob.status === "PENDING") {
      console.log("⏳ Problem: Job is queued but not processing");
      console.log("\n💡 Possible Causes:");
      console.log("   1. Job worker not running");
      console.log("   2. Job queue backed up");
      console.log("   3. Job system misconfigured");
      console.log("\n🔧 Solution:");
      console.log("   1. Check if job worker is running");
      console.log("   2. Restart application");
      console.log("   3. Check job system logs");
    } else if (latestJob.status === "PROCESSING") {
      const processingTime = Date.now() - latestJob.submittedAt.getTime();
      const minutes = Math.floor(processingTime / 60000);

      console.log(`⏳ Problem: Job has been processing for ${minutes} minutes`);
      console.log("\n💡 Possible Causes:");
      console.log("   1. Job timeout (PDF processing taking too long)");
      console.log("   2. Job worker crashed");
      console.log("   3. Memory issues");
      console.log("\n🔧 Solution:");
      console.log("   1. Check application logs for errors");
      console.log("   2. Restart application");
      console.log("   3. Trigger job manually");
    } else if (latestJob.status === "FAILED") {
      console.log("❌ Problem: Job failed");
      console.log("\n💡 Check application logs for error details");
      console.log("\n🔧 Solution:");
      console.log("   1. Fix the underlying error");
      console.log(
        "   2. Run: npm run with:env -- tsx scripts/manually-complete-document.ts",
        envelope.secondaryId
      );
    } else if (latestJob.status === "COMPLETED") {
      console.log("✅ Job completed successfully");
      console.log("❌ But document status is still", envelope.status);
      console.log("\n💡 This is a database inconsistency!");
      console.log("\n🔧 Solution:");
      console.log(
        "   Run: npm run with:env -- tsx scripts/force-complete-document.ts",
        envelope.secondaryId
      );
    }
  }
}

// Main
const documentId = process.argv[2];

if (!documentId) {
  console.error(
    "Usage: npm run with:env -- tsx scripts/diagnose-document-completion.ts <document-id>"
  );
  process.exit(1);
}

diagnoseDocument(documentId)
  .then(() => {
    console.log("\n✅ Diagnosis complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
