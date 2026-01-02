import { z } from "zod";

// Browser-safe null value symbols (equivalent to Prisma null types)
const DbNull = Symbol.for("prisma.dbnull");
const JsonNull = Symbol.for("prisma.jsonnull");
const AnyNull = Symbol.for("prisma.anynull");

export const JsonNullValueFilterSchema = z
  .enum(["DbNull", "JsonNull", "AnyNull"])
  .transform((value) =>
    value === "JsonNull"
      ? JsonNull
      : value === "DbNull"
        ? DbNull
        : value === "AnyNull"
          ? AnyNull
          : value
  );

export { AnyNull, DbNull, JsonNull };
