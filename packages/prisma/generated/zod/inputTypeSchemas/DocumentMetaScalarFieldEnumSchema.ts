import { z } from 'zod';

export const DocumentMetaScalarFieldEnumSchema = z.enum(['id','subject','message','timezone','dateFormat','redirectUrl','signingOrder','allowDictateNextSigner','typedSignatureEnabled','uploadSignatureEnabled','drawSignatureEnabled','language','distributionMethod','emailSettings','emailReplyTo','emailId']);

export default DocumentMetaScalarFieldEnumSchema;
