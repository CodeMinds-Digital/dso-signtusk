import type { Stripe } from "@signtusk/lib/server-only/stripe";
import { stripe } from "@signtusk/lib/server-only/stripe";

export const isPriceSeatsBased = async (priceId: string) => {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set NEXT_PRIVATE_STRIPE_API_KEY environment variable."
    );
  }

  const foundStripePrice = await stripe.prices.retrieve(priceId, {
    expand: ["product"],
  });

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const product = foundStripePrice.product as Stripe.Product;

  return product.metadata.isSeatBased === "true";
};
