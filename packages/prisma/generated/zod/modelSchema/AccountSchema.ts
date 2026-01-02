import { z } from 'zod';

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  userId: z.number(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().nullable(),
  access_token: z.string().nullable(),
  expires_at: z.number().nullable(),
  created_at: z.number().nullable(),
  ext_expires_in: z.number().nullable(),
  token_type: z.string().nullable(),
  scope: z.string().nullable(),
  id_token: z.string().nullable(),
  session_state: z.string().nullable(),
  password: z.string().nullable(),
})

export type Account = z.infer<typeof AccountSchema>

export default AccountSchema;
