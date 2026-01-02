import { z } from 'zod';
import { SubscriptionStatusSchema } from '../inputTypeSchemas/SubscriptionStatusSchema'

/////////////////////////////////////////
// SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const SubscriptionSchema = z.object({
  status: SubscriptionStatusSchema,
  id: z.number(),
  planId: z.string(),
  priceId: z.string(),
  periodEnd: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  customerId: z.string(),
  organisationId: z.string(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>

export default SubscriptionSchema;
