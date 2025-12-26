import { createHmac, timingSafeEqual } from 'node:crypto';
import { WebhookSignature, WebhookSignatureService, WebhookSignatureError } from './types';

export class HmacWebhookSignatureService implements WebhookSignatureService {
    private readonly algorithm: string;
    private readonly tolerance: number; // seconds

    constructor(algorithm: string = 'sha256', tolerance: number = 300) {
        this.algorithm = algorithm;
        this.tolerance = tolerance;
    }

    generateSignature(payload: string, secret: string, timestamp?: string): WebhookSignature {
        const ts = timestamp || Math.floor(Date.now() / 1000).toString();
        const signedPayload = `${ts}.${payload}`;

        const hmac = createHmac(this.algorithm, secret);
        hmac.update(signedPayload, 'utf8');
        const signature = hmac.digest('hex');

        return {
            timestamp: ts,
            signature,
            algorithm: this.algorithm,
        };
    }

    verifySignature(payload: string, signature: WebhookSignature, secret: string): boolean {
        try {
            // Check timestamp tolerance
            const now = Math.floor(Date.now() / 1000);
            const timestamp = parseInt(signature.timestamp, 10);

            if (Math.abs(now - timestamp) > this.tolerance) {
                throw new WebhookSignatureError(
                    'Webhook timestamp is outside the tolerance window',
                    { timestamp, now, tolerance: this.tolerance }
                );
            }

            // Generate expected signature
            const expected = this.generateSignature(payload, secret, signature.timestamp);

            // Use timing-safe comparison
            const expectedBuffer = Buffer.from(expected.signature, 'hex');
            const actualBuffer = Buffer.from(signature.signature, 'hex');

            if (expectedBuffer.length !== actualBuffer.length) {
                return false;
            }

            return timingSafeEqual(expectedBuffer, actualBuffer);
        } catch (error) {
            if (error instanceof WebhookSignatureError) {
                throw error;
            }
            throw new WebhookSignatureError(
                'Failed to verify webhook signature',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Parse signature header in the format: t=timestamp,v1=signature
     */
    parseSignatureHeader(header: string): WebhookSignature {
        const parts = header.split(',');
        let timestamp = '';
        let signature = '';

        for (const part of parts) {
            const [key, value] = part.split('=', 2);
            if (key === 't') {
                timestamp = value;
            } else if (key === 'v1') {
                signature = value;
            }
        }

        if (!timestamp || !signature) {
            throw new WebhookSignatureError(
                'Invalid signature header format',
                { header }
            );
        }

        return {
            timestamp,
            signature,
            algorithm: this.algorithm,
        };
    }

    /**
     * Format signature for header in the format: t=timestamp,v1=signature
     */
    formatSignatureHeader(signature: WebhookSignature): string {
        return `t=${signature.timestamp},v1=${signature.signature}`;
    }
}