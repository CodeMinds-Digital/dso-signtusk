import { stripe } from "@signtusk/lib/server-only/stripe";

type CreateCustomerOptions = {
  name: string;
  email: string;
};

export const createCustomer = async ({
  name,
  email,
}: CreateCustomerOptions) => {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set NEXT_PRIVATE_STRIPE_API_KEY environment variable."
    );
  }

  return await stripe.customers.create({
    name,
    email,
  });
};
