import { z } from 'zod';
import { WebhookTriggerEventsSchema } from '../inputTypeSchemas/WebhookTriggerEventsSchema'

/////////////////////////////////////////
// WEBHOOK SCHEMA
/////////////////////////////////////////

export const WebhookSchema = z.object({
  eventTriggers: WebhookTriggerEventsSchema.array(),
  id: z.string(),
  webhookUrl: z.string(),
  secret: z.string().nullable(),
  enabled: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  userId: z.number(),
  teamId: z.number(),
})

export type Webhook = z.infer<typeof WebhookSchema>

export default WebhookSchema;
