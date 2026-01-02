import { z } from 'zod';

export const SendStatusSchema = z.enum(['NOT_SENT','SENT']);

export type SendStatusType = `${z.infer<typeof SendStatusSchema>}`

export default SendStatusSchema;
