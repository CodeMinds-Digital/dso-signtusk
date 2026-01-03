import { SubscriptionStatus } from "@signtusk/lib/constants/prisma-enums";

import type { Stripe } from "@signtusk/lib/server-only/stripe";
import { prisma } from "@signtusk/prisma";

export type OnSubscriptionDeletedOptions = {
  subscription: Stripe.Subscription;
};

export const onSubscriptionDeleted = async ({
  subscription,
}: OnSubscriptionDeletedOptions) => {
  await prisma.subscription.update({
    where: {
      planId: subscription.id,
    },
    data: {
      status: SubscriptionStatus.INACTIVE,
    },
  });
};
