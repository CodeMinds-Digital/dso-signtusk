import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

import {
  DocumentStatus,
  SigningStatus,
} from "@signtusk/lib/constants/prisma-enums";
import { prisma } from "@signtusk/prisma";

/**
 * Debug script to investigate signing completion issues
 *
 * Run with: npx tsx scripts/debug-signing-issue.ts <envelopeId>
 */

async function debugSigningIssue(envelopeId?: string) {
  try {
    // If no envelope ID provided, find recent pending envelopes
    if (!envelopeId) {
      console.log(
        "No envelope ID provided, finding recent PENDING envelopes...\n"
      );

      const pendingEnvelopes = await prisma.envelope.findMany({
        where: {
          status: DocumentStatus.PENDING,
        },
        include: {
          recipients: true,
          envelopeItems: {
            include: {
              documentData: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      });

      console.log(`Found ${pendingEnvelopes.length} pending envelopes:\n`);

      for (const env of pendingEnvelopes) {
        const allSigned = env.recipients.every(
          (r) => r.signingStatus === SigningStatus.SIGNED || r.role === "CC"
        );

        console.log(`Envelope ID: ${env.id}`);
        console.log(`  Title: ${env.title}`);
        console.log(`  Status: ${env.status}`);
        console.log(`  Recipients: ${env.recipients.length}`);
        console.log(`  All Signed: ${allSigned ? "YES ⚠️" : "NO"}`);
        console.log(`  Updated: ${env.updatedAt}`);
        console.log("");
      }

      return;
    }

    // Debug specific envelope
    console.log(`Debugging envelope: ${envelopeId}\n`);

    const envelope = await prisma.envelope.findUnique({
      where: { id: envelopeId },
      include: {
        recipients: true,
        envelopeItems: {
          include: {
            documentData: true,
            field: true,
          },
        },
      },
    });

    if (!envelope) {
      console.error("Envelope not found!");
      return;
    }

    console.log("=== ENVELOPE INFO ===");
    console.log(`ID: ${envelope.id}`);
    console.log(`Title: ${envelope.title}`);
    console.log(`Status: ${envelope.status}`);
    console.log(`Completed At: ${envelope.completedAt || "Not completed"}`);
    console.log("");

    console.log("=== RECIPIENTS ===");
    for (const recipient of envelope.recipients) {
      console.log(`Recipient ${recipient.id}:`);
      console.log(`  Name: ${recipient.name}`);
      console.log(`  Email: ${recipient.email}`);
      console.log(`  Role: ${recipient.role}`);
      console.log(`  Signing Status: ${recipient.signingStatus}`);
      console.log(`  Signed At: ${recipient.signedAt || "Not signed"}`);
      console.log("");
    }

    const allSigned = envelope.recipients.every(
      (r) => r.signingStatus === SigningStatus.SIGNED || r.role === "CC"
    );
    console.log(`All recipients signed: ${allSigned ? "YES" : "NO"}`);
    console.log("");

    console.log("=== ENVELOPE ITEMS ===");
    for (const item of envelope.envelopeItems) {
      console.log(`Item ${item.id}:`);
      console.log(`  Title: ${item.title}`);
      console.log(`  Document Data ID: ${item.documentData.id}`);
      console.log(`  Document Data Type: ${item.documentData.type}`);
      console.log(`  Data Length: ${item.documentData.data.length} chars`);
      console.log(
        `  Initial Data Length: ${item.documentData.initialData.length} chars`
      );
      console.log(
        `  Data == Initial Data: ${item.documentData.data === item.documentData.initialData}`
      );
      console.log(`  Fields: ${item.field.length}`);
      console.log("");
    }

    // Check for background jobs
    console.log("=== BACKGROUND JOBS ===");
    const jobs = await prisma.backgroundJob.findMany({
      where: {
        name: "internal.seal-document",
        payload: {
          path: ["documentId"],
          equals: envelope.secondaryId.replace("doc_", ""),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    if (jobs.length === 0) {
      console.log("⚠️  No seal-document jobs found for this envelope!");
    } else {
      for (const job of jobs) {
        console.log(`Job ${job.id}:`);
        console.log(`  Status: ${job.status}`);
        console.log(`  Created: ${job.createdAt}`);
        console.log(`  Completed: ${job.completedAt || "Not completed"}`);
        console.log(`  Retried: ${job.retried} times`);
        console.log("");
      }
    }

    // Check for job tasks
    if (jobs.length > 0) {
      const latestJob = jobs[0];
      const tasks = await prisma.backgroundJobTask.findMany({
        where: {
          jobId: latestJob.id,
        },
      });

      if (tasks.length > 0) {
        console.log("=== JOB TASKS ===");
        for (const task of tasks) {
          console.log(`Task ${task.id}:`);
          console.log(`  Name: ${task.name}`);
          console.log(`  Status: ${task.status}`);
          console.log(`  Retried: ${task.retried} times`);
          console.log(`  Completed: ${task.completedAt || "Not completed"}`);
          console.log("");
        }
      }
    }

    // Recommendations
    console.log("=== RECOMMENDATIONS ===");
    if (envelope.status === DocumentStatus.PENDING && allSigned) {
      console.log(
        "⚠️  ISSUE DETECTED: All recipients have signed but status is still PENDING"
      );
      console.log("");
      console.log("Possible causes:");
      console.log("1. seal-document job never triggered");
      console.log("2. seal-document job failed during execution");
      console.log(
        "3. seal-document job is stuck in PENDING or PROCESSING state"
      );
      console.log("");

      if (jobs.length === 0) {
        console.log(
          "Action: seal-document job was never created. Check complete-document-with-token logic."
        );
      } else if (
        jobs[0].status === "PENDING" ||
        jobs[0].status === "PROCESSING"
      ) {
        console.log("Action: Job is stuck. Check server logs for errors.");
      } else if (jobs[0].status === "FAILED") {
        console.log("Action: Job failed. Check server logs for error details.");
      }
    }

    if (
      envelope.envelopeItems.some(
        (item) => item.documentData.data === item.documentData.initialData
      )
    ) {
      console.log(
        "⚠️  ISSUE DETECTED: Document data has not been updated with signed version"
      );
      console.log(
        "This means the seal-document job did not complete successfully."
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get envelope ID from command line args
const envelopeId = process.argv[2];
debugSigningIssue(envelopeId);
