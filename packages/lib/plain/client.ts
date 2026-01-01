import { PlainClient } from "@team-plain/typescript-sdk";

import { env } from "@signtusk/lib/utils/env";

// Create Plain client only if API key is provided
const plainApiKey = env("NEXT_PRIVATE_PLAIN_API_KEY");

export const plainClient = plainApiKey
  ? new PlainClient({ apiKey: plainApiKey })
  : null;
