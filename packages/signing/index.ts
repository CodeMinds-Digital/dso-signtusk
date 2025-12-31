import { match } from 'ts-pattern';

import { env } from '@signtusk/lib/utils/env';

import { signWithGoogleCloudHSM } from './transports/google-cloud-hsm';
import { signWithLocalCert } from './transports/local-cert';

export type SignOptions = {
  pdf: Buffer;
};

// Check if PDF signing is available in this environment
const isPdfSigningAvailable = () => {
  try {
    require('dso-pdf-sign');
    return true;
  } catch {
    return false;
  }
};

export const signPdf = async ({ pdf }: SignOptions) => {
  // Check if we're in an environment where PDF signing is disabled
  const signingDisabled = env('DISABLE_PDF_SIGNING') === 'true';
  
  if (signingDisabled || !isPdfSigningAvailable()) {
    console.warn('PDF signing is disabled or not available in this environment. Returning unsigned PDF.');
    return pdf; // Return the original PDF without signing
  }

  const transport = env('NEXT_PRIVATE_SIGNING_TRANSPORT') || 'local';

  try {
    return await match(transport)
      .with('local', async () => signWithLocalCert({ pdf }))
      .with('gcloud-hsm', async () => signWithGoogleCloudHSM({ pdf }))
      .otherwise(() => {
        throw new Error(`Unsupported signing transport: ${transport}`);
      });
  } catch (error) {
    console.error('PDF signing failed, returning unsigned PDF:', error);
    return pdf; // Fallback to unsigned PDF
  }
};
