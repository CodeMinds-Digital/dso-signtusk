import { createElement } from "react";

import { mailer } from "@signtusk/email/mailer";
import { renderSimple } from "@signtusk/email/render-simple";
import { ConfirmEmailSimpleTemplate } from "@signtusk/email/templates/confirm-email-simple";
import { prisma } from "@signtusk/prisma";

import { NEXT_PUBLIC_WEBAPP_URL } from "../../constants/app";
import {
  DOCUMENSO_INTERNAL_EMAIL,
  USER_SIGNUP_VERIFICATION_TOKEN_IDENTIFIER,
} from "../../constants/email";

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

  // Use simple template without lingui hooks to avoid React version conflicts
  // with @react-email/render in serverless environments
  const confirmationTemplate = createElement(ConfirmEmailSimpleTemplate, {
    assetBaseUrl,
    confirmationLink,
    translations: {
      previewText: "Please confirm your email address",
      welcomeTitle: "Welcome to Signtusk!",
      confirmInstructions:
        "Before you get started, please confirm your email address by clicking the button below:",
      confirmButton: "Confirm email",
      linkExpiry: "(link expires in 1 hour)",
    },
  });

  console.log("[SEND_CONFIRMATION_EMAIL_FN] Rendering email template...");

  const [html, text] = await Promise.all([
    renderSimple(confirmationTemplate),
    renderSimple(confirmationTemplate, { plainText: true }),
  ]);

  console.log(
    "[SEND_CONFIRMATION_EMAIL_FN] Email template rendered, HTML length:",
    html?.length
  );

  console.log("[SEND_CONFIRMATION_EMAIL_FN] Sending email via mailer...");
  console.log("[SEND_CONFIRMATION_EMAIL_FN] To:", user.email);
  console.log("[SEND_CONFIRMATION_EMAIL_FN] From:", DOCUMENSO_INTERNAL_EMAIL);

  return mailer.sendMail({
    to: {
      address: user.email,
      name: user.name || "",
    },
    from: DOCUMENSO_INTERNAL_EMAIL,
    subject: "Please confirm your email",
    html,
    text,
  });
};
