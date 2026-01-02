import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { ZClaimFlagsSchema } from '@signtusk/lib/types/subscription';

/////////////////////////////////////////
// ORGANISATION CLAIM SCHEMA
/////////////////////////////////////////

export const OrganisationClaimSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  originalSubscriptionClaimId: z.string().nullable(),
  teamCount: z.number(),
  memberCount: z.number(),
  envelopeItemCount: z.number(),
  /**
   * [ClaimFlags]
   */
  flags: ZClaimFlagsSchema,
})

export type OrganisationClaim = z.infer<typeof OrganisationClaimSchema>

/////////////////////////////////////////
// ORGANISATION CLAIM CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const OrganisationClaimCustomValidatorsSchema = OrganisationClaimSchema

export type OrganisationClaimCustomValidators = z.infer<typeof OrganisationClaimCustomValidatorsSchema>

export default OrganisationClaimSchema;
