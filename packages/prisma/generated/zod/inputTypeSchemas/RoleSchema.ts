import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN','USER']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export default RoleSchema;
