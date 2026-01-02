import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'

/////////////////////////////////////////
// SITE SETTINGS SCHEMA
/////////////////////////////////////////

export const SiteSettingsSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  data: JsonValueSchema,
  lastModifiedByUserId: z.number().nullable(),
  lastModifiedAt: z.coerce.date(),
})

export type SiteSettings = z.infer<typeof SiteSettingsSchema>

export default SiteSettingsSchema;
