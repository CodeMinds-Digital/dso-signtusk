import { EnvelopeType } from '@prisma/client';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { type SupportedLanguageCodes, isValidLanguageCode } from '../../constants/i18n';
import { unsafeGetEntireEnvelope } from '../admin/get-entire-document';
import { mapSecondaryIdToDocumentId } from '../../utils/envelope';
import { generateCertificate, type CertificateData } from '@signtusk/pdf-processing';

export type GetCertificatePdfOptions = {
  documentId: number;
  // eslint-disable-next-line @typescript-eslint/ban-types
  language?: SupportedLanguageCodes | (string & {});
};

export const getCertificatePdf = async ({ documentId, language }: GetCertificatePdfOptions) => {
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

  // Find the first completed recipient for certificate data
  const completedRecipient = envelope.recipients.find(
    (recipient) => recipient.signingStatus === 'SIGNED'
  );

  if (!completedRecipient) {
    throw new Error(`No completed recipient found for document ${documentId}`);
  }

  // Prepare certificate data
  const certificateData: CertificateData = {
    documentId: mapSecondaryIdToDocumentId(envelope.secondaryId),
    documentTitle: envelope.title,
    signerName: completedRecipient.name || 'Unknown Signer',
    signerEmail: completedRecipient.email,
    signedAt: completedRecipient.signedAt || new Date(),
    verificationUrl: `${NEXT_PUBLIC_WEBAPP_URL()}/share/${envelope.qrToken}`,
    certificateId: `CERT-${envelope.secondaryId}-${completedRecipient.id}`,
    language: lang,
  };

  // Generate the certificate PDF using the new pdf-lib implementation
  const result = await generateCertificate(certificateData, {
    format: 'A4',
    language: lang,
    includeBackground: true,
  });

  return result;
};
