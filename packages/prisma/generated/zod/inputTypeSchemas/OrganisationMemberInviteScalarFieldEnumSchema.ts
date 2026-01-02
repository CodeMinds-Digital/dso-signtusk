import { z } from 'zod';

export const OrganisationMemberInviteScalarFieldEnumSchema = z.enum(['id','createdAt','email','token','status','organisationId','organisationRole']);

export default OrganisationMemberInviteScalarFieldEnumSchema;
