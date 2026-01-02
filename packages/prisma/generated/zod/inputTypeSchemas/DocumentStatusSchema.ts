import { z } from 'zod';

export const DocumentStatusSchema = z.enum(['DRAFT','PENDING','COMPLETED','REJECTED']);

export type DocumentStatusType = `${z.infer<typeof DocumentStatusSchema>}`

export default DocumentStatusSchema;
