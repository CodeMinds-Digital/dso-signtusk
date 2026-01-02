import { z } from 'zod';

/////////////////////////////////////////
// TEMPLATE DIRECT LINK SCHEMA
/////////////////////////////////////////

export const TemplateDirectLinkSchema = z.object({
  id: z.string(),
  envelopeId: z.string(),
  token: z.string(),
  createdAt: z.coerce.date(),
  enabled: z.boolean(),
  directTemplateRecipientId: z.number(),
})

export type TemplateDirectLink = z.infer<typeof TemplateDirectLinkSchema>

export default TemplateDirectLinkSchema;
