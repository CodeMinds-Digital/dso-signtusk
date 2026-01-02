import type {
  DocumentData,
  Envelope,
  Recipient,
} from "@signtusk/lib/constants/prisma-enums";

export type EnvelopeWithRecipients = Envelope & {
  recipients: Recipient[];
};

export type EnvelopeWithRecipient = Envelope & {
  recipients: Recipient[];
  documentData: DocumentData;
};
