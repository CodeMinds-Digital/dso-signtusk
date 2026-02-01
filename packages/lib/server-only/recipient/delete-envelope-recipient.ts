import { msg } from "@lingui/core/macro";
import { EnvelopeType, SendStatus } from "@prisma/client";

import { mailer } from "@signtusk/email/mailer";
import { renderSimple } from "@signtusk/email/render-simple";
import { RecipientRemovedFromDocumentSimple } from "@signtusk/email/templates/recipient-removed-from-document-simple";
import { DOCUMENT_AUDIT_LOG_TYPE } from "@signtusk/lib/types/document-audit-logs";
import type { ApiRequestMetadata } from "@signtusk/lib/universal/extract-request-metadata";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../client-only/providers/i18n-server";
import { NEXT_PUBLIC_WEBAPP_URL } from "../../constants/app";
import { AppError, AppErrorCode } from "../../errors/app-error";
import { extractDerivedDocumentEmailSettings } from "../../types/document-email";
import { createDocumentAuditLogData } from "../../utils/document-audit-logs";
import { getRecipientRemovedFromDocumentTranslations } from "../../utils/get-email-translations";
import {
  canRecipientBeModified,
  isRecipientEmailValidForSending,
} from "../../utils/recipients";
import { buildTeamWhereQuery } from "../../utils/teams";
import { getEmailContext } from "../email/get-email-context";
import { getEnvelopeWhereInput } from "../envelope/get-envelope-by-id";

export interface DeleteEnvelopeRecipientOptions {
  userId: number;
  teamId: number;
  recipientId: number;
  requestMetadata: ApiRequestMetadata;
}

export const deleteEnvelopeRecipient = async ({
  userId,
  teamId,
  recipientId,
  requestMetadata,
}: DeleteEnvelopeRecipientOptions) => {
  const envelope = await prisma.envelope.findFirst({
    where: {
      recipients: {
        some: {
          id: recipientId,
        },
      },
      team: buildTeamWhereQuery({ teamId, userId }),
    },
    include: {
      documentMeta: true,
      team: true,
      recipients: {
        where: {
          id: recipientId,
        },
        include: {
          fields: true,
        },
      },
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!envelope) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: "Document not found",
    });
  }

  if (envelope.completedAt) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: "Document already complete",
    });
  }

  if (!user) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: "User not found",
    });
  }

  const recipientToDelete = envelope.recipients[0];

  if (!recipientToDelete || recipientToDelete.id !== recipientId) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: "Recipient not found",
    });
  }

  if (!canRecipientBeModified(recipientToDelete, recipientToDelete.fields)) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: "Recipient has already interacted with the document.",
    });
  }

  const { envelopeWhereInput } = await getEnvelopeWhereInput({
    id: {
      type: "envelopeId",
      id: envelope.id,
    },
    type: null,
    userId,
    teamId,
  });

  const deletedRecipient = await prisma.$transaction(async (tx) => {
    if (envelope.type === EnvelopeType.DOCUMENT) {
      await tx.documentAuditLog.create({
        data: createDocumentAuditLogData({
          type: DOCUMENT_AUDIT_LOG_TYPE.RECIPIENT_DELETED,
          envelopeId: envelope.id,
          metadata: requestMetadata,
          data: {
            recipientEmail: recipientToDelete.email,
            recipientName: recipientToDelete.name,
            recipientId: recipientToDelete.id,
            recipientRole: recipientToDelete.role,
          },
        }),
      });
    }

    return await tx.recipient.delete({
      where: {
        id: recipientId,
        envelope: envelopeWhereInput,
      },
    });
  });

  const isRecipientRemovedEmailEnabled = extractDerivedDocumentEmailSettings(
    envelope.documentMeta
  ).recipientRemoved;

  // Send email to deleted recipient.
  if (
    recipientToDelete.sendStatus === SendStatus.SENT &&
    isRecipientRemovedEmailEnabled &&
    envelope.type === EnvelopeType.DOCUMENT &&
    isRecipientEmailValidForSending(recipientToDelete)
  ) {
    const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || "http://localhost:3000";

    const { branding, emailLanguage, senderEmail, replyToEmail } =
      await getEmailContext({
        emailType: "RECIPIENT",
        source: {
          type: "team",
          teamId: envelope.teamId,
        },
        meta: envelope.documentMeta,
      });

    // Get translations for the email
    const translations = await getRecipientRemovedFromDocumentTranslations(
      emailLanguage,
      {
        inviterName: envelope.team?.name || user.name || "Unknown",
        documentName: envelope.title,
      }
    );

    const [html, text] = await Promise.all([
      renderSimple(RecipientRemovedFromDocumentSimple, {
        documentName: envelope.title,
        inviterName: envelope.team?.name || user.name || undefined,
        assetBaseUrl,
        translations,
        branding,
      }),
      renderSimple(
        RecipientRemovedFromDocumentSimple,
        {
          documentName: envelope.title,
          inviterName: envelope.team?.name || user.name || undefined,
          assetBaseUrl,
          translations,
          branding,
        },
        { plainText: true }
      ),
    ]);

    const i18n = await getI18nInstance(emailLanguage);

    await mailer.sendMail({
      to: {
        address: recipientToDelete.email,
        name: recipientToDelete.name,
      },
      from: senderEmail,
      replyTo: replyToEmail,
      subject: i18n._(msg`You have been removed from a document`),
      html,
      text,
    });
  }

  return deletedRecipient;
};
