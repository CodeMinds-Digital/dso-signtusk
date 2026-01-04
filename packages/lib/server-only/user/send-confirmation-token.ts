import { DateTime } from "luxon";
import crypto from "node:crypto";

import { prisma } from "@signtusk/prisma";

import { USER_SIGNUP_VERIFICATION_TOKEN_IDENTIFIER } from "../../constants/email";
import { ONE_HOUR } from "../../constants/time";
import { sendConfirmationEmail } from "../auth/send-confirmation-email";
import { getMostRecentEmailVerificationToken } from "./get-most-recent-email-verification-token";

type SendConfirmationTokenOptions = { email: string; force?: boolean };

export const sendConfirmationToken = async ({
  email,
  force = false,
}: SendConfirmationTokenOptions) => {
  const token = crypto.randomBytes(20).toString("hex");

  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email verified");
  }

  const mostRecentToken = await getMostRecentEmailVerificationToken({
    userId: user.id,
  });

  // If we've sent a token in the last 5 minutes, don't send another one
  if (
    !force &&
    mostRecentToken?.createdAt &&
    DateTime.fromJSDate(mostRecentToken.createdAt).diffNow("minutes").minutes >
      -5
  ) {
    // return;
  }

  const createdToken = await prisma.verificationToken.create({
    data: {
      identifier: USER_SIGNUP_VERIFICATION_TOKEN_IDENTIFIER,
      token: token,
      expires: new Date(Date.now() + ONE_HOUR),
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  if (!createdToken) {
    throw new Error(`Failed to create the verification token`);
  }

  try {
    console.log(
      "[SEND_CONFIRMATION_TOKEN] Attempting to send email for userId:",
      user.id
    );
    await sendConfirmationEmail({ userId: user.id });
    console.log("[SEND_CONFIRMATION_TOKEN] Email sent successfully");
    return { success: true };
  } catch (err) {
    console.error(
      "[SEND_CONFIRMATION_TOKEN] Failed to send email. Error:",
      err
    );
    console.error(
      "[SEND_CONFIRMATION_TOKEN] Error message:",
      err instanceof Error ? err.message : String(err)
    );
    console.error(
      "[SEND_CONFIRMATION_TOKEN] Error stack:",
      err instanceof Error ? err.stack : "No stack"
    );
    throw new Error(
      `Failed to send the confirmation email: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};
