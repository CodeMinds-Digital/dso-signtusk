import { z } from 'zod';

export const UserSecurityAuditLogScalarFieldEnumSchema = z.enum(['id','userId','createdAt','type','userAgent','ipAddress']);

export default UserSecurityAuditLogScalarFieldEnumSchema;
