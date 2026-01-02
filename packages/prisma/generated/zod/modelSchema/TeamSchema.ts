import { z } from 'zod';

/////////////////////////////////////////
// TEAM SCHEMA
/////////////////////////////////////////

export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  createdAt: z.coerce.date(),
  avatarImageId: z.string().nullable(),
  organisationId: z.string(),
  teamGlobalSettingsId: z.string(),
})

export type Team = z.infer<typeof TeamSchema>

export default TeamSchema;
