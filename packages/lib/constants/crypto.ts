import { env } from "../utils/env";

export const SIGNTUSK_ENCRYPTION_KEY = env("NEXT_PRIVATE_ENCRYPTION_KEY");

export const SIGNTUSK_ENCRYPTION_SECONDARY_KEY = env(
  "NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY"
);

// if (typeof window === 'undefined') {
//   if (!SIGNTUSK_ENCRYPTION_KEY || !SIGNTUSK_ENCRYPTION_SECONDARY_KEY) {
//     throw new Error('Missing SIGNTUSK_ENCRYPTION_KEY or SIGNTUSK_ENCRYPTION_SECONDARY_KEY keys');
//   }

//   if (SIGNTUSK_ENCRYPTION_KEY === SIGNTUSK_ENCRYPTION_SECONDARY_KEY) {
//     throw new Error(
//       'SIGNTUSK_ENCRYPTION_KEY and SIGNTUSK_ENCRYPTION_SECONDARY_KEY cannot be equal',
//     );
//   }
// }

// if (SIGNTUSK_ENCRYPTION_KEY === 'CAFEBABE') {
//   console.warn('*********************************************************************');
//   console.warn('*');
//   console.warn('*');
//   console.warn('Please change the encryption key from the default value of "CAFEBABE"');
//   console.warn('*');
//   console.warn('*');
//   console.warn('*********************************************************************');
// }
