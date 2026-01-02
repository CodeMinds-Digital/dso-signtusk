import { z } from 'zod';

export const FieldScalarFieldEnumSchema = z.enum(['id','secondaryId','envelopeId','envelopeItemId','recipientId','type','page','positionX','positionY','width','height','customText','inserted','fieldMeta']);

export default FieldScalarFieldEnumSchema;
