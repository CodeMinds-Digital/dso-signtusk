import { z } from 'zod';

export const TeamMemberRoleSchema = z.enum(['ADMIN','MANAGER','MEMBER']);

export type TeamMemberRoleType = `${z.infer<typeof TeamMemberRoleSchema>}`

export default TeamMemberRoleSchema;
