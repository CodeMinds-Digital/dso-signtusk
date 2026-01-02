import { z } from 'zod';

export const EnvelopeItemScalarFieldEnumSchema = z.enum(['id','title','order','documentDataId','envelopeId']);

export default EnvelopeItemScalarFieldEnumSchema;
