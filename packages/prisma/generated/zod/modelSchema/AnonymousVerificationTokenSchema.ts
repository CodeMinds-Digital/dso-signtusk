import { z } from 'zod';

/////////////////////////////////////////
// ANONYMOUS VERIFICATION TOKEN SCHEMA
/////////////////////////////////////////

export const AnonymousVerificationTokenSchema = z.object({
  id: z.string(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type AnonymousVerificationToken = z.infer<typeof AnonymousVerificationTokenSchema>

export default AnonymousVerificationTokenSchema;
