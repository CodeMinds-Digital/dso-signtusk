import { z } from 'zod';

export const DocumentSourceSchema = z.enum(['DOCUMENT','TEMPLATE','TEMPLATE_DIRECT_LINK']);

export type DocumentSourceType = `${z.infer<typeof DocumentSourceSchema>}`

export default DocumentSourceSchema;
