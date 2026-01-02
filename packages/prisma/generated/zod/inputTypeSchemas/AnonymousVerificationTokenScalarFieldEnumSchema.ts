import { z } from 'zod';

export const AnonymousVerificationTokenScalarFieldEnumSchema = z.enum(['id','token','expiresAt','createdAt']);

export default AnonymousVerificationTokenScalarFieldEnumSchema;
