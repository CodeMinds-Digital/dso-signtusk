import { z } from "zod";

// Browser-safe DecimalJsLike type (equivalent to Prisma.DecimalJsLike)
interface DecimalJsLike {
  d: number[];
  e: number;
  s: number;
  toFixed: () => string;
}

export const DecimalJsLikeSchema: z.ZodType<DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.any(),
});

export type { DecimalJsLike };

export default DecimalJsLikeSchema;
