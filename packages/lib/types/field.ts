import { FieldType } from "@signtusk/lib/constants/prisma-enums";
import { z } from "zod";

import {
  FIELD_SIGNATURE_META_DEFAULT_VALUES,
  ZCheckboxFieldMeta,
  ZDateFieldMeta,
  ZDropdownFieldMeta,
  ZEmailFieldMeta,
  ZFieldMetaNotOptionalSchema,
  ZInitialsFieldMeta,
  ZNameFieldMeta,
  ZNumberFieldMeta,
  ZRadioFieldMeta,
  ZSignatureFieldMeta,
  ZTextFieldMeta,
} from "./field-meta";

// Browser-safe FieldType schema (mirrors the generated one but without @prisma/client)
const FieldTypeSchema = z.enum([
  "SIGNATURE",
  "FREE_SIGNATURE",
  "INITIALS",
  "NAME",
  "EMAIL",
  "DATE",
  "TEXT",
  "NUMBER",
  "RADIO",
  "CHECKBOX",
  "DROPDOWN",
]);

// Browser-safe decimal schema - accepts string, number, or Decimal-like objects and outputs number
// This handles Prisma Decimal objects on the server and plain numbers on the client
const BrowserSafeDecimalSchema = z.preprocess((val) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  // Handle Prisma Decimal objects
  if (
    val &&
    typeof val === "object" &&
    "toNumber" in val &&
    typeof (val as { toNumber: () => number }).toNumber === "function"
  ) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return val;
}, z.number());

/**
 * Browser-safe FieldSchema that doesn't import from @prisma/client.
 * This replaces the generated FieldSchema for client-side code.
 */
const BrowserSafeFieldSchema = z.object({
  type: FieldTypeSchema,
  id: z.number(),
  secondaryId: z.string(),
  envelopeId: z.string(),
  envelopeItemId: z.string(),
  recipientId: z.number(),
  page: z.number(),
  positionX: BrowserSafeDecimalSchema,
  positionY: BrowserSafeDecimalSchema,
  width: BrowserSafeDecimalSchema,
  height: BrowserSafeDecimalSchema,
  customText: z.string(),
  inserted: z.boolean(),
  fieldMeta: ZFieldMetaNotOptionalSchema.nullable(),
});

/**
 * The full field response schema.
 *
 * If you need to return something different, adjust this file to utilise the:
 * - ZFieldSchema
 * - ZFieldLiteSchema
 * - ZFieldManySchema
 *
 * Setup similar to:
 * - ./documents.ts
 * - ./templates.ts
 */
export const ZFieldSchema = BrowserSafeFieldSchema.pick({
  envelopeId: true,
  envelopeItemId: true,
  type: true,
  id: true,
  secondaryId: true,
  recipientId: true,
  page: true,
  positionX: true,
  positionY: true,
  width: true,
  height: true,
  customText: true,
  inserted: true,
  fieldMeta: true,
}).extend({
  // Backwards compatibility.
  documentId: z.number().nullish(),
  templateId: z.number().nullish(),
});

export const ZEnvelopeFieldSchema = ZFieldSchema.omit({
  documentId: true,
  templateId: true,
});

export const ZFieldPageNumberSchema = z
  .number()
  .min(1)
  .describe("The page number the field will be on.");

export const ZFieldPageXSchema = z
  .number()
  .min(0)
  .describe("The X coordinate of where the field will be placed.");

export const ZFieldPageYSchema = z
  .number()
  .min(0)
  .describe("The Y coordinate of where the field will be placed.");

export const ZFieldWidthSchema = z
  .number()
  .min(1)
  .describe("The width of the field.");

export const ZFieldHeightSchema = z
  .number()
  .min(1)
  .describe("The height of the field.");

export const ZClampedFieldPositionXSchema = z
  .number()
  .min(0)
  .max(100)
  .describe(
    "The percentage based X coordinate where the field will be placed."
  );

export const ZClampedFieldPositionYSchema = z
  .number()
  .min(0)
  .max(100)
  .describe(
    "The percentage based Y coordinate where the field will be placed."
  );

export const ZClampedFieldWidthSchema = z
  .number()
  .min(0)
  .max(100)
  .describe("The percentage based width of the field on the page.");

export const ZClampedFieldHeightSchema = z
  .number()
  .min(0)
  .max(100)
  .describe("The percentage based height of the field on the page.");

// ---------------------------------------------

// BaseFieldSchemaUsingNumbers - ZFieldSchema already uses browser-safe decimal handling
export const BaseFieldSchemaUsingNumbers = ZFieldSchema;

export const ZFieldTextSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.TEXT),
  fieldMeta: ZTextFieldMeta,
});

export type TFieldText = z.infer<typeof ZFieldTextSchema>;

export const ZFieldSignatureSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.SIGNATURE),
  fieldMeta: ZSignatureFieldMeta.catch(FIELD_SIGNATURE_META_DEFAULT_VALUES),
});

export type TFieldSignature = z.infer<typeof ZFieldSignatureSchema>;

export const ZFieldFreeSignatureSchema = ZFieldSignatureSchema;

export type TFieldFreeSignature = z.infer<typeof ZFieldFreeSignatureSchema>;

export const ZFieldInitialsSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.INITIALS),
  fieldMeta: ZInitialsFieldMeta,
});

export type TFieldInitials = z.infer<typeof ZFieldInitialsSchema>;

export const ZFieldNameSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.NAME),
  fieldMeta: ZNameFieldMeta,
});

export type TFieldName = z.infer<typeof ZFieldNameSchema>;

export const ZFieldEmailSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.EMAIL),
  fieldMeta: ZEmailFieldMeta,
});

export type TFieldEmail = z.infer<typeof ZFieldEmailSchema>;

export const ZFieldDateSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.DATE),
  fieldMeta: ZDateFieldMeta,
});

export type TFieldDate = z.infer<typeof ZFieldDateSchema>;

export const ZFieldNumberSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.NUMBER),
  fieldMeta: ZNumberFieldMeta,
});

export type TFieldNumber = z.infer<typeof ZFieldNumberSchema>;

export const ZFieldRadioSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.RADIO),
  fieldMeta: ZRadioFieldMeta,
});

export type TFieldRadio = z.infer<typeof ZFieldRadioSchema>;

export const ZFieldCheckboxSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.CHECKBOX),
  fieldMeta: ZCheckboxFieldMeta,
});

export type TFieldCheckbox = z.infer<typeof ZFieldCheckboxSchema>;

export const ZFieldDropdownSchema = BaseFieldSchemaUsingNumbers.extend({
  type: z.literal(FieldType.DROPDOWN),
  fieldMeta: ZDropdownFieldMeta,
});

export type TFieldDropdown = z.infer<typeof ZFieldDropdownSchema>;

/**
 * The full field schema which will enforce all types and meta fields.
 */
export const ZFullFieldSchema = z.discriminatedUnion("type", [
  ZFieldTextSchema,
  ZFieldSignatureSchema,
  ZFieldInitialsSchema,
  ZFieldNameSchema,
  ZFieldEmailSchema,
  ZFieldDateSchema,
  ZFieldNumberSchema,
  ZFieldRadioSchema,
  ZFieldCheckboxSchema,
  ZFieldDropdownSchema,
]);

export type TFullFieldSchema = z.infer<typeof ZFullFieldSchema>;
