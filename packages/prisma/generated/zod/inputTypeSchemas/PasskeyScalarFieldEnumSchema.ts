import { z } from 'zod';

export const PasskeyScalarFieldEnumSchema = z.enum(['id','userId','name','createdAt','updatedAt','lastUsedAt','credentialId','credentialPublicKey','counter','credentialDeviceType','credentialBackedUp','transports']);

export default PasskeyScalarFieldEnumSchema;
