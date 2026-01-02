import { z } from "zod";

// Browser-safe null value symbols (equivalent to Prisma.DbNull and Prisma.JsonNull)
const DbNull = Symbol.for("prisma.dbnull");
const JsonNull = Symbol.for("prisma.jsonnull");

export const NullableJsonNullValueInputSchema = z
  .enum(["DbNull", "JsonNull"])
  .transform((value) =>
    value === "JsonNull" ? JsonNull : value === "DbNull" ? DbNull : value
  );

export { DbNull, JsonNull };
