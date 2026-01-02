import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { RecipientRoleSchema } from '../inputTypeSchemas/RecipientRoleSchema'
import { ReadStatusSchema } from '../inputTypeSchemas/ReadStatusSchema'
import { SigningStatusSchema } from '../inputTypeSchemas/SigningStatusSchema'
import { SendStatusSchema } from '../inputTypeSchemas/SendStatusSchema'
import { ZRecipientAuthOptionsSchema } from '@signtusk/lib/types/document-auth';

/////////////////////////////////////////
// RECIPIENT SCHEMA
/////////////////////////////////////////

export const RecipientSchema = z.object({
  role: RecipientRoleSchema,
  readStatus: ReadStatusSchema,
  signingStatus: SigningStatusSchema,
  sendStatus: SendStatusSchema,
  id: z.number(),
  envelopeId: z.string(),
  email: z.string(),
  name: z.string(),
  token: z.string(),
  documentDeletedAt: z.coerce.date().nullable(),
  expired: z.coerce.date().nullable(),
  signedAt: z.coerce.date().nullable(),
  /**
   * [RecipientAuthOptions]
   */
  authOptions: ZRecipientAuthOptionsSchema.nullable(),
  signingOrder: z.number().describe("The order in which the recipient should sign the document. Only works if the document is set to sequential signing.").nullable(),
  rejectionReason: z.string().nullable(),
})

export type Recipient = z.infer<typeof RecipientSchema>

/////////////////////////////////////////
// RECIPIENT CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const RecipientCustomValidatorsSchema = RecipientSchema

export type RecipientCustomValidators = z.infer<typeof RecipientCustomValidatorsSchema>

export default RecipientSchema;
