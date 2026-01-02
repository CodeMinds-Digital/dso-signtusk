import { z } from 'zod';
import { RoleSchema } from '../inputTypeSchemas/RoleSchema'
import { IdentityProviderSchema } from '../inputTypeSchemas/IdentityProviderSchema'

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  roles: RoleSchema.array(),
  identityProvider: IdentityProviderSchema,
  id: z.number(),
  name: z.string().nullable(),
  email: z.string(),
  emailVerified: z.coerce.date().nullable(),
  password: z.string().nullable(),
  source: z.string().nullable(),
  signature: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastSignedIn: z.coerce.date(),
  avatarImageId: z.string().nullable(),
  disabled: z.boolean(),
  twoFactorSecret: z.string().nullable(),
  twoFactorEnabled: z.boolean(),
  twoFactorBackupCodes: z.string().nullable(),
  ssoProvisioned: z.boolean(),
  ssoConfigId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  department: z.string().nullable(),
  title: z.string().nullable(),
  phone: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

export default UserSchema;
