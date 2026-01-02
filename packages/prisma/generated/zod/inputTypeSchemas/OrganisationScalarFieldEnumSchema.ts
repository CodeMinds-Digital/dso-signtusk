import { z } from 'zod';

export const OrganisationScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','type','name','url','avatarImageId','customerId','organisationClaimId','ownerUserId','organisationGlobalSettingsId','organisationAuthenticationPortalId']);

export default OrganisationScalarFieldEnumSchema;
