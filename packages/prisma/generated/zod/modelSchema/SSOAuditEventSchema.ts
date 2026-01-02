import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { SSOAuditEventTypeSchema } from '../inputTypeSchemas/SSOAuditEventTypeSchema'

/////////////////////////////////////////
// SSO AUDIT EVENT SCHEMA
/////////////////////////////////////////

export const SSOAuditEventSchema = z.object({
  event: SSOAuditEventTypeSchema,
  id: z.string(),
  organisationId: z.string(),
  ssoConfigId: z.string().nullable(),
  userId: z.number().nullable(),
  details: JsonValueSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  timestamp: z.coerce.date(),
})

export type SSOAuditEvent = z.infer<typeof SSOAuditEventSchema>

export default SSOAuditEventSchema;
