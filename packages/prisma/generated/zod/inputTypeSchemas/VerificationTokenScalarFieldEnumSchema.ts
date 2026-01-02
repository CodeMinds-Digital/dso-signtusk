import { z } from 'zod';

export const VerificationTokenScalarFieldEnumSchema = z.enum(['id','secondaryId','identifier','token','completed','expires','createdAt','metadata','userId']);

export default VerificationTokenScalarFieldEnumSchema;
