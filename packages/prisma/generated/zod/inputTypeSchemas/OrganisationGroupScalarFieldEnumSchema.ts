import { z } from 'zod';

export const OrganisationGroupScalarFieldEnumSchema = z.enum(['id','name','type','organisationRole','organisationId']);

export default OrganisationGroupScalarFieldEnumSchema;
