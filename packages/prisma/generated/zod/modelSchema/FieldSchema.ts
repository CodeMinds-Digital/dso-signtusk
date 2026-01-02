import { ZFieldMetaNotOptionalSchema } from "@signtusk/lib/types/field-meta";
import { z } from "zod";
import { FieldTypeSchema } from "../inputTypeSchemas/FieldTypeSchema";

// Browser-safe Decimal validation (accepts string, number, or Decimal-like objects)
const DecimalSchema = z.union([
  z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Invalid decimal string",
    }),
  z.number(),
  z.object({
    d: z.array(z.number()),
    e: z.number(),
    s: z.number(),
    toFixed: z.any(),
  }),
]);

/////////////////////////////////////////
// FIELD SCHEMA
/////////////////////////////////////////

export const FieldSchema = z.object({
  type: FieldTypeSchema,
  id: z.number(),
  secondaryId: z.string(),
  envelopeId: z.string(),
  envelopeItemId: z.string(),
  recipientId: z.number(),
  page: z
    .number()
    .describe("The page number of the field on the document. Starts from 1."),
  positionX: DecimalSchema,
  positionY: DecimalSchema,
  width: DecimalSchema,
  height: DecimalSchema,
  customText: z.string(),
  inserted: z.boolean(),
  /**
   * [FieldMeta]
   */
  fieldMeta: ZFieldMetaNotOptionalSchema.nullable(),
});

export type Field = z.infer<typeof FieldSchema>;

/////////////////////////////////////////
// FIELD CUSTOM VALIDATORS SCHEMA
/////////////////////////////////////////

export const FieldCustomValidatorsSchema = FieldSchema;

export type FieldCustomValidators = z.infer<typeof FieldCustomValidatorsSchema>;

export default FieldSchema;
