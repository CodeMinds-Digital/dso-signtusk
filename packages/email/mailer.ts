import type { Transporter } from "nodemailer";
import { createTransport } from "nodemailer";

import { ResendTransport } from "@documenso/nodemailer-resend";
import { env } from "@signtusk/lib/utils/env";

import { MailChannelsTransport } from "./transports/mailchannels";

/**
 * Creates a Nodemailer transport object for sending emails.
 *
 * This function uses various environment variables to configure the appropriate
 * email transport mechanism. It supports multiple types of email transports,
 * including MailChannels, Resend, and different SMTP configurations.
 *
 * @returns {Transporter} A configured Nodemailer transporter instance.
 *
 * Supported Transports:
 * - **mailchannels**: Uses MailChannelsTransport, requiring:
 *   - `NEXT_PRIVATE_MAILCHANNELS_API_KEY`: API key for MailChannels
 *   - `NEXT_PRIVATE_MAILCHANNELS_ENDPOINT`: Endpoint for MailChannels (optional)
 * - **resend**: Uses ResendTransport, requiring:
 *   - `NEXT_PRIVATE_RESEND_API_KEY`: API key for Resend
 * - **smtp-api**: Uses a custom SMTP API configuration, requiring:
 *   - `NEXT_PRIVATE_SMTP_HOST`: The SMTP server host
 *   - `NEXT_PRIVATE_SMTP_APIKEY`: The API key for SMTP authentication
 *   - `NEXT_PRIVATE_SMTP_APIKEY_USER`: The username for SMTP authentication (default: 'apikey')
 * - **smtp-auth** (default): Uses a standard SMTP configuration, requiring:
 *   - `NEXT_PRIVATE_SMTP_HOST`: The SMTP server host (default: 'localhost:2500')
 *   - `NEXT_PRIVATE_SMTP_PORT`: The port to connect to (default: 587)
 *   - `NEXT_PRIVATE_SMTP_SECURE`: Whether to use SSL/TLS (default: false)
 *   - `NEXT_PRIVATE_SMTP_UNSAFE_IGNORE_TLS`: Whether to ignore TLS (default: false)
 *   - `NEXT_PRIVATE_SMTP_USERNAME`: The username for SMTP authentication
 *   - `NEXT_PRIVATE_SMTP_PASSWORD`: The password for SMTP authentication
 *   - `NEXT_PRIVATE_SMTP_SERVICE`: The SMTP service provider (e.g., "gmail"). This option is used
 *     when integrating with well-known services (like Gmail), enabling simplified configuration.
 *
 * Example Usage:
 * ```env
 * NEXT_PRIVATE_SMTP_TRANSPORT='smtp-auth';
 * NEXT_PRIVATE_SMTP_HOST='smtp.example.com';
 * NEXT_PRIVATE_SMTP_PORT=587;
 * NEXT_PRIVATE_SMTP_SERVICE='gmail';
 * NEXT_PRIVATE_SMTP_SECURE='true';
 * NEXT_PRIVATE_SMTP_USERNAME='your-email@gmail.com';
 * NEXT_PRIVATE_SMTP_PASSWORD='your-password';
 * ```
 *
 * Notes:
 * - Ensure that the required environment variables for each transport type are set.
 * - If `NEXT_PRIVATE_SMTP_TRANSPORT` is not specified, the default is `smtp-auth`.
 * - `NEXT_PRIVATE_SMTP_SERVICE` is optional and used specifically for well-known services like Gmail.
 */
const getTransport = (): Transporter => {
  const transport = env("NEXT_PRIVATE_SMTP_TRANSPORT") ?? "smtp-auth";
  const apiKey = env("NEXT_PRIVATE_RESEND_API_KEY");

  console.log("[MAILER] Creating transport:", transport);
  console.log("[MAILER] Resend API key present:", !!apiKey);
  console.log(
    "[MAILER] Resend API key prefix:",
    apiKey?.substring(0, 10) + "..."
  );

  if (transport === "mailchannels") {
    return createTransport(
      MailChannelsTransport.makeTransport({
        apiKey: env("NEXT_PRIVATE_MAILCHANNELS_API_KEY"),
        endpoint: env("NEXT_PRIVATE_MAILCHANNELS_ENDPOINT"),
      })
    );
  }

  if (transport === "resend") {
    if (!apiKey) {
      console.error("[MAILER] ERROR: NEXT_PRIVATE_RESEND_API_KEY is not set!");
    }
    return createTransport(
      ResendTransport.makeTransport({
        apiKey: apiKey || "",
      })
    );
  }

  if (transport === "smtp-api") {
    if (!env("NEXT_PRIVATE_SMTP_HOST") || !env("NEXT_PRIVATE_SMTP_APIKEY")) {
      throw new Error(
        "SMTP API transport requires NEXT_PRIVATE_SMTP_HOST and NEXT_PRIVATE_SMTP_APIKEY"
      );
    }

    return createTransport({
      host: env("NEXT_PRIVATE_SMTP_HOST"),
      port: Number(env("NEXT_PRIVATE_SMTP_PORT")) || 587,
      secure: env("NEXT_PRIVATE_SMTP_SECURE") === "true",
      auth: {
        user: env("NEXT_PRIVATE_SMTP_APIKEY_USER") ?? "apikey",
        pass: env("NEXT_PRIVATE_SMTP_APIKEY") ?? "",
      },
    });
  }

  return createTransport({
    host: env("NEXT_PRIVATE_SMTP_HOST") ?? "127.0.0.1:2500",
    port: Number(env("NEXT_PRIVATE_SMTP_PORT")) || 587,
    secure: env("NEXT_PRIVATE_SMTP_SECURE") === "true",
    ignoreTLS: env("NEXT_PRIVATE_SMTP_UNSAFE_IGNORE_TLS") === "true",
    auth: env("NEXT_PRIVATE_SMTP_USERNAME")
      ? {
          user: env("NEXT_PRIVATE_SMTP_USERNAME"),
          pass: env("NEXT_PRIVATE_SMTP_PASSWORD") ?? "",
        }
      : undefined,
    ...(env("NEXT_PRIVATE_SMTP_SERVICE")
      ? { service: env("NEXT_PRIVATE_SMTP_SERVICE") }
      : {}),
  });
};

// Lazy initialization to ensure env vars are loaded
let _mailer: Transporter | null = null;

export const mailer = {
  sendMail: async (options: Parameters<Transporter["sendMail"]>[0]) => {
    if (!_mailer) {
      _mailer = getTransport();
    }
    console.log("[MAILER] Sending email to:", options.to);
    console.log("[MAILER] From:", options.from);
    try {
      const result = await _mailer.sendMail(options);
      console.log("[MAILER] Email sent successfully:", result);
      return result;
    } catch (error) {
      console.error("[MAILER] Failed to send email:", error);
      throw error;
    }
  },
};
