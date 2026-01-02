import { z } from 'zod';

export const ReadStatusSchema = z.enum(['NOT_OPENED','OPENED']);

export type ReadStatusType = `${z.infer<typeof ReadStatusSchema>}`

export default ReadStatusSchema;
