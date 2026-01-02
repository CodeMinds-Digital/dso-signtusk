import { z } from 'zod';

export const TeamProfileScalarFieldEnumSchema = z.enum(['id','enabled','teamId','bio']);

export default TeamProfileScalarFieldEnumSchema;
