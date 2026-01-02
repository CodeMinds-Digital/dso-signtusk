import { z } from 'zod';

/////////////////////////////////////////
// ENVELOPE ITEM SCHEMA
/////////////////////////////////////////

export const EnvelopeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
  documentDataId: z.string(),
  envelopeId: z.string(),
})

export type EnvelopeItem = z.infer<typeof EnvelopeItemSchema>

export default EnvelopeItemSchema;
