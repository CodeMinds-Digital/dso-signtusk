import { z } from 'zod';

export const EnvelopeTypeSchema = z.enum(['DOCUMENT','TEMPLATE']);

export type EnvelopeTypeType = `${z.infer<typeof EnvelopeTypeSchema>}`

export default EnvelopeTypeSchema;
