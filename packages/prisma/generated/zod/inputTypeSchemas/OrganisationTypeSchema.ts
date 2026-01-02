import { z } from 'zod';

export const OrganisationTypeSchema = z.enum(['PERSONAL','ORGANISATION']);

export type OrganisationTypeType = `${z.infer<typeof OrganisationTypeSchema>}`

export default OrganisationTypeSchema;
