import { stripe } from "@signtusk/lib/server-only/stripe";

type UpdateCustomerOptions = {
  customerId: string;
  name?: string;
  email?: string;
};

export const updateCustomer = async ({
  customerId,
  name,
  email,
}: UpdateCustomerOptions) => {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set NEXT_PRIVATE_STRIPE_API_KEY environment variable."
    );
  }

  if (!name && !email) {
    return;
  }

  return await stripe.customers.update(customerId, {
    name,
    email,
  });
};
