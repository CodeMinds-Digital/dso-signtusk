import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','password','source','signature','createdAt','updatedAt','lastSignedIn','roles','identityProvider','avatarImageId','disabled','twoFactorSecret','twoFactorEnabled','twoFactorBackupCodes','ssoProvisioned','ssoConfigId','firstName','lastName','department','title','phone']);

export default UserScalarFieldEnumSchema;
