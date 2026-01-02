import { z } from 'zod';

/////////////////////////////////////////
// TEAM PROFILE SCHEMA
/////////////////////////////////////////

export const TeamProfileSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  teamId: z.number(),
  bio: z.string().nullable(),
})

export type TeamProfile = z.infer<typeof TeamProfileSchema>

export default TeamProfileSchema;
