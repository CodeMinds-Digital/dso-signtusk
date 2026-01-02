import { z } from 'zod';
import { DocumentVisibilitySchema } from '../inputTypeSchemas/DocumentVisibilitySchema'
import { FolderTypeSchema } from '../inputTypeSchemas/FolderTypeSchema'

/////////////////////////////////////////
// FOLDER SCHEMA
/////////////////////////////////////////

export const FolderSchema = z.object({
  visibility: DocumentVisibilitySchema,
  type: FolderTypeSchema,
  id: z.string(),
  name: z.string(),
  userId: z.number(),
  teamId: z.number(),
  pinned: z.boolean(),
  parentId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Folder = z.infer<typeof FolderSchema>

export default FolderSchema;
