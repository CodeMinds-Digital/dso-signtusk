import { z } from 'zod';

export const BackgroundJobStatusSchema = z.enum(['PENDING','PROCESSING','COMPLETED','FAILED']);

export type BackgroundJobStatusType = `${z.infer<typeof BackgroundJobStatusSchema>}`

export default BackgroundJobStatusSchema;
