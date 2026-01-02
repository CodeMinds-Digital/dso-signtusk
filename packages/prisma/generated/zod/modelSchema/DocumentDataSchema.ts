import { z } from 'zod';
import { DocumentDataTypeSchema } from '../inputTypeSchemas/DocumentDataTypeSchema'

/////////////////////////////////////////
// DOCUMENT DATA SCHEMA
/////////////////////////////////////////

export const DocumentDataSchema = z.object({
  type: DocumentDataTypeSchema,
  id: z.string(),
  data: z.string(),
  initialData: z.string(),
})

export type DocumentData = z.infer<typeof DocumentDataSchema>

export default DocumentDataSchema;
