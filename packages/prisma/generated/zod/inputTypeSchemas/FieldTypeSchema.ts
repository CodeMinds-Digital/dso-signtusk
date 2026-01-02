import { z } from 'zod';

export const FieldTypeSchema = z.enum(['SIGNATURE','FREE_SIGNATURE','INITIALS','NAME','EMAIL','DATE','TEXT','NUMBER','RADIO','CHECKBOX','DROPDOWN']);

export type FieldTypeType = `${z.infer<typeof FieldTypeSchema>}`

export default FieldTypeSchema;
