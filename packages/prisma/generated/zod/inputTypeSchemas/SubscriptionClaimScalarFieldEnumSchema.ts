import { z } from 'zod';

export const SubscriptionClaimScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','name','locked','teamCount','memberCount','envelopeItemCount','flags']);

export default SubscriptionClaimScalarFieldEnumSchema;
