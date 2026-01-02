import { z } from 'zod';

/////////////////////////////////////////
// TEAM EMAIL SCHEMA
/////////////////////////////////////////

export const TeamEmailSchema = z.object({
  teamId: z.number(),
  createdAt: z.coerce.date(),
  name: z.string(),
  email: z.string(),
})

export type TeamEmail = z.infer<typeof TeamEmailSchema>

export default TeamEmailSchema;
