import { z } from 'zod';

export const SubscriptionScalarFieldEnumSchema = z.enum(['id','status','planId','priceId','periodEnd','createdAt','updatedAt','cancelAtPeriodEnd','customerId','organisationId']);

export default SubscriptionScalarFieldEnumSchema;
