import type { Context } from "hono";

import { prisma } from "@signtusk/prisma";

import { getSession } from "./get-session";

// Re-export PartialAccount from shared types for backwards compatibility
export type { PartialAccount } from "../../../types";

// Extended type for server-side use with additional fields
export type PartialAccountExtended = {
  id: string;
  userId: number;
  type: string;
  provider: string;
  providerAccountId: string;
  createdAt: Date;
};

export const getAccounts = async (
  c: Context | Request
): Promise<PartialAccountExtended[]> => {
  const { user } = await getSession(c);

  return await prisma.account.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      userId: true,
      type: true,
      provider: true,
      providerAccountId: true,
      createdAt: true,
    },
  });
};
