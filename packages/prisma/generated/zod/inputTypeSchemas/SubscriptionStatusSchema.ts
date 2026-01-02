import { z } from 'zod';

export const SubscriptionStatusSchema = z.enum(['ACTIVE','PAST_DUE','INACTIVE']);

export type SubscriptionStatusType = `${z.infer<typeof SubscriptionStatusSchema>}`

export default SubscriptionStatusSchema;
