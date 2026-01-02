import { z } from 'zod';

export const SSOConfigStatusSchema = z.enum(['DRAFT','ACTIVE','INACTIVE','ERROR']);

export type SSOConfigStatusType = `${z.infer<typeof SSOConfigStatusSchema>}`

export default SSOConfigStatusSchema;
