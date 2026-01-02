import { z } from 'zod';

export const OrganisationMemberScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','userId','organisationId']);

export default OrganisationMemberScalarFieldEnumSchema;
