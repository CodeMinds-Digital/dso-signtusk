import { z } from 'zod';
import { OrganisationGroupTypeSchema } from '../inputTypeSchemas/OrganisationGroupTypeSchema'
import { OrganisationMemberRoleSchema } from '../inputTypeSchemas/OrganisationMemberRoleSchema'

/////////////////////////////////////////
// ORGANISATION GROUP SCHEMA
/////////////////////////////////////////

export const OrganisationGroupSchema = z.object({
  type: OrganisationGroupTypeSchema,
  organisationRole: OrganisationMemberRoleSchema,
  id: z.string(),
  name: z.string().nullable(),
  organisationId: z.string(),
})

export type OrganisationGroup = z.infer<typeof OrganisationGroupSchema>

export default OrganisationGroupSchema;
