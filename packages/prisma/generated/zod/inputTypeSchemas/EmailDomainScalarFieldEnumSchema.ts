import { z } from 'zod';

export const EmailDomainScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','status','selector','domain','publicKey','privateKey','organisationId']);

export default EmailDomainScalarFieldEnumSchema;
