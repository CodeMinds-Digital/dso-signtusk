import { z } from 'zod';
import { EmailDomainStatusSchema } from '../inputTypeSchemas/EmailDomainStatusSchema'

/////////////////////////////////////////
// EMAIL DOMAIN SCHEMA
/////////////////////////////////////////

export const EmailDomainSchema = z.object({
  status: EmailDomainStatusSchema,
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  selector: z.string(),
  domain: z.string(),
  publicKey: z.string(),
  privateKey: z.string(),
  organisationId: z.string(),
})

export type EmailDomain = z.infer<typeof EmailDomainSchema>

export default EmailDomainSchema;
