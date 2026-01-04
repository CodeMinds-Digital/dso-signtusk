import { sendConfirmationToken } from "../../../server-only/user/send-confirmation-token";
import type { TSendConfirmationEmailJobDefinition } from "./send-confirmation-email";

export const run = async ({
  payload,
}: {
  payload: TSendConfirmationEmailJobDefinition;
}) => {
  console.log(
    "[SEND_CONFIRMATION_EMAIL] Job handler started for email:",
    payload.email
  );
  try {
    await sendConfirmationToken({
      email: payload.email,
      force: payload.force,
    });
    console.log(
      "[SEND_CONFIRMATION_EMAIL] Job completed successfully for:",
      payload.email
    );
  } catch (error) {
    console.error(
      "[SEND_CONFIRMATION_EMAIL] Job failed for:",
      payload.email,
      error
    );
    throw error;
  }
};
