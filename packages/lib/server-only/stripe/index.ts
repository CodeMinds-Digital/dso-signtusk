/// <reference types="./stripe.d.ts" />
import Stripe from "stripe";

import { env } from "../../utils/env";

// Create Stripe client only if API key is provided
const stripeApiKey = env("NEXT_PRIVATE_STRIPE_API_KEY");

export const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, {
      apiVersion: "2022-11-15",
      typescript: true,
    })
  : null;

export { Stripe };
