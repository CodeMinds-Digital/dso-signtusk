import { z } from 'zod';

export const TeamGroupScalarFieldEnumSchema = z.enum(['id','organisationGroupId','teamRole','teamId']);

export default TeamGroupScalarFieldEnumSchema;
