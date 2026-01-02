import { z } from 'zod';

export const TeamEmailScalarFieldEnumSchema = z.enum(['teamId','createdAt','name','email']);

export default TeamEmailScalarFieldEnumSchema;
