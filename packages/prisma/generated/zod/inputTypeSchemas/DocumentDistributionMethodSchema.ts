import { z } from 'zod';

export const DocumentDistributionMethodSchema = z.enum(['EMAIL','NONE']);

export type DocumentDistributionMethodType = `${z.infer<typeof DocumentDistributionMethodSchema>}`

export default DocumentDistributionMethodSchema;
