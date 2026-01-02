import { z } from 'zod';

export const PasswordResetTokenScalarFieldEnumSchema = z.enum(['id','token','createdAt','expiry','userId']);

export default PasswordResetTokenScalarFieldEnumSchema;
