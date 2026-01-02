import { z } from 'zod';

export const EmailDomainStatusSchema = z.enum(['PENDING','ACTIVE']);

export type EmailDomainStatusType = `${z.infer<typeof EmailDomainStatusSchema>}`

export default EmailDomainStatusSchema;
