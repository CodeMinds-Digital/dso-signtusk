import type { Context } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";

import {
  formatSecureCookieName,
  getCookieDomain,
  useSecureCookies,
} from "@signtusk/lib/constants/auth";
import { appLog } from "@signtusk/lib/utils/debugger";
import { env } from "@signtusk/lib/utils/env";

import { AUTH_SESSION_LIFETIME } from "../../config";
import { extractCookieFromHeaders } from "../utils/cookies";
import { generateSessionToken } from "./session";

// Make cookie names dynamic functions to ensure they're evaluated at runtime
export const getSessionCookieName = () => formatSecureCookieName("sessionId");
export const getCsrfCookieName = () => formatSecureCookieName("csrfToken");

// Keep for backward compatibility
export const sessionCookieName = getSessionCookieName();
export const csrfCookieName = getCsrfCookieName();

const getAuthSecret = () => {
  const authSecret = env("NEXTAUTH_SECRET");

  if (!authSecret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  return authSecret;
};

/**
 * Generic auth session cookie options.
 * Returns fresh options each time to ensure dynamic values are current.
 */
export const getSessionCookieOptions = () =>
  ({
    httpOnly: true,
    path: "/",
    sameSite: useSecureCookies() ? "none" : "lax",
    secure: useSecureCookies(),
    domain: getCookieDomain(),
    expires: new Date(Date.now() + AUTH_SESSION_LIFETIME),
  }) as const;

// Keep for backward compatibility but use the function internally
export const sessionCookieOptions = getSessionCookieOptions();

export const extractSessionCookieFromHeaders = (
  headers: Headers
): string | null => {
  return extractCookieFromHeaders(getSessionCookieName(), headers);
};

/**
 * Get the session cookie attached to the request headers.
 *
 * @param c - The Hono context.
 * @returns The session ID or null if no session cookie is found.
 */
export const getSessionCookie = async (c: Context): Promise<string | null> => {
  const cookieName = getSessionCookieName();

  const sessionId = await getSignedCookie(c, getAuthSecret(), cookieName);

  return sessionId || null;
};

/**
 * Set the session cookie into the Hono context.
 *
 * @param c - The Hono context.
 * @param sessionToken - The session token to set.
 */
export const setSessionCookie = async (c: Context, sessionToken: string) => {
  await setSignedCookie(
    c,
    getSessionCookieName(),
    sessionToken,
    getAuthSecret(),
    getSessionCookieOptions()
  ).catch((err) => {
    appLog("SetSessionCookie", `Error setting signed cookie: ${err}`);

    throw err;
  });
};

/**
 * Set the session cookie into the Hono context.
 *
 * @param c - The Hono context.
 * @param sessionToken - The session token to set.
 */
export const deleteSessionCookie = (c: Context) => {
  deleteCookie(c, getSessionCookieName(), getSessionCookieOptions());
};

export const getCsrfCookie = async (c: Context) => {
  const csrfToken = await getSignedCookie(
    c,
    getAuthSecret(),
    getCsrfCookieName()
  );

  return csrfToken || null;
};

export const setCsrfCookie = async (c: Context) => {
  const csrfToken = generateSessionToken();

  await setSignedCookie(c, getCsrfCookieName(), csrfToken, getAuthSecret(), {
    ...getSessionCookieOptions(),

    // Explicity set to undefined for session lived cookie.
    expires: undefined,
    maxAge: undefined,
  });

  return csrfToken;
};
