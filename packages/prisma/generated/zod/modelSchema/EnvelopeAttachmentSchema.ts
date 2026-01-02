import { z } from 'zod';
import { ZEnvelopeAttachmentTypeSchema } from '@signtusk/lib/types/envelope-attachment';

/////////////////////////////////////////
// ENVELOPE ATTACHMENT SCHEMA
/////////////////////////////////////////

export const EnvelopeAttachmentSchema = z.object({
  id: z.string(),
  /**
   * [EnvelopeAttachmentType]
   */
  type: ZEnvelopeAttachmentTypeSchema,
  label: z.string(),
  data: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  envelopeId: z.string(),
})

export type EnvelopeAttachment = z.infer<typeof EnvelopeAttachmentSchema>

/////////////////////////////////////////
// ENVELOPE ATTACHMENT CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const EnvelopeAttachmentCustomValidatorsSchema = EnvelopeAttachmentSchema

export type EnvelopeAttachmentCustomValidators = z.infer<typeof EnvelopeAttachmentCustomValidatorsSchema>

export default EnvelopeAttachmentSchema;
