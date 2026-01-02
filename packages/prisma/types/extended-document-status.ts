import { DocumentStatus } from "@signtusk/lib/constants/prisma-enums";

export const ExtendedDocumentStatus = {
  ...DocumentStatus,
  INBOX: "INBOX",
  ALL: "ALL",
} as const;

export type ExtendedDocumentStatus =
  (typeof ExtendedDocumentStatus)[keyof typeof ExtendedDocumentStatus];
