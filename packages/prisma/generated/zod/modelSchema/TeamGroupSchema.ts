import { z } from 'zod';
import { TeamMemberRoleSchema } from '../inputTypeSchemas/TeamMemberRoleSchema'

/////////////////////////////////////////
// TEAM GROUP SCHEMA
/////////////////////////////////////////

export const TeamGroupSchema = z.object({
  teamRole: TeamMemberRoleSchema,
  id: z.string(),
  organisationGroupId: z.string(),
  teamId: z.number(),
})

export type TeamGroup = z.infer<typeof TeamGroupSchema>

export default TeamGroupSchema;
