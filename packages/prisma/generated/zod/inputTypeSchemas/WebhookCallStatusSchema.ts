import { z } from 'zod';

export const WebhookCallStatusSchema = z.enum(['SUCCESS','FAILED']);

export type WebhookCallStatusType = `${z.infer<typeof WebhookCallStatusSchema>}`

export default WebhookCallStatusSchema;
