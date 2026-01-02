import { z } from 'zod';

export const OrganisationGroupTypeSchema = z.enum(['INTERNAL_ORGANISATION','INTERNAL_TEAM','CUSTOM']);

export type OrganisationGroupTypeType = `${z.infer<typeof OrganisationGroupTypeSchema>}`

export default OrganisationGroupTypeSchema;
