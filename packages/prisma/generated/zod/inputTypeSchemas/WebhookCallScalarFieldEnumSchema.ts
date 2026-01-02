import { z } from 'zod';

export const WebhookCallScalarFieldEnumSchema = z.enum(['id','status','url','event','requestBody','responseCode','responseHeaders','responseBody','createdAt','webhookId']);

export default WebhookCallScalarFieldEnumSchema;
