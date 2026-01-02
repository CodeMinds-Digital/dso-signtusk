import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { DocumentVisibilitySchema } from '../inputTypeSchemas/DocumentVisibilitySchema'
import { ZDocumentEmailSettingsSchema } from '@signtusk/lib/types/document-email';

/////////////////////////////////////////
// TEAM GLOBAL SETTINGS SCHEMA
/////////////////////////////////////////

export const TeamGlobalSettingsSchema = z.object({
  documentVisibility: DocumentVisibilitySchema.nullable(),
  id: z.string(),
  documentLanguage: z.string().nullable(),
  documentTimezone: z.string().nullable(),
  documentDateFormat: z.string().nullable(),
  includeSenderDetails: z.boolean().nullable(),
  includeSigningCertificate: z.boolean().nullable(),
  includeAuditLog: z.boolean().nullable(),
  typedSignatureEnabled: z.boolean().nullable(),
  uploadSignatureEnabled: z.boolean().nullable(),
  drawSignatureEnabled: z.boolean().nullable(),
  emailId: z.string().nullable(),
  emailReplyTo: z.string().nullable(),
  /**
   * [DocumentEmailSettingsNullable]
   */
  emailDocumentSettings: ZDocumentEmailSettingsSchema.nullable(),
  brandingEnabled: z.boolean().nullable(),
  brandingLogo: z.string().nullable(),
  brandingUrl: z.string().nullable(),
  brandingCompanyDetails: z.string().nullable(),
  aiFeaturesEnabled: z.boolean().nullable(),
})

export type TeamGlobalSettings = z.infer<typeof TeamGlobalSettingsSchema>

/////////////////////////////////////////
// TEAM GLOBAL SETTINGS CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const TeamGlobalSettingsCustomValidatorsSchema = TeamGlobalSettingsSchema

export type TeamGlobalSettingsCustomValidators = z.infer<typeof TeamGlobalSettingsCustomValidatorsSchema>

export default TeamGlobalSettingsSchema;
