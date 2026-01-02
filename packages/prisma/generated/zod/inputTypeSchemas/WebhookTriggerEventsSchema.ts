import { z } from 'zod';

export const WebhookTriggerEventsSchema = z.enum(['DOCUMENT_CREATED','DOCUMENT_SENT','DOCUMENT_OPENED','DOCUMENT_SIGNED','DOCUMENT_COMPLETED','DOCUMENT_REJECTED','DOCUMENT_CANCELLED']);

export type WebhookTriggerEventsType = `${z.infer<typeof WebhookTriggerEventsSchema>}`

export default WebhookTriggerEventsSchema;
