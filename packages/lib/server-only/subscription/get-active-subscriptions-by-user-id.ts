import { SubscriptionStatus } from '@prisma/client';

import { prisma } from '@signtusk/prisma';

export type GetActiveSubscriptionsByUserIdOptions = {
  userId: number;
};

export const getActiveSubscriptionsByUserId = async ({
  userId,
}: GetActiveSubscriptionsByUserIdOptions) => {
  return await prisma.subscription.findMany({
    where: {
      organisation: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      status: {
        not: SubscriptionStatus.INACTIVE,
      },
    },
  });
};
