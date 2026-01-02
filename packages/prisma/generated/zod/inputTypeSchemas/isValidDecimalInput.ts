// Browser-safe DecimalJsLike type (equivalent to Prisma.DecimalJsLike)
interface DecimalJsLike {
  d: number[];
  e: number;
  s: number;
  toFixed: () => string;
}

export const DECIMAL_STRING_REGEX =
  /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput = (
  v?: null | string | number | DecimalJsLike
): v is string | number | DecimalJsLike => {
  if (v === undefined || v === null) return false;
  return (
    (typeof v === "object" &&
      "d" in v &&
      "e" in v &&
      "s" in v &&
      "toFixed" in v) ||
    (typeof v === "string" && DECIMAL_STRING_REGEX.test(v)) ||
    typeof v === "number"
  );
};

export type { DecimalJsLike };

export default isValidDecimalInput;
