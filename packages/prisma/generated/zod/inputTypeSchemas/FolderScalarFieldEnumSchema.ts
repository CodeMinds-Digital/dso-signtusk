import { z } from 'zod';

export const FolderScalarFieldEnumSchema = z.enum(['id','name','userId','teamId','pinned','parentId','createdAt','updatedAt','visibility','type']);

export default FolderScalarFieldEnumSchema;
