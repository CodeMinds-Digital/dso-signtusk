import { z } from 'zod';

export const SessionScalarFieldEnumSchema = z.enum(['id','sessionToken','userId','ipAddress','userAgent','expiresAt','createdAt','updatedAt']);

export default SessionScalarFieldEnumSchema;
