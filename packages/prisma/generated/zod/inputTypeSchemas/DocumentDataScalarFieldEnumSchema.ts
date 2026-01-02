import { z } from 'zod';

export const DocumentDataScalarFieldEnumSchema = z.enum(['id','type','data','initialData']);

export default DocumentDataScalarFieldEnumSchema;
