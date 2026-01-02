import { z } from 'zod';

export const UserSecurityAuditLogTypeSchema = z.enum(['ACCOUNT_PROFILE_UPDATE','ACCOUNT_SSO_LINK','ACCOUNT_SSO_UNLINK','ORGANISATION_SSO_LINK','ORGANISATION_SSO_UNLINK','AUTH_2FA_DISABLE','AUTH_2FA_ENABLE','PASSKEY_CREATED','PASSKEY_DELETED','PASSKEY_UPDATED','PASSWORD_RESET','PASSWORD_UPDATE','SESSION_REVOKED','SIGN_OUT','SIGN_IN','SIGN_IN_FAIL','SIGN_IN_2FA_FAIL','SIGN_IN_PASSKEY_FAIL']);

export type UserSecurityAuditLogTypeType = `${z.infer<typeof UserSecurityAuditLogTypeSchema>}`

export default UserSecurityAuditLogTypeSchema;
