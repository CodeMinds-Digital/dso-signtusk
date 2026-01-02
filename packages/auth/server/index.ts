import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { NEXT_PUBLIC_WEBAPP_URL } from "@signtusk/lib/constants/app";
import { AppError, AppErrorCode } from "@signtusk/lib/errors/app-error";
import { extractRequestMetadata } from "@signtusk/lib/universal/extract-request-metadata";
import { env } from "@signtusk/lib/utils/env";

import { setCsrfCookie } from "./lib/session/session-cookies";
import { accountRoute } from "./routes/account";
import { callbackRoute } from "./routes/callback";
import { emailPasswordRoute } from "./routes/email-password";
import { oauthRoute } from "./routes/oauth";
import { passkeyRoute } from "./routes/passkey";
import { sessionRoute } from "./routes/session";
import { signOutRoute } from "./routes/sign-out";
import { ssoRoute } from "./routes/sso";
import { twoFactorRoute } from "./routes/two-factor";
import type { HonoAuthContext } from "./types/context";

/**
 * Check if an origin is allowed based on ALLOWED_ORIGINS env var.
 * Supports wildcard patterns like "https://*.vercel.app"
 */
function isAllowedOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true; // No origin header = same-origin request

  const webUrl = NEXT_PUBLIC_WEBAPP_URL();
  const allowedOriginsEnv = env("ALLOWED_ORIGINS");

  // Build list of allowed origins
  const allowedOrigins: string[] = [webUrl];

  if (allowedOriginsEnv) {
    allowedOrigins.push(...allowedOriginsEnv.split(",").map((o) => o.trim()));
  }

  // Check each allowed origin
  for (const allowed of allowedOrigins) {
    if (allowed.includes("*")) {
      // Wildcard pattern: https://*.vercel.app
      const pattern = allowed.replace("*", "");
      if (
        origin.endsWith(pattern) ||
        origin.includes(pattern.replace("https://", ""))
      ) {
        return true;
      }
    } else if (origin === allowed) {
      return true;
    }
  }

  // Also allow if origin host matches request host (same-origin on dynamic hosts)
  if (host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return true;
      }
    } catch {
      // Invalid origin URL
    }
  }

  return false;
}

// Note: You must chain routes for Hono RPC client to work.
export const auth = new Hono<HonoAuthContext>()
  .use(async (c, next) => {
    c.set("requestMetadata", extractRequestMetadata(c.req.raw));

    const headerOrigin = c.req.header("Origin") ?? null;
    const headerHost = c.req.header("Host") ?? null;

    if (!isAllowedOrigin(headerOrigin, headerHost)) {
      return c.json(
        {
          message: "Forbidden",
          statusCode: 403,
        },
        403
      );
    }

    await next();
  })
  .get("/csrf", async (c) => {
    const csrfToken = await setCsrfCookie(c);

    return c.json({ csrfToken });
  })
  .route("/", sessionRoute)
  .route("/", signOutRoute)
  .route("/", accountRoute)
  .route("/callback", callbackRoute)
  .route("/oauth", oauthRoute)
  .route("/email-password", emailPasswordRoute)
  .route("/passkey", passkeyRoute)
  .route("/sso", ssoRoute)
  .route("/two-factor", twoFactorRoute);

/**
 * Handle errors.
 */
auth.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        code: AppErrorCode.UNKNOWN_ERROR,
        message: err.message,
        statusCode: err.status,
      },
      err.status
    );
  }

  if (err instanceof AppError) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const statusCode = (err.statusCode || 500) as ContentfulStatusCode;

    return c.json(
      {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
      statusCode
    );
  }

  // Handle other errors
  console.error("Unknown Error:", err);
  return c.json(
    {
      code: AppErrorCode.UNKNOWN_ERROR,
      message: "Internal Server Error",
      statusCode: 500,
    },
    500
  );
});

export type AuthAppType = typeof auth;
