import type Stripe from "stripe";

import { AppError, AppErrorCode } from "@signtusk/lib/errors/app-error";
import { stripe } from "@signtusk/lib/server-only/stripe";

export type CreateCheckoutSessionOptions = {
  customerId: string;
  priceId: string;
  returnUrl: string;
  subscriptionMetadata?: Stripe.Metadata;
};

export const createCheckoutSession = async ({
  customerId,
  priceId,
  returnUrl,
  subscriptionMetadata,
}: CreateCheckoutSessionOptions) => {
  // Check if Stripe client is available
  if (!stripe) {
    throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
      message: "Stripe is not configured",
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?canceled=true`,
    subscription_data: {
      metadata: subscriptionMetadata,
    },
  });

  if (!session.url) {
    throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
      message: "Failed to create checkout session",
    });
  }

  return session.url;
};
