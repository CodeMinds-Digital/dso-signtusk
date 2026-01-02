import { z } from 'zod';

export const DocumentDataTypeSchema = z.enum(['S3_PATH','BYTES','BYTES_64']);

export type DocumentDataTypeType = `${z.infer<typeof DocumentDataTypeSchema>}`

export default DocumentDataTypeSchema;
