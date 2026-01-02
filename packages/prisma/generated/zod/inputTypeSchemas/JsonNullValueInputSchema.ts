import { z } from "zod";

// Browser-safe null value symbol (equivalent to Prisma.JsonNull)
const JsonNull = Symbol.for("prisma.jsonnull");

export const JsonNullValueInputSchema = z
  .enum(["JsonNull"])
  .transform((value) => (value === "JsonNull" ? JsonNull : value));

export { JsonNull };
