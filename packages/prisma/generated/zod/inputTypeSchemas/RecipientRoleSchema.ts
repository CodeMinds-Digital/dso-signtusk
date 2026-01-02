import { z } from 'zod';

export const RecipientRoleSchema = z.enum(['CC','SIGNER','VIEWER','APPROVER','ASSISTANT']);

export type RecipientRoleType = `${z.infer<typeof RecipientRoleSchema>}`

export default RecipientRoleSchema;
