import { createElement } from "react";

import { msg } from "@lingui/core/macro";
import { EnvelopeType, SendStatus, SigningStatus } from "@prisma/client";

import { mailer } from "@signtusk/email/mailer";
import { renderSimple } from "@signtusk/email/render-simple";
import DocumentRejectedEmailSimple from "@signtusk/email/templates/document-rejected-simple";
import DocumentRejectionConfirmedEmailSimple from "@signtusk/email/templates/document-rejection-confirmed-simple";
import { isRecipientEmailValidForSending } from "@signtusk/lib/utils/recipients";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../../client-only/providers/i18n-server";
import { NEXT_PUBLIC_WEBAPP_URL } from "../../../constants/app";
import { SIGNTUSK_INTERNAL_EMAIL } from "../../../constants/email";
import { getEmailContext } from "../../../server-only/email/get-email-context";
import { extractDerivedDocumentEmailSettings } from "../../../types/document-email";
import { unsafeBuildEnvelopeIdQuery } from "../../../utils/envelope";
import {
  getDocumentRejectedTranslations,
  getDocumentRejectionConfirmedTranslations,
} from "../../../utils/get-email-translations";
import { formatDocumentsPath } from "../../../utils/teams";
import type { JobRunIO } from "../../client/_internal/job";
import type { TSendSigningRejectionEmailsJobDefinition } from "./send-rejection-emails";

export const run = async ({
  payload,
  io,
}: {
  payload: TSendSigningRejectionEmailsJobDefinition;
  io: JobRunIO;
}) => {
  const { documentId, recipientId } = payload;

  const [envelope, recipient] = await Promise.all([
    prisma.envelope.findFirstOrThrow({
      where: unsafeBuildEnvelopeIdQuery(
        {
          type: "documentId",
          id: documentId,
        },
        EnvelopeType.DOCUMENT
      ),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        documentMeta: true,
        team: {
          select: {
            teamEmail: true,
            name: true,
            url: true,
          },
        },
      },
    }),
    prisma.recipient.findFirstOrThrow({
      where: {
        id: recipientId,
        signingStatus: SigningStatus.REJECTED,
      },
    }),
  ]);

  const { user: documentOwner } = envelope;

  const isEmailEnabled = extractDerivedDocumentEmailSettings(
    envelope.documentMeta
  ).recipientSigningRequest;

  if (!isEmailEnabled) {
    return;
  }

  const { branding, emailLanguage, senderEmail, replyToEmail } =
    await getEmailContext({
      emailType: "RECIPIENT",
      source: {
        type: "team",
        teamId: envelope.teamId,
      },
      meta: envelope.documentMeta,
    });

  const i18n = await getI18nInstance(emailLanguage);

  // Send confirmation email to the recipient who rejected
  if (isRecipientEmailValidForSending(recipient)) {
    await io.runTask("send-rejection-confirmation-email", async () => {
      const translations = await getDocumentRejectionConfirmedTranslations(
        emailLanguage,
        {
          recipientName: recipient.name,
          documentName: envelope.title,
          documentOwnerName: envelope.user.name || envelope.user.email,
          reason: recipient.rejectionReason || undefined,
        }
      );

      const recipientTemplate = createElement(
        DocumentRejectionConfirmedEmailSimple,
        {
          recipientName: recipient.name,
          documentName: envelope.title,
          documentOwnerName: envelope.user.name || envelope.user.email,
          reason: recipient.rejectionReason || "",
          assetBaseUrl: NEXT_PUBLIC_WEBAPP_URL(),
          translations,
          branding: branding
            ? {
                brandingEnabled: true,
                brandingLogo: branding.logo || undefined,
                brandingCompanyDetails: branding.companyDetails || undefined,
              }
            : undefined,
        }
      );

      const [html, text] = await Promise.all([
        renderSimple(recipientTemplate),
        renderSimple(recipientTemplate, { plainText: true }),
      ]);

      await mailer.sendMail({
        to: {
          name: recipient.name,
          address: recipient.email,
        },
        from: senderEmail,
        replyTo: replyToEmail,
        subject: i18n._(
          msg`Document "${envelope.title}" - Rejection Confirmed`
        ),
        html,
        text,
      });
    });
  }

  // Send notification email to document owner
  await io.runTask("send-owner-notification-email", async () => {
    const translations = await getDocumentRejectedTranslations(emailLanguage, {
      recipientName: recipient.name,
      documentName: envelope.title,
      reason: recipient.rejectionReason || undefined,
    });

    const ownerTemplate = createElement(DocumentRejectedEmailSimple, {
      recipientName: recipient.name,
      documentName: envelope.title,
      documentUrl: `${NEXT_PUBLIC_WEBAPP_URL()}${formatDocumentsPath(
        envelope.team?.url
      )}/${envelope.id}`,
      rejectionReason: recipient.rejectionReason || "",
      assetBaseUrl: NEXT_PUBLIC_WEBAPP_URL(),
      translations,
      branding: branding
        ? {
            brandingEnabled: true,
            brandingLogo: branding.logo || undefined,
            brandingCompanyDetails: branding.companyDetails || undefined,
          }
        : undefined,
    });

    const [html, text] = await Promise.all([
      renderSimple(ownerTemplate),
      renderSimple(ownerTemplate, { plainText: true }),
    ]);

    await mailer.sendMail({
      to: {
        name: documentOwner.name || "",
        address: documentOwner.email,
      },
      from: SIGNTUSK_INTERNAL_EMAIL, // Purposefully using internal email here.
      subject: i18n._(
        msg`Document "${envelope.title}" - Rejected by ${recipient.name}`
      ),
      html,
      text,
    });
  });

  await io.runTask("update-recipient", async () => {
    await prisma.recipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        sendStatus: SendStatus.SENT,
      },
    });
  });
};
