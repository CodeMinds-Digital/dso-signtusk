import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { ZClaimFlagsSchema } from '@signtusk/lib/types/subscription';

/////////////////////////////////////////
// SUBSCRIPTION CLAIM SCHEMA
/////////////////////////////////////////

export const SubscriptionClaimSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  locked: z.boolean(),
  teamCount: z.number(),
  memberCount: z.number(),
  envelopeItemCount: z.number(),
  /**
   * [ClaimFlags]
   */
  flags: ZClaimFlagsSchema,
})

export type SubscriptionClaim = z.infer<typeof SubscriptionClaimSchema>

/////////////////////////////////////////
// SUBSCRIPTION CLAIM CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const SubscriptionClaimCustomValidatorsSchema = SubscriptionClaimSchema

export type SubscriptionClaimCustomValidators = z.infer<typeof SubscriptionClaimCustomValidatorsSchema>

export default SubscriptionClaimSchema;
