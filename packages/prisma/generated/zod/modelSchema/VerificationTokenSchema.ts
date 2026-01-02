import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'

/////////////////////////////////////////
// VERIFICATION TOKEN SCHEMA
/////////////////////////////////////////

export const VerificationTokenSchema = z.object({
  id: z.number(),
  secondaryId: z.string(),
  identifier: z.string(),
  token: z.string(),
  completed: z.boolean(),
  expires: z.coerce.date(),
  createdAt: z.coerce.date(),
  metadata: JsonValueSchema.nullable(),
  userId: z.number(),
})

export type VerificationToken = z.infer<typeof VerificationTokenSchema>

export default VerificationTokenSchema;
