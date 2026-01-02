import { z } from 'zod';

export const SigningStatusSchema = z.enum(['NOT_SIGNED','SIGNED','REJECTED']);

export type SigningStatusType = `${z.infer<typeof SigningStatusSchema>}`

export default SigningStatusSchema;
