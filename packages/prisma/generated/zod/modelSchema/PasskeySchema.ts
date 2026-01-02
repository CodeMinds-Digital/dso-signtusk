import { z } from 'zod';

/////////////////////////////////////////
// PASSKEY SCHEMA
/////////////////////////////////////////

export const PasskeySchema = z.object({
  id: z.string(),
  userId: z.number(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastUsedAt: z.coerce.date().nullable(),
  credentialId: z.instanceof(Uint8Array),
  credentialPublicKey: z.instanceof(Uint8Array),
  counter: z.bigint(),
  credentialDeviceType: z.string(),
  credentialBackedUp: z.boolean(),
  transports: z.string().array(),
})

export type Passkey = z.infer<typeof PasskeySchema>

export default PasskeySchema;
