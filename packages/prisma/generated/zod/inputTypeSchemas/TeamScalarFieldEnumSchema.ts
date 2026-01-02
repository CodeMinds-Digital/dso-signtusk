import { z } from 'zod';

export const TeamScalarFieldEnumSchema = z.enum(['id','name','url','createdAt','avatarImageId','organisationId','teamGlobalSettingsId']);

export default TeamScalarFieldEnumSchema;
