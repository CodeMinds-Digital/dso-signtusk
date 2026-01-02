import { z } from 'zod';

export const SiteSettingsScalarFieldEnumSchema = z.enum(['id','enabled','data','lastModifiedByUserId','lastModifiedAt']);

export default SiteSettingsScalarFieldEnumSchema;
