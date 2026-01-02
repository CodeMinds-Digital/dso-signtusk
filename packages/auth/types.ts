/**
 * Browser-safe auth types.
 * These types are used by both client and server code.
 * They should NOT import from @prisma/client.
 */

import type { Role, Session } from "@signtusk/lib/constants/prisma-enums";

/**
 * The user object to pass around the app.
 * Do not put anything sensitive in here since it will be public.
 */
export type SessionUser = {
  id: number;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  avatarImageId: string | null;
  twoFactorEnabled: boolean;
  roles: Role[];
  signature: string | null;
};

export type SessionValidationResult =
  | {
      session: Session;
      user: SessionUser;
      isAuthenticated: true;
    }
  | { session: null; user: null; isAuthenticated: false };

export type ActiveSession = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  userId: number;
  ipAddress: string | null;
  userAgent: string | null;
};

export type PartialAccount = {
  id: string;
  provider: string;
  providerAccountId: string;
  createdAt: Date;
};
