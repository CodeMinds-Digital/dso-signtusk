/* eslint-disable @typescript-eslint/no-namespace */
import type {
  TDocumentAuthOptions,
  TRecipientAuthOptions,
} from '@signtusk/lib/types/document-auth';
import type { TDocumentEmailSettings } from '@signtusk/lib/types/document-email';
import type { TDocumentFormValues } from '@signtusk/lib/types/document-form-values';
import type { TEnvelopeAttachmentType } from '@signtusk/lib/types/envelope-attachment';
import type { TFieldMetaNotOptionalSchema } from '@signtusk/lib/types/field-meta';
import type { TClaimFlags } from '@signtusk/lib/types/subscription';

/**
 * Global types for Prisma.Json instances.
 */
declare global {
  namespace PrismaJson {
    type ClaimFlags = TClaimFlags;

    type DocumentFormValues = TDocumentFormValues;
    type DocumentAuthOptions = TDocumentAuthOptions;
    type DocumentEmailSettings = TDocumentEmailSettings;
    type DocumentEmailSettingsNullable = TDocumentEmailSettings | null;

    type RecipientAuthOptions = TRecipientAuthOptions;

    type FieldMeta = TFieldMetaNotOptionalSchema;

    type EnvelopeAttachmentType = TEnvelopeAttachmentType;
  }
}

export {};
