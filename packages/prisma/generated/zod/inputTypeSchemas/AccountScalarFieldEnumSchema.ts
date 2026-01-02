import { z } from 'zod';

export const AccountScalarFieldEnumSchema = z.enum(['id','createdAt','userId','type','provider','providerAccountId','refresh_token','access_token','expires_at','created_at','ext_expires_in','token_type','scope','id_token','session_state','password']);

export default AccountScalarFieldEnumSchema;
