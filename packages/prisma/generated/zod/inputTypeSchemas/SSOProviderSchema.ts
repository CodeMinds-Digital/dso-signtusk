import { z } from 'zod';

export const SSOProviderSchema = z.enum(['SAML2','OIDC']);

export type SSOProviderType = `${z.infer<typeof SSOProviderSchema>}`

export default SSOProviderSchema;
