import { z } from 'zod';

export const TemplateTypeSchema = z.enum(['PUBLIC','PRIVATE']);

export type TemplateTypeType = `${z.infer<typeof TemplateTypeSchema>}`

export default TemplateTypeSchema;
