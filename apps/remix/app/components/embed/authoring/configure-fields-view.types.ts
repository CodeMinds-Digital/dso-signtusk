import { z } from "zod";

import { FieldType } from "@signtusk/lib/constants/prisma-enums";
import { ZFieldMetaSchema } from "@signtusk/lib/types/field-meta";

export const ZConfigureFieldsFormSchema = z.object({
  fields: z.array(
    z.object({
      nativeId: z.number().optional(),
      formId: z.string().min(1),
      type: z.enum([
        FieldType.SIGNATURE,
        FieldType.FREE_SIGNATURE,
        FieldType.INITIALS,
        FieldType.NAME,
        FieldType.EMAIL,
        FieldType.DATE,
        FieldType.TEXT,
        FieldType.NUMBER,
        FieldType.RADIO,
        FieldType.CHECKBOX,
        FieldType.DROPDOWN,
      ]),
      signerEmail: z.string().min(1),
      inserted: z.boolean().optional(),
      recipientId: z.number().min(0),
      pageNumber: z.number().min(1),
      pageX: z.number().min(0),
      pageY: z.number().min(0),
      pageWidth: z.number().min(0),
      pageHeight: z.number().min(0),
      fieldMeta: ZFieldMetaSchema.optional(),
    })
  ),
});

export type TConfigureFieldsFormSchema = z.infer<
  typeof ZConfigureFieldsFormSchema
>;

export type TConfigureFieldsFormSchemaField = z.infer<
  typeof ZConfigureFieldsFormSchema
>["fields"][number];
