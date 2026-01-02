import type { Field, Signature } from "@signtusk/lib/constants/prisma-enums";

export type FieldWithSignature = Field & {
  signature?: Signature | null;
};
