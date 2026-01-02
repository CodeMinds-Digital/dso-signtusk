import { z } from 'zod';

/////////////////////////////////////////
// ORGANISATION GROUP MEMBER SCHEMA
/////////////////////////////////////////

export const OrganisationGroupMemberSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  organisationMemberId: z.string(),
})

export type OrganisationGroupMember = z.infer<typeof OrganisationGroupMemberSchema>

export default OrganisationGroupMemberSchema;
