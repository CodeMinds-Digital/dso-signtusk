import type { Field, Signature } from "@signtusk/lib/constants/prisma-enums";

import { type TFieldMetaSchema as FieldMeta } from "@signtusk/lib/types/field-meta";

export type FieldWithSignatureAndFieldMeta = Field & {
  signature?: Signature | null;
  fieldMeta: FieldMeta | null;
};
