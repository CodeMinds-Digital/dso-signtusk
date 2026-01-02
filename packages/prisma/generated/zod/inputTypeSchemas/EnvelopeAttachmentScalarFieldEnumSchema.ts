import { z } from 'zod';

export const EnvelopeAttachmentScalarFieldEnumSchema = z.enum(['id','type','label','data','createdAt','updatedAt','envelopeId']);

export default EnvelopeAttachmentScalarFieldEnumSchema;
