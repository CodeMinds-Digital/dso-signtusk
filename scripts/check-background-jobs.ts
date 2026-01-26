#!/usr/bin/env tsx
/**
 * Check Background Jobs Status
 *
 * This script checks the status of seal-document background jobs
 * to identify why documents are stuck in Processing state.
 */

import { prisma } from "@signtusk/prisma";

async function checkBackgroundJobs() {
  console.log("🔍 Checking Background Jobs Status...\n");

  try {
    // Get all seal-document jobs
    const sealDocumentJobs = await prisma.backgroundJob.findMany({
      where: {
        jobId: "internal.seal-document",
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 20,
      include: {
        tasks: true,
      },
    });

    console.log(`📊 Found ${sealDocumentJobs.length} seal-document jobs\n`);

    // Group by status
    const jobsByStatus = sealDocumentJobs.reduce(
      (acc, job) => {
        const status = job.status;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(job);
        return acc;
      },
      {} as Record<string, typeof sealDocumentJobs>
    );

    // Print summary
    console.log("📈 Jobs by Status:");
    Object.entries(jobsByStatus).forEach(([status, jobs]) => {
      console.log(`  ${status}: ${jobs.length}`);
    });
    console.log("");

    // Show failed jobs
    const failedJobs = jobsByStatus["FAILED"] || [];
    if (failedJobs.length > 0) {
      console.log("❌ Failed Jobs:");
      failedJobs.forEach((job) => {
        console.log(`\n  Job ID: ${job.id}`);
        console.log(`  Submitted: ${job.submittedAt}`);
        console.log(`  Completed: ${job.completedAt}`);
        console.log(`  Retried: ${job.retried}/${job.maxRetries}`);
        console.log(`  Payload:`, JSON.stringify(job.payload, null, 2));

        if (job.tasks.length > 0) {
          console.log(`  Tasks:`);
          job.tasks.forEach((task) => {
            console.log(
              `    - ${task.name}: ${task.status} (retried: ${task.retried})`
            );
          });
        }
      });
      console.log("");
    }

    // Show pending jobs
    const pendingJobs = jobsByStatus["PENDING"] || [];
    if (pendingJobs.length > 0) {
      console.log("⏳ Pending Jobs:");
      pendingJobs.forEach((job) => {
        console.log(`\n  Job ID: ${job.id}`);
        console.log(`  Submitted: ${job.submittedAt}`);
        console.log(`  Retried: ${job.retried}/${job.maxRetries}`);
        console.log(`  Payload:`, JSON.stringify(job.payload, null, 2));

        if (job.tasks.length > 0) {
          console.log(`  Tasks:`);
          job.tasks.forEach((task) => {
            console.log(
              `    - ${task.name}: ${task.status} (retried: ${task.retried})`
            );
          });
        }
      });
      console.log("");
    }

    // Show completed jobs
    const completedJobs = jobsByStatus["COMPLETED"] || [];
    if (completedJobs.length > 0) {
      console.log(`✅ Completed Jobs: ${completedJobs.length}`);
      console.log("  (Most recent 3):");
      completedJobs.slice(0, 3).forEach((job) => {
        const payload = job.payload as { documentId?: string };
        console.log(
          `  - Document: ${payload.documentId}, Completed: ${job.completedAt}`
        );
      });
      console.log("");
    }

    // Check for documents stuck in PENDING status
    console.log("📄 Checking Documents...\n");

    const pendingDocuments = await prisma.envelope.findMany({
      where: {
        type: "DOCUMENT",
        status: "PENDING",
      },
      include: {
        recipients: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    console.log(
      `Found ${pendingDocuments.length} documents in PENDING status\n`
    );

    for (const doc of pendingDocuments) {
      const allSigned = doc.recipients.every(
        (r) => r.signingStatus === "SIGNED" || r.role === "CC"
      );

      if (allSigned) {
        console.log(`⚠️  Document ${doc.secondaryId} is STUCK:`);
        console.log(`   All recipients signed: YES`);
        console.log(`   Status: ${doc.status} (should be COMPLETED)`);
        console.log(`   Created: ${doc.createdAt}`);
        console.log(`   Updated: ${doc.updatedAt}`);

        // Check if there's a job for this document
        const documentId = doc.secondaryId.replace("envelope_", "document_");
        const relatedJobs = await prisma.backgroundJob.findMany({
          where: {
            jobId: "internal.seal-document",
            payload: {
              path: ["documentId"],
              equals: documentId,
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: 1,
        });

        if (relatedJobs.length > 0) {
          const job = relatedJobs[0];
          console.log(`   Related Job: ${job.id} (${job.status})`);
          if (job.status === "FAILED") {
            console.log(`   ❌ Job FAILED - this is why document is stuck!`);
          } else if (job.status === "PENDING") {
            console.log(`   ⏳ Job still PENDING - may be stuck`);
          }
        } else {
          console.log(
            `   ❌ NO seal-document job found - job was never triggered!`
          );
        }
        console.log("");
      }
    }

    // Recommendations
    console.log("\n💡 Recommendations:\n");

    if (failedJobs.length > 0) {
      console.log("1. ❌ You have FAILED seal-document jobs");
      console.log("   This is likely causing documents to be stuck");
      console.log("   Check application logs for error details");
      console.log("   Common causes:");
      console.log("   - Module import errors (@signtusk/pdf-processing)");
      console.log("   - PDF processing errors");
      console.log("   - Database connection issues");
      console.log("");
    }

    if (pendingJobs.length > 0) {
      console.log("2. ⏳ You have PENDING seal-document jobs");
      console.log("   These jobs may be stuck or taking too long");
      console.log("   Check if background job processor is running");
      console.log("");
    }

    const stuckDocs = pendingDocuments.filter((doc) =>
      doc.recipients.every(
        (r) => r.signingStatus === "SIGNED" || r.role === "CC"
      )
    );

    if (stuckDocs.length > 0) {
      console.log(
        `3. ⚠️  You have ${stuckDocs.length} documents stuck in PENDING`
      );
      console.log("   All recipients have signed but status not updated");
      console.log(
        "   Run: npm run with:env -- tsx scripts/fix-stuck-documents.ts"
      );
      console.log("");
    }
  } catch (error) {
    console.error("❌ Error checking background jobs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkBackgroundJobs()
  .then(() => {
    console.log("✅ Check complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
