import { z } from 'zod';

export const SSOSessionScalarFieldEnumSchema = z.enum(['id','organisationId','ssoConfigId','userId','provider','sessionIndex','nameID','subject','createdAt','expiresAt','lastActivity']);

export default SSOSessionScalarFieldEnumSchema;
