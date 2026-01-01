import { stripe } from "@signtusk/lib/server-only/stripe";

export type GetInvoicesOptions = {
  customerId: string;
};

export const getInvoices = async ({ customerId }: GetInvoicesOptions) => {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set NEXT_PRIVATE_STRIPE_API_KEY environment variable."
    );
  }

  return await stripe.invoices.list({
    customer: customerId,
  });
};
