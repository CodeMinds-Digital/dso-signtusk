import { z } from 'zod';

export const EnvelopeScalarFieldEnumSchema = z.enum(['id','secondaryId','externalId','type','createdAt','updatedAt','completedAt','deletedAt','title','status','source','qrToken','internalVersion','useLegacyFieldInsertion','authOptions','formValues','visibility','templateType','publicTitle','publicDescription','templateId','userId','teamId','folderId','documentMetaId']);

export default EnvelopeScalarFieldEnumSchema;
