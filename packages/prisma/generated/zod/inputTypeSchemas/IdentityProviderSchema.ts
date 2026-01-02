import { z } from 'zod';

export const IdentityProviderSchema = z.enum(['DOCUMENSO','GOOGLE','OIDC']);

export type IdentityProviderType = `${z.infer<typeof IdentityProviderSchema>}`

export default IdentityProviderSchema;
