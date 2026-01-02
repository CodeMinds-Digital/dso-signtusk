import { z } from 'zod';

export const WebhookScalarFieldEnumSchema = z.enum(['id','webhookUrl','eventTriggers','secret','enabled','createdAt','updatedAt','userId','teamId']);

export default WebhookScalarFieldEnumSchema;
