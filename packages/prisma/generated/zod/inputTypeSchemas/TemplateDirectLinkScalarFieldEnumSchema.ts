import { z } from 'zod';

export const TemplateDirectLinkScalarFieldEnumSchema = z.enum(['id','envelopeId','token','createdAt','enabled','directTemplateRecipientId']);

export default TemplateDirectLinkScalarFieldEnumSchema;
