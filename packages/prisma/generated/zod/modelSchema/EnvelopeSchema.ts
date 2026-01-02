import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { EnvelopeTypeSchema } from '../inputTypeSchemas/EnvelopeTypeSchema'
import { DocumentStatusSchema } from '../inputTypeSchemas/DocumentStatusSchema'
import { DocumentSourceSchema } from '../inputTypeSchemas/DocumentSourceSchema'
import { DocumentVisibilitySchema } from '../inputTypeSchemas/DocumentVisibilitySchema'
import { TemplateTypeSchema } from '../inputTypeSchemas/TemplateTypeSchema'
import { ZDocumentAuthOptionsSchema } from '@signtusk/lib/types/document-auth';
import { ZDocumentFormValuesSchema } from '@signtusk/lib/types/document-form-values';

/////////////////////////////////////////
// ENVELOPE SCHEMA
/////////////////////////////////////////

export const EnvelopeSchema = z.object({
  type: EnvelopeTypeSchema,
  status: DocumentStatusSchema,
  source: DocumentSourceSchema,
  visibility: DocumentVisibilitySchema,
  templateType: TemplateTypeSchema,
  id: z.string(),
  secondaryId: z.string(),
  externalId: z.string().describe("A custom external ID you can use to identify the document.").nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
  title: z.string(),
  qrToken: z.string().describe("The token for viewing the document using the QR code on the certificate.").nullable(),
  internalVersion: z.number(),
  useLegacyFieldInsertion: z.boolean(),
  /**
   * [DocumentAuthOptions]
   */
  authOptions: ZDocumentAuthOptionsSchema.nullable(),
  /**
   * [DocumentFormValues]
   */
  formValues: ZDocumentFormValuesSchema.nullable(),
  publicTitle: z.string(),
  publicDescription: z.string(),
  templateId: z.number().nullable(),
  userId: z.number().describe("The ID of the user that created this document."),
  teamId: z.number(),
  folderId: z.string().nullable(),
  documentMetaId: z.string(),
})

export type Envelope = z.infer<typeof EnvelopeSchema>

/////////////////////////////////////////
// ENVELOPE CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const EnvelopeCustomValidatorsSchema = EnvelopeSchema

export type EnvelopeCustomValidators = z.infer<typeof EnvelopeCustomValidatorsSchema>

export default EnvelopeSchema;
