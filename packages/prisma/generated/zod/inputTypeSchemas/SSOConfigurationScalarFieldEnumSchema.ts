import { z } from 'zod';

export const SSOConfigurationScalarFieldEnumSchema = z.enum(['id','organisationId','name','description','provider','domains','isDefault','status','config','createdBy','createdAt','updatedAt','lastUsed','organisationAuthenticationPortalId']);

export default SSOConfigurationScalarFieldEnumSchema;
