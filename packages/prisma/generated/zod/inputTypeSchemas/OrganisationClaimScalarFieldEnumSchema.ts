import { z } from 'zod';

export const OrganisationClaimScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','originalSubscriptionClaimId','teamCount','memberCount','envelopeItemCount','flags']);

export default OrganisationClaimScalarFieldEnumSchema;
