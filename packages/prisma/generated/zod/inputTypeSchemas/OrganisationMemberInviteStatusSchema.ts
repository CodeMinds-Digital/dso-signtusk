import { z } from 'zod';

export const OrganisationMemberInviteStatusSchema = z.enum(['ACCEPTED','PENDING','DECLINED']);

export type OrganisationMemberInviteStatusType = `${z.infer<typeof OrganisationMemberInviteStatusSchema>}`

export default OrganisationMemberInviteStatusSchema;
