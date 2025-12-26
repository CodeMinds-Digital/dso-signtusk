import { EnvelopeType } from '@prisma/client';

import { type SupportedLanguageCodes, isValidLanguageCode } from '../../constants/i18n';
import { unsafeGetEntireEnvelope } from '../admin/get-entire-document';
import { findDocumentAuditLogs } from '../document/find-document-audit-logs';
import { mapSecondaryIdToDocumentId } from '../../utils/envelope';
import { generateAuditLog, type AuditLogData, type AuditLogEntry } from '@signtusk/pdf-processing';

export type GetAuditLogsPdfOptions = {
  documentId: number;
  // eslint-disable-next-line @typescript-eslint/ban-types
  language?: SupportedLanguageCodes | (string & {});
};

export const getAuditLogsPdf = async ({ documentId, language }: GetAuditLogsPdfOptions) => {
  const lang = isValidLanguageCode(language) ? language : 'en';

  // Get the document data
  const envelope = await unsafeGetEntireEnvelope({
    id: {
      type: 'documentId',
      id: documentId,
    },
    type: EnvelopeType.DOCUMENT,
  });

  if (!envelope) {
    throw new Error(`Document with ID ${documentId} not found`);
  }

  // Get audit logs
  const { data: auditLogs } = await findDocumentAuditLogs({
    documentId: documentId,
    userId: envelope.userId,
    teamId: envelope.teamId,
    perPage: 100_000,
  });

  // Convert audit logs to the format expected by the PDF generator
  const auditLogEntries: AuditLogEntry[] = auditLogs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt,
    action: log.type,
    user: log.name || undefined,
    email: log.email || undefined,
    ipAddress: log.ipAddress || undefined,
    userAgent: log.userAgent || undefined,
    details: log.data ? { data: JSON.stringify(log.data) } : undefined,
  }));

  // Prepare audit log data
  const auditLogData: AuditLogData = {
    documentId: mapSecondaryIdToDocumentId(envelope.secondaryId),
    documentTitle: envelope.title,
    entries: auditLogEntries,
    generatedAt: new Date(),
    language: lang,
  };

  // Generate the audit log PDF using the new pdf-lib implementation
  const result = await generateAuditLog(auditLogData, {
    format: 'A4',
    language: lang,
    includeBackground: true,
  });

  return result;
};
