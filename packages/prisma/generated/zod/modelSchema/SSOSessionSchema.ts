import { z } from 'zod';
import { SSOProviderSchema } from '../inputTypeSchemas/SSOProviderSchema'

/////////////////////////////////////////
// SSO SESSION SCHEMA
/////////////////////////////////////////

export const SSOSessionSchema = z.object({
  provider: SSOProviderSchema,
  id: z.string(),
  organisationId: z.string(),
  ssoConfigId: z.string(),
  userId: z.number(),
  sessionIndex: z.string().nullable(),
  nameID: z.string().nullable(),
  subject: z.string().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  lastActivity: z.coerce.date(),
})

export type SSOSession = z.infer<typeof SSOSessionSchema>

export default SSOSessionSchema;
