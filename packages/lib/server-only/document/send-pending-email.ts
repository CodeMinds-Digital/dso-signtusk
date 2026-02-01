import { msg } from "@lingui/core/macro";
import { EnvelopeType } from "@prisma/client";

import { mailer } from "@signtusk/email/mailer";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../client-only/providers/i18n-server";
import { NEXT_PUBLIC_WEBAPP_URL } from "../../constants/app";
import { extractDerivedDocumentEmailSettings } from "../../types/document-email";
import type { EnvelopeIdOptions } from "../../utils/envelope";
import { unsafeBuildEnvelopeIdQuery } from "../../utils/envelope";
import { isRecipientEmailValidForSending } from "../../utils/recipients";
import { getEmailContext } from "../email/get-email-context";

export interface SendPendingEmailOptions {
  id: EnvelopeIdOptions;
  recipientId: number;
}

export const sendPendingEmail = async ({
  id,
  recipientId,
}: SendPendingEmailOptions) => {
  const envelope = await prisma.envelope.findFirst({
    where: {
      ...unsafeBuildEnvelopeIdQuery(id, EnvelopeType.DOCUMENT),
      recipients: {
        some: {
          id: recipientId,
        },
      },
    },
    include: {
      recipients: {
        where: {
          id: recipientId,
        },
      },
      documentMeta: true,
    },
  });

  if (!envelope) {
    throw new Error("Document not found");
  }

  if (envelope.recipients.length === 0) {
    throw new Error("Document has no recipients");
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

  const isDocumentPendingEmailEnabled = extractDerivedDocumentEmailSettings(
    envelope.documentMeta
  ).documentPending;

  if (!isDocumentPendingEmailEnabled) {
    return;
  }

  const [recipient] = envelope.recipients;

  const { email, name } = recipient;

  // Skip sending email if recipient has no email address
  if (!isRecipientEmailValidForSending(recipient)) {
    return;
  }

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || "http://localhost:3000";

  // Get translations
  const translations = await getDocumentPendingTranslations(emailLanguage, {
    documentName: envelope.title,
  });

  const [html, text] = await Promise.all([
    renderSimple(DocumentPendingEmailTemplateSimple, {
      documentName: envelope.title,
      assetBaseUrl,
      branding,
      translations,
    }),
    renderSimple(
      DocumentPendingEmailTemplateSimple,
      {
        documentName: envelope.title,
        assetBaseUrl,
        branding,
        translations,
      },
      { plainText: true }
    ),
  ]);

  const i18n = await getI18nInstance(emailLanguage);

  await mailer.sendMail({
    to: {
      address: email,
      name,
    },
    from: senderEmail,
    replyTo: replyToEmail,
    subject: i18n._(msg`Waiting for others to complete signing.`),
    html,
    text,
  });
};
