import { z } from 'zod';
import { UserSecurityAuditLogTypeSchema } from '../inputTypeSchemas/UserSecurityAuditLogTypeSchema'

/////////////////////////////////////////
// USER SECURITY AUDIT LOG SCHEMA
/////////////////////////////////////////

export const UserSecurityAuditLogSchema = z.object({
  type: UserSecurityAuditLogTypeSchema,
  id: z.number(),
  userId: z.number(),
  createdAt: z.coerce.date(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
})

export type UserSecurityAuditLog = z.infer<typeof UserSecurityAuditLogSchema>

export default UserSecurityAuditLogSchema;
