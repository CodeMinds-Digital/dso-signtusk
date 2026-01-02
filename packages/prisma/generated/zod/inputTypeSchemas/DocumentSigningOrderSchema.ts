import { z } from 'zod';

export const DocumentSigningOrderSchema = z.enum(['PARALLEL','SEQUENTIAL']);

export type DocumentSigningOrderType = `${z.infer<typeof DocumentSigningOrderSchema>}`

export default DocumentSigningOrderSchema;
