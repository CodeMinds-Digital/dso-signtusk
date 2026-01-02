import { z } from 'zod';

export const RecipientScalarFieldEnumSchema = z.enum(['id','envelopeId','email','name','token','documentDeletedAt','expired','signedAt','authOptions','signingOrder','rejectionReason','role','readStatus','signingStatus','sendStatus']);

export default RecipientScalarFieldEnumSchema;
