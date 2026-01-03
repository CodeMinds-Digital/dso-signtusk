import { EnvelopeType } from "@signtusk/lib/constants/prisma-enums";
import { DateTime } from "luxon";

import { NEXT_PUBLIC_WEBAPP_URL } from "@signtusk/lib/constants/app";
import { AppError } from "@signtusk/lib/errors/app-error";
import { encryptSecondaryData } from "@signtusk/lib/server-only/crypto/encrypt";
import { getEnvelopeById } from "@signtusk/lib/server-only/envelope/get-envelope-by-id";
import { isDocumentCompleted } from "@signtusk/lib/utils/document";
import { mapSecondaryIdToDocumentId } from "@signtusk/lib/utils/envelope";

import { authenticatedProcedure } from "../trpc";
import {
  ZDownloadDocumentCertificateRequestSchema,
  ZDownloadDocumentCertificateResponseSchema,
} from "./download-document-certificate.types";

export const downloadDocumentCertificateRoute = authenticatedProcedure
  .input(ZDownloadDocumentCertificateRequestSchema)
  .output(ZDownloadDocumentCertificateResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { teamId } = ctx;
    const { documentId } = input;

    ctx.logger.info({
      input: {
        documentId,
      },
    });

    const envelope = await getEnvelopeById({
      id: {
        type: "documentId",
        id: documentId,
      },
      type: EnvelopeType.DOCUMENT,
      userId: ctx.user.id,
      teamId,
    });

    if (!isDocumentCompleted(envelope.status)) {
      throw new AppError("DOCUMENT_NOT_COMPLETE");
    }

    const encrypted = encryptSecondaryData({
      data: mapSecondaryIdToDocumentId(envelope.secondaryId).toString(),
      expiresAt: DateTime.now().plus({ minutes: 5 }).toJSDate().valueOf(),
    });

    return {
      url: `${NEXT_PUBLIC_WEBAPP_URL()}/__htmltopdf/certificate?d=${encrypted}`,
    };
  });
