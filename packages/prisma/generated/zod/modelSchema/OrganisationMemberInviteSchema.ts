import { z } from 'zod';
import { OrganisationMemberInviteStatusSchema } from '../inputTypeSchemas/OrganisationMemberInviteStatusSchema'
import { OrganisationMemberRoleSchema } from '../inputTypeSchemas/OrganisationMemberRoleSchema'

/////////////////////////////////////////
// ORGANISATION MEMBER INVITE SCHEMA
/////////////////////////////////////////

export const OrganisationMemberInviteSchema = z.object({
  status: OrganisationMemberInviteStatusSchema,
  organisationRole: OrganisationMemberRoleSchema,
  id: z.string(),
  createdAt: z.coerce.date(),
  email: z.string(),
  token: z.string(),
  organisationId: z.string(),
})

export type OrganisationMemberInvite = z.infer<typeof OrganisationMemberInviteSchema>

export default OrganisationMemberInviteSchema;
