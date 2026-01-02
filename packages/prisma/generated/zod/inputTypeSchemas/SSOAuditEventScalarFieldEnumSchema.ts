import { z } from 'zod';

export const SSOAuditEventScalarFieldEnumSchema = z.enum(['id','organisationId','ssoConfigId','userId','event','details','ipAddress','userAgent','timestamp']);

export default SSOAuditEventScalarFieldEnumSchema;
