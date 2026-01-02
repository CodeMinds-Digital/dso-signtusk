import { z } from 'zod';

export const BackgroundJobTaskScalarFieldEnumSchema = z.enum(['id','name','status','result','retried','maxRetries','createdAt','updatedAt','completedAt','jobId']);

export default BackgroundJobTaskScalarFieldEnumSchema;
