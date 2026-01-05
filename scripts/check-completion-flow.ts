#!/usr/bin/env tsx
import {
  DocumentStatus,
  SigningStatus,
} from "@signtusk/lib/constants/prisma-enums";
import { prisma } from "@signtusk/prisma";
import "dotenv/config";

async function checkCompletionFlow(token: string) {
  console.log("=== CHECKING DOCUMENT COMPLETION FLOW ===\n");

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
          signedAt: true,
        },
      },
      envelopeItems: {
        include: {
          field: true,
        },
      },
    },
  });

  if (!envelope) {
    console.error("❌ Envelope not found for token:", token);
    return;
  }

  console.log("📄 Envelope ID:", envelope.id);
  console.log("📄 Secondary ID:", envelope.secondaryId);
  console.log("📄 Title:", envelope.title);
  console.log("📄 Status:", envelope.status);
  console.log("📄 Completed At:", envelope.completedAt || "Not completed");
  console.log("");

  // Check recipients
  console.log("👥 RECIPIENTS:");
  for (const recipient of envelope.recipients) {
    console.log(`  - ${recipient.email} (${recipient.role})`);
    console.log(`    Signing Status: ${recipient.signingStatus}`);
    console.log(`    Signed At: ${recipient.signedAt || "Not signed"}`);
  }
  console.log("");

  // Check if all recipients have signed
  const allSigned = envelope.recipients.every(
    (r) => r.signingStatus === SigningStatus.SIGNED || r.role === "CC"
  );
  console.log("✅ All recipients signed:", allSigned ? "YES" : "NO");
  console.log("");

  // Check for seal-document jobs
  console.log("🔍 CHECKING SEAL-DOCUMENT JOBS:");
  const legacyDocumentId = parseInt(
    envelope.secondaryId.replace("document_", "").replace("doc_", "")
  );

  const sealJobs = await prisma.backgroundJob.findMany({
    where: {
      name: "internal.seal-document",
      payload: {
        path: ["documentId"],
        equals: legacyDocumentId,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
  });

  if (sealJobs.length === 0) {
    console.log("❌ No seal-document jobs found!");
    console.log(
      "   This means complete-document-with-token did not trigger the job."
    );
  } else {
    console.log(`Found ${sealJobs.length} seal-document job(s):\n`);
    for (const job of sealJobs) {
      console.log(`  Job ID: ${job.id}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Updated: ${job.updatedAt}`);
      console.log(`  Completed: ${job.completedAt || "Not completed"}`);
      console.log(`  Retried: ${job.retried} times`);
      console.log("");
    }
  }

  // Check document audit logs
  console.log("📋 RECENT AUDIT LOGS:");
  const auditLogs = await prisma.documentAuditLog.findMany({
    where: {
      envelopeId: envelope.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  for (const log of auditLogs) {
    console.log(`  - ${log.type} at ${log.createdAt}`);
  }
  console.log("");

  // Diagnosis
  console.log("=== DIAGNOSIS ===");
  if (envelope.status === DocumentStatus.COMPLETED) {
    console.log("✅ Document is COMPLETED - everything worked!");
  } else if (envelope.status === DocumentStatus.PENDING && allSigned) {
    console.log("⚠️  Document is PENDING but all recipients have signed");
    if (sealJobs.length === 0) {
      console.log("❌ ISSUE: seal-document job was never created");
      console.log("   Check complete-document-with-token logic");
    } else {
      const latestJob = sealJobs[0];
      if (latestJob.status === "FAILED") {
        console.log("❌ ISSUE: seal-document job FAILED");
        console.log("   Error:", latestJob.lastErrorMessage);
      } else if (latestJob.status === "PENDING") {
        console.log("⏳ seal-document job is PENDING (waiting to run)");
      } else if (latestJob.status === "RUNNING") {
        console.log("⏳ seal-document job is RUNNING");
      }
    }
  } else {
    console.log("ℹ️  Document is still pending signatures");
  }
}

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.error("Usage: npx tsx scripts/check-completion-flow.ts <token>");
  console.error(
    "\nExample: npx tsx scripts/check-completion-flow.ts St3TgPEP-AjfQZQoAYjWZ"
  );
  process.exit(1);
}

checkCompletionFlow(token)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
