import { z } from 'zod';

export const TeamGlobalSettingsScalarFieldEnumSchema = z.enum(['id','documentVisibility','documentLanguage','documentTimezone','documentDateFormat','includeSenderDetails','includeSigningCertificate','includeAuditLog','typedSignatureEnabled','uploadSignatureEnabled','drawSignatureEnabled','emailId','emailReplyTo','emailDocumentSettings','brandingEnabled','brandingLogo','brandingUrl','brandingCompanyDetails','aiFeaturesEnabled']);

export default TeamGlobalSettingsScalarFieldEnumSchema;
