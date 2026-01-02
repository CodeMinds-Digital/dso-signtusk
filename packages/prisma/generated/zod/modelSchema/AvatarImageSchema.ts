import { z } from 'zod';

/////////////////////////////////////////
// AVATAR IMAGE SCHEMA
/////////////////////////////////////////

export const AvatarImageSchema = z.object({
  id: z.string(),
  bytes: z.string(),
})

export type AvatarImage = z.infer<typeof AvatarImageSchema>

export default AvatarImageSchema;
