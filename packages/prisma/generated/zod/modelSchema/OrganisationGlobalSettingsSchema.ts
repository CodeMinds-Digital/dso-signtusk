import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { DocumentVisibilitySchema } from '../inputTypeSchemas/DocumentVisibilitySchema'
import { ZDocumentEmailSettingsSchema } from '@signtusk/lib/types/document-email';

/////////////////////////////////////////
// ORGANISATION GLOBAL SETTINGS SCHEMA
/////////////////////////////////////////

export const OrganisationGlobalSettingsSchema = z.object({
  documentVisibility: DocumentVisibilitySchema,
  id: z.string(),
  documentLanguage: z.string(),
  includeSenderDetails: z.boolean(),
  includeSigningCertificate: z.boolean(),
  includeAuditLog: z.boolean(),
  documentTimezone: z.string().nullable(),
  documentDateFormat: z.string(),
  typedSignatureEnabled: z.boolean(),
  uploadSignatureEnabled: z.boolean(),
  drawSignatureEnabled: z.boolean(),
  emailId: z.string().nullable(),
  emailReplyTo: z.string().nullable(),
  /**
   * [DocumentEmailSettings]
   */
  emailDocumentSettings: ZDocumentEmailSettingsSchema,
  brandingEnabled: z.boolean(),
  brandingLogo: z.string(),
  brandingUrl: z.string(),
  brandingCompanyDetails: z.string(),
  aiFeaturesEnabled: z.boolean(),
})

export type OrganisationGlobalSettings = z.infer<typeof OrganisationGlobalSettingsSchema>

/////////////////////////////////////////
// ORGANISATION GLOBAL SETTINGS CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const OrganisationGlobalSettingsCustomValidatorsSchema = OrganisationGlobalSettingsSchema

export type OrganisationGlobalSettingsCustomValidators = z.infer<typeof OrganisationGlobalSettingsCustomValidatorsSchema>

export default OrganisationGlobalSettingsSchema;
