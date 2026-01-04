import { createElement } from "react";

import { msg } from "@lingui/core/macro";

import { mailer } from "@signtusk/email/mailer";
import { ConfirmEmailTemplate } from "@signtusk/email/templates/confirm-email";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../client-only/providers/i18n-server";
import { NEXT_PUBLIC_WEBAPP_URL } from "../../constants/app";
import {
  DOCUMENSO_INTERNAL_EMAIL,
  USER_SIGNUP_VERIFICATION_TOKEN_IDENTIFIER,
} from "../../constants/email";
import { renderEmailWithI18N } from "../../utils/render-email-with-i18n";

export interface SendConfirmationEmailProps {
  userId: number;
}

export const sendConfirmationEmail = async ({
  userId,
}: SendConfirmationEmailProps) => {
  console.log("[SEND_CONFIRMATION_EMAIL_FN] Starting for userId:", userId);

  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
    include: {
      verificationTokens: {
        where: {
          identifier: USER_SIGNUP_VERIFICATION_TOKEN_IDENTIFIER,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  console.log("[SEND_CONFIRMATION_EMAIL_FN] Found user:", user.email);

  const [verificationToken] = user.verificationTokens;

  if (!verificationToken?.token) {
    throw new Error("Verification token not found for the user");
  }

  console.log("[SEND_CONFIRMATION_EMAIL_FN] Found verification token");

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || "http://localhost:3000";
  const confirmationLink = `${assetBaseUrl}/verify-email/${verificationToken.token}`;

  console.log("[SEND_CONFIRMATION_EMAIL_FN] Asset base URL:", assetBaseUrl);
  console.log(
    "[SEND_CONFIRMATION_EMAIL_FN] Confirmation link:",
    confirmationLink
  );

  const confirmationTemplate = createElement(ConfirmEmailTemplate, {
    assetBaseUrl,
    confirmationLink,
  });

  console.log("[SEND_CONFIRMATION_EMAIL_FN] Rendering email template...");

  const [html, text] = await Promise.all([
    renderEmailWithI18N(confirmationTemplate),
    renderEmailWithI18N(confirmationTemplate, { plainText: true }),
  ]);

  console.log(
    "[SEND_CONFIRMATION_EMAIL_FN] Email template rendered, HTML length:",
    html?.length
  );

  const i18n = await getI18nInstance();

  console.log("[SEND_CONFIRMATION_EMAIL_FN] Sending email via mailer...");
  console.log("[SEND_CONFIRMATION_EMAIL_FN] To:", user.email);
  console.log("[SEND_CONFIRMATION_EMAIL_FN] From:", DOCUMENSO_INTERNAL_EMAIL);

  return mailer.sendMail({
    to: {
      address: user.email,
      name: user.name || "",
    },
    from: DOCUMENSO_INTERNAL_EMAIL,
    subject: i18n._(msg`Please confirm your email`),
    html,
    text,
  });
};
