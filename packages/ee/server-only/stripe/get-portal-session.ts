import { stripe } from "@signtusk/lib/server-only/stripe";

export type GetPortalSessionOptions = {
  customerId: string;
  returnUrl?: string;
};

export const getPortalSession = async ({
  customerId,
  returnUrl,
}: GetPortalSessionOptions) => {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set NEXT_PRIVATE_STRIPE_API_KEY environment variable."
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
};
