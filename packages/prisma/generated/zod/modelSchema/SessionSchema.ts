import { z } from 'zod';

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  sessionToken: z.string(),
  userId: z.number(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

export default SessionSchema;
