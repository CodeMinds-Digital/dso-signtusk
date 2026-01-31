import { createElement } from "react";

import { mailer } from "@signtusk/email/mailer";
import { renderSimple } from "@signtusk/email/render-simple";
import PasswordResetEmailSimple from "@signtusk/email/templates/password-reset-simple";
import { prisma } from "@signtusk/prisma";

import { NEXT_PUBLIC_WEBAPP_URL } from "../../constants/app";
import { env } from "../../utils/env";
import { getPasswordResetSuccessTranslations } from "../../utils/get-email-translations";

export interface SendResetPasswordOptions {
  userId: number;
}

export const sendResetPassword = async ({
  userId,
}: SendResetPasswordOptions) => {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
  });

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || "http://localhost:3000";

  // Get translations for the email
  const translations = await getPasswordResetSuccessTranslations("en", {
    userName: user.name || undefined,
  });

  const template = createElement(PasswordResetEmailSimple, {
    assetBaseUrl,
    userEmail: user.email,
    userName: user.name || "",
    translations,
  });

  const [html, text] = await Promise.all([
    renderSimple(template),
    renderSimple(template, { plainText: true }),
  ]);

  return await mailer.sendMail({
    to: {
      address: user.email,
      name: user.name || "",
    },
    from: {
      name: env("NEXT_PRIVATE_SMTP_FROM_NAME") || "Signtusk",
      address: env("NEXT_PRIVATE_SMTP_FROM_ADDRESS") || "noreply@signtusk.com",
    },
    subject: "Password Reset Success!",
    html,
    text,
  });
};
