import { z } from 'zod';

export const ApiTokenScalarFieldEnumSchema = z.enum(['id','name','token','algorithm','expires','createdAt','userId','teamId']);

export default ApiTokenScalarFieldEnumSchema;
