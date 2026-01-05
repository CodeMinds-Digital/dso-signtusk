import {
  BackgroundJobStatus,
  DocumentStatus,
  EnvelopeType,
  RecipientRole,
  SigningStatus,
} from "@prisma/client";
import { jobs } from "@signtusk/lib/jobs/client";
import { mapSecondaryIdToDocumentId } from "@signtusk/lib/utils/envelope";
import { prisma } from "@signtusk/prisma";
import type { Context } from "hono";

/**
 * Vercel Cron Job: Process Pending Documents
 *
 * Runs every minute to find documents where:
 * 1. All recipients have signed
 * 2. Document status is still PENDING
 * 3. No seal-document job is running
 *
 * This handles cases where seal-document job timed out or failed to trigger.
 */
export const processPendingDocuments = async (c: Context) => {
  console.log("[CRON] Starting process-pending-documents job");

  try {
    // Find documents where all recipients signed but document still pending
    const stuckDocuments = await prisma.envelope.findMany({
      where: {
        type: EnvelopeType.DOCUMENT,
        status: DocumentStatus.PENDING,
        recipients: {
          every: {
            OR: [
              { signingStatus: SigningStatus.SIGNED },
              { role: RecipientRole.CC },
            ],
          },
        },
      },
      include: {
        recipients: true,
      },
      take: 10, // Process max 10 documents per run
    });

    console.log(`[CRON] Found ${stuckDocuments.length} stuck documents`);

    for (const envelope of stuckDocuments) {
      const legacyDocumentId = mapSecondaryIdToDocumentId(envelope.secondaryId);

      // Check if there's already a seal-document job running
      const existingJob = await prisma.backgroundJob.findFirst({
        where: {
          jobId: "internal.seal-document",
          payload: {
            path: ["documentId"],
            equals: legacyDocumentId,
          },
          status: {
            in: [BackgroundJobStatus.PENDING, BackgroundJobStatus.PROCESSING],
          },
        },
      });

      if (existingJob) {
        console.log(
          `[CRON] Document ${legacyDocumentId} already has job ${existingJob.id} (${existingJob.status})`
        );

        // Check if job is stuck (processing for more than 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (
          existingJob.status === BackgroundJobStatus.PROCESSING &&
          existingJob.updatedAt < fiveMinutesAgo
        ) {
          console.log(
            `[CRON] Job ${existingJob.id} stuck in PROCESSING, marking as FAILED`
          );

          await prisma.backgroundJob.update({
            where: { id: existingJob.id },
            data: {
              status: BackgroundJobStatus.FAILED,
              completedAt: new Date(),
            },
          });

          // Trigger new job
          console.log(
            `[CRON] Triggering new seal-document job for document ${legacyDocumentId}`
          );
          await jobs.triggerJob({
            name: "internal.seal-document",
            payload: {
              documentId: legacyDocumentId,
            },
          });
        }

        continue;
      }

      // No existing job, trigger seal-document
      console.log(
        `[CRON] Triggering seal-document job for document ${legacyDocumentId}`
      );

      await jobs.triggerJob({
        name: "internal.seal-document",
        payload: {
          documentId: legacyDocumentId,
        },
      });
    }

    console.log("[CRON] Process-pending-documents job completed");

    return c.json({
      success: true,
      processed: stuckDocuments.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error processing pending documents:", error);

    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};
