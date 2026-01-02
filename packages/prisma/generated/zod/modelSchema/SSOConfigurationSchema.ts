import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { SSOProviderSchema } from '../inputTypeSchemas/SSOProviderSchema'
import { SSOConfigStatusSchema } from '../inputTypeSchemas/SSOConfigStatusSchema'

/////////////////////////////////////////
// SSO CONFIGURATION SCHEMA
/////////////////////////////////////////

export const SSOConfigurationSchema = z.object({
  provider: SSOProviderSchema,
  status: SSOConfigStatusSchema,
  id: z.string(),
  organisationId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  domains: z.string().array(),
  isDefault: z.boolean(),
  config: JsonValueSchema,
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastUsed: z.coerce.date().nullable(),
  organisationAuthenticationPortalId: z.string(),
})

export type SSOConfiguration = z.infer<typeof SSOConfigurationSchema>

export default SSOConfigurationSchema;
