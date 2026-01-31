import { createElement } from "react";

import { msg } from "@lingui/core/macro";

import { mailer } from "@signtusk/email/mailer";
import { renderSimple } from "@signtusk/email/render-simple";
import ForgotPasswordEmailSimple from "@signtusk/email/templates/forgot-password-simple";
import { prisma } from "@signtusk/prisma";

import { getI18nInstance } from "../../client-only/providers/i18n-server";
import { NEXT_PUBLIC_WEBAPP_URL } from "../../constants/app";
import { env } from "../../utils/env";
import { getForgotPasswordTranslations } from "../../utils/get-email-translations";

export interface SendForgotPasswordOptions {
  userId: number;
}

export const sendForgotPassword = async ({
  userId,
}: SendForgotPasswordOptions) => {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
    include: {
      passwordResetTokens: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const token = user.passwordResetTokens[0].token;
  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || "http://localhost:3000";
  const resetPasswordLink = `${NEXT_PUBLIC_WEBAPP_URL()}/reset-password/${token}`;

  // Get translations for the email
  const translations = await getForgotPasswordTranslations("en");

  const template = createElement(ForgotPasswordEmailSimple, {
    assetBaseUrl,
    resetPasswordLink,
    translations,
  });

  const [html, text] = await Promise.all([
    renderSimple(template),
    renderSimple(template, { plainText: true }),
  ]);

  const i18n = await getI18nInstance();

  return await mailer.sendMail({
    to: {
      address: user.email,
      name: user.name || "",
    },
    from: {
      name: env("NEXT_PRIVATE_SMTP_FROM_NAME") || "Signtusk",
      address: env("NEXT_PRIVATE_SMTP_FROM_ADDRESS") || "noreply@signtusk.com",
    },
    subject: i18n._(msg`Forgot Password?`),
    html,
    text,
  });
};
