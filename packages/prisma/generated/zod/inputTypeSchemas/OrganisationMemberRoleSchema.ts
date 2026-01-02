import { z } from 'zod';

export const OrganisationMemberRoleSchema = z.enum(['ADMIN','MANAGER','MEMBER']);

export type OrganisationMemberRoleType = `${z.infer<typeof OrganisationMemberRoleSchema>}`

export default OrganisationMemberRoleSchema;
