import { z } from 'zod';
import { ApiTokenAlgorithmSchema } from '../inputTypeSchemas/ApiTokenAlgorithmSchema'

/////////////////////////////////////////
// API TOKEN SCHEMA
/////////////////////////////////////////

export const ApiTokenSchema = z.object({
  algorithm: ApiTokenAlgorithmSchema,
  id: z.number(),
  name: z.string(),
  token: z.string(),
  expires: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  userId: z.number().nullable(),
  teamId: z.number(),
})

export type ApiToken = z.infer<typeof ApiTokenSchema>

export default ApiTokenSchema;
