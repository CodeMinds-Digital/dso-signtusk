import { z } from 'zod';

/////////////////////////////////////////
// ORGANISATION EMAIL SCHEMA
/////////////////////////////////////////

export const OrganisationEmailSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  email: z.string(),
  emailName: z.string(),
  emailDomainId: z.string(),
  organisationId: z.string(),
})

export type OrganisationEmail = z.infer<typeof OrganisationEmailSchema>

export default OrganisationEmailSchema;
