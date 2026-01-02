import { z } from 'zod';

export const OrganisationGlobalSettingsScalarFieldEnumSchema = z.enum(['id','documentVisibility','documentLanguage','includeSenderDetails','includeSigningCertificate','includeAuditLog','documentTimezone','documentDateFormat','typedSignatureEnabled','uploadSignatureEnabled','drawSignatureEnabled','emailId','emailReplyTo','emailDocumentSettings','brandingEnabled','brandingLogo','brandingUrl','brandingCompanyDetails','aiFeaturesEnabled']);

export default OrganisationGlobalSettingsScalarFieldEnumSchema;
