import { z } from 'zod';

/////////////////////////////////////////
// SIGNATURE SCHEMA
/////////////////////////////////////////

export const SignatureSchema = z.object({
  id: z.number(),
  created: z.coerce.date(),
  recipientId: z.number(),
  fieldId: z.number(),
  signatureImageAsBase64: z.string().nullable(),
  typedSignature: z.string().nullable(),
})

export type Signature = z.infer<typeof SignatureSchema>

export default SignatureSchema;
