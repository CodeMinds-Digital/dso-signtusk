import { z } from 'zod';

export const DocumentAuditLogScalarFieldEnumSchema = z.enum(['id','envelopeId','createdAt','type','data','name','email','userId','userAgent','ipAddress']);

export default DocumentAuditLogScalarFieldEnumSchema;
