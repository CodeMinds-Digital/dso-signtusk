import { z } from 'zod';

export const BackgroundJobTaskStatusSchema = z.enum(['PENDING','COMPLETED','FAILED']);

export type BackgroundJobTaskStatusType = `${z.infer<typeof BackgroundJobTaskStatusSchema>}`

export default BackgroundJobTaskStatusSchema;
