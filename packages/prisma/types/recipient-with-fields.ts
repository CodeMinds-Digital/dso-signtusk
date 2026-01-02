import type { Field, Recipient } from "@signtusk/lib/constants/prisma-enums";

export type RecipientWithFields = Recipient & {
  fields: Field[];
};
