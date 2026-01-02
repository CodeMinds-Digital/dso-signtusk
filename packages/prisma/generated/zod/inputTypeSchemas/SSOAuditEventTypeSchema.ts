import { z } from 'zod';

export const SSOAuditEventTypeSchema = z.enum(['CONFIG_CREATED','CONFIG_UPDATED','CONFIG_DELETED','CONFIG_ACTIVATED','CONFIG_DEACTIVATED','LOGIN_INITIATED','LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT_INITIATED','LOGOUT_SUCCESS','USER_PROVISIONED','USER_UPDATED','ASSERTION_RECEIVED','TOKEN_RECEIVED']);

export type SSOAuditEventTypeType = `${z.infer<typeof SSOAuditEventTypeSchema>}`

export default SSOAuditEventTypeSchema;
