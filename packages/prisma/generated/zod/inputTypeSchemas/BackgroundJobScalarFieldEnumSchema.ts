import { z } from 'zod';

export const BackgroundJobScalarFieldEnumSchema = z.enum(['id','status','payload','retried','maxRetries','jobId','name','version','submittedAt','updatedAt','completedAt','lastRetriedAt']);

export default BackgroundJobScalarFieldEnumSchema;
