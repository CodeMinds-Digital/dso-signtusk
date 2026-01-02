import { z } from 'zod';

/////////////////////////////////////////
// TEAM EMAIL VERIFICATION SCHEMA
/////////////////////////////////////////

export const TeamEmailVerificationSchema = z.object({
  teamId: z.number(),
  name: z.string(),
  email: z.string(),
  token: z.string(),
  completed: z.boolean(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type TeamEmailVerification = z.infer<typeof TeamEmailVerificationSchema>

export default TeamEmailVerificationSchema;
