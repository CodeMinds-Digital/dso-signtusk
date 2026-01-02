import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { DocumentSigningOrderSchema } from '../inputTypeSchemas/DocumentSigningOrderSchema'
import { DocumentDistributionMethodSchema } from '../inputTypeSchemas/DocumentDistributionMethodSchema'
import { ZDocumentEmailSettingsSchema } from '@signtusk/lib/types/document-email';

/////////////////////////////////////////
// DOCUMENT META SCHEMA
/////////////////////////////////////////

export const DocumentMetaSchema = z.object({
  signingOrder: DocumentSigningOrderSchema,
  distributionMethod: DocumentDistributionMethodSchema,
  id: z.string(),
  subject: z.string().nullable(),
  message: z.string().nullable(),
  timezone: z.string().nullable(),
  dateFormat: z.string().nullable(),
  redirectUrl: z.string().nullable(),
  allowDictateNextSigner: z.boolean(),
  typedSignatureEnabled: z.boolean(),
  uploadSignatureEnabled: z.boolean(),
  drawSignatureEnabled: z.boolean(),
  language: z.string(),
  /**
   * [DocumentEmailSettings]
   */
  emailSettings: ZDocumentEmailSettingsSchema.nullable(),
  emailReplyTo: z.string().nullable(),
  emailId: z.string().nullable(),
})

export type DocumentMeta = z.infer<typeof DocumentMetaSchema>

/////////////////////////////////////////
// DOCUMENT META CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const DocumentMetaCustomValidatorsSchema = DocumentMetaSchema

export type DocumentMetaCustomValidators = z.infer<typeof DocumentMetaCustomValidatorsSchema>

export default DocumentMetaSchema;
