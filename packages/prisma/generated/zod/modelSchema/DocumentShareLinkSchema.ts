import { z } from 'zod';

/////////////////////////////////////////
// DOCUMENT SHARE LINK SCHEMA
/////////////////////////////////////////

export const DocumentShareLinkSchema = z.object({
  id: z.number(),
  email: z.string(),
  slug: z.string(),
  envelopeId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DocumentShareLink = z.infer<typeof DocumentShareLinkSchema>

export default DocumentShareLinkSchema;
