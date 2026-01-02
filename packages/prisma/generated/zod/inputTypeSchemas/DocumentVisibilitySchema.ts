import { z } from 'zod';

export const DocumentVisibilitySchema = z.enum(['EVERYONE','MANAGER_AND_ABOVE','ADMIN']);

export type DocumentVisibilityType = `${z.infer<typeof DocumentVisibilitySchema>}`

export default DocumentVisibilitySchema;
