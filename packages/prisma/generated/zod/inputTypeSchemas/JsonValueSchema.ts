import { z } from "zod";

// Browser-safe JSON value schema (equivalent to Prisma.JsonValue)
// Using a simpler approach to avoid recursive type issues
export const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(
      z.string(),
      z.lazy(() => JsonValueSchema)
    ),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export default JsonValueSchema;
