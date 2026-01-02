import { z } from 'zod';

export const TeamEmailVerificationScalarFieldEnumSchema = z.enum(['teamId','name','email','token','completed','expiresAt','createdAt']);

export default TeamEmailVerificationScalarFieldEnumSchema;
