import { z } from 'zod';

export const FolderTypeSchema = z.enum(['DOCUMENT','TEMPLATE']);

export type FolderTypeType = `${z.infer<typeof FolderTypeSchema>}`

export default FolderTypeSchema;
