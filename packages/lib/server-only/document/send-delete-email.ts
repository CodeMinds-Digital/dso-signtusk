import { createElement } from "react";

import { msg } from "@lingui/core/macro";

import { mailer } from "@signtusk/email/mailer";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../client-only/providers/i18n-server";
import { NEXT_PUBLIC_WEBAPP_URL } from "../../constants/app";
import { AppError, AppErrorCode } from "../../errors/app-error";
import { extractDerivedDocumentEmailSettings } from "../../types/document-email";
import { getEmailContext } from "../email/get-email-context";

export interface SendDeleteEmailOptions {
  envelopeId: string;
  reason: string;
}

// Note: Currently only sent by Admin function
export const sendDeleteEmail = async ({
  envelopeId,
  reason,
}: SendDeleteEmailOptions) => {
  const envelope = await prisma.envelope.findFirst({
    where: {
      id: envelopeId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      documentMeta: true,
    },
  });

  if (!envelope) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: "Document not found",
    });
  }

  const isDocumentDeletedEmailEnabled = extractDerivedDocumentEmailSettings(
    envelope.documentMeta
  ).documentDeleted;

  if (!isDocumentDeletedEmailEnabled) {
    return;
  }

  const { branding, emailLanguage, senderEmail } = await getEmailContext({
    emailType: "INTERNAL",
    source: {
      type: "team",
      teamId: envelope.teamId,
    },
    meta: envelope.documentMeta,
  });

  const { email, name } = envelope.user;

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || "http://localhost:3000";

  // Get translations for the email
  const translations = await getDocumentSuperDeleteTranslations(
    emailLanguage as import("../../constants/i18n").SupportedLanguageCodes,
    {
      documentName: envelope.title,
      reason,
    }
  );

  const template = createElement(DocumentSuperDeleteEmailSimple, {
    documentName: envelope.title,
    reason,
    assetBaseUrl,
    translations,
    branding: branding
      ? {
          brandingEnabled: branding.brandingEnabled,
          brandingLogo: branding.brandingLogo || undefined,
          brandingCompanyDetails: branding.brandingCompanyDetails || undefined,
        }
      : undefined,
  });

  const [html, text] = await Promise.all([
    renderSimple(template),
    renderSimple(template, { plainText: true }),
  ]);

  const i18n = await getI18nInstance(emailLanguage);

  await mailer.sendMail({
    to: {
      address: email,
      name: name || "",
    },
    from: senderEmail,
    subject: i18n._(msg`Document Deleted!`),
    html,
    text,
  });
};
