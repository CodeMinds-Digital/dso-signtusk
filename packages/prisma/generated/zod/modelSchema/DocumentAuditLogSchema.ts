import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'

/////////////////////////////////////////
// DOCUMENT AUDIT LOG SCHEMA
/////////////////////////////////////////

export const DocumentAuditLogSchema = z.object({
  id: z.string(),
  envelopeId: z.string(),
  createdAt: z.coerce.date(),
  type: z.string(),
  data: JsonValueSchema,
  name: z.string().nullable(),
  email: z.string().nullable(),
  userId: z.number().nullable(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
})

export type DocumentAuditLog = z.infer<typeof DocumentAuditLogSchema>

export default DocumentAuditLogSchema;
