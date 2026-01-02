import { z } from 'zod';

/////////////////////////////////////////
// ORGANISATION MEMBER SCHEMA
/////////////////////////////////////////

export const OrganisationMemberSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  userId: z.number(),
  organisationId: z.string(),
})

export type OrganisationMember = z.infer<typeof OrganisationMemberSchema>

export default OrganisationMemberSchema;
