import { stripe } from "@signtusk/lib/server-only/stripe";

export const getStripeCustomerById = async (stripeCustomerId: string) => {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set NEXT_PRIVATE_STRIPE_API_KEY environment variable."
    );
  }

  try {
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

    return !stripeCustomer.deleted ? stripeCustomer : null;
  } catch {
    return null;
  }
};
