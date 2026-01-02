import { z } from "zod";

// Browser-safe InputJsonValue type (equivalent to Prisma.InputJsonValue)
type InputJsonValue =
  | string
  | number
  | boolean
  | { toJSON: () => unknown }
  | { [key: string]: InputJsonValue | null }
  | (InputJsonValue | null)[];

export const InputJsonValueSchema: z.ZodType<InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(
      z.string(),
      z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))
    ),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

export default InputJsonValueSchema;
