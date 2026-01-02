import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { WebhookCallStatusSchema } from '../inputTypeSchemas/WebhookCallStatusSchema'
import { WebhookTriggerEventsSchema } from '../inputTypeSchemas/WebhookTriggerEventsSchema'

/////////////////////////////////////////
// WEBHOOK CALL SCHEMA
/////////////////////////////////////////

export const WebhookCallSchema = z.object({
  status: WebhookCallStatusSchema,
  event: WebhookTriggerEventsSchema,
  id: z.string(),
  url: z.string(),
  requestBody: JsonValueSchema,
  responseCode: z.number(),
  responseHeaders: JsonValueSchema.nullable(),
  responseBody: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  webhookId: z.string(),
})

export type WebhookCall = z.infer<typeof WebhookCallSchema>

export default WebhookCallSchema;
