import { z } from 'zod';

export const OrganisationEmailScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','email','emailName','emailDomainId','organisationId']);

export default OrganisationEmailScalarFieldEnumSchema;
