import { z } from 'zod';

/////////////////////////////////////////
// PASSWORD RESET TOKEN SCHEMA
/////////////////////////////////////////

export const PasswordResetTokenSchema = z.object({
  id: z.number(),
  token: z.string(),
  createdAt: z.coerce.date(),
  expiry: z.coerce.date(),
  userId: z.number(),
})

export type PasswordResetToken = z.infer<typeof PasswordResetTokenSchema>

export default PasswordResetTokenSchema;
