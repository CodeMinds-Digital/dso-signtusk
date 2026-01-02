import { z } from 'zod';

export const SignatureScalarFieldEnumSchema = z.enum(['id','created','recipientId','fieldId','signatureImageAsBase64','typedSignature']);

export default SignatureScalarFieldEnumSchema;
