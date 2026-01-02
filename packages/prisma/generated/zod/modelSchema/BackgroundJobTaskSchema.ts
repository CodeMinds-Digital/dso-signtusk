import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { BackgroundJobTaskStatusSchema } from '../inputTypeSchemas/BackgroundJobTaskStatusSchema'

/////////////////////////////////////////
// BACKGROUND JOB TASK SCHEMA
/////////////////////////////////////////

export const BackgroundJobTaskSchema = z.object({
  status: BackgroundJobTaskStatusSchema,
  id: z.string(),
  name: z.string(),
  result: JsonValueSchema.nullable(),
  retried: z.number(),
  maxRetries: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
  jobId: z.string(),
})

export type BackgroundJobTask = z.infer<typeof BackgroundJobTaskSchema>

export default BackgroundJobTaskSchema;
