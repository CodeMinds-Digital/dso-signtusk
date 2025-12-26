import { SMSConfig, NotificationStatus, SMSError } from '../../types';
import { Logger } from 'pino';

/**
 * AWS SNS SMS Provider Implementation
 * Note: This is a stub implementation. Full AWS SDK integration would be needed in production.
 */
export class AWSSNSProvider {
    private config: SMSConfig;
    private logger: Logger;
    private stats = {
        sent: 0,
        failed: 0,
        lastError: null as string | null,
        lastSuccess: null as Date | null
    };

    constructor(config: SMSConfig, logger: Logger) {
        this.config = config;
        this.logger = logger.child({ provider: 'aws-sns' });
        this.logger.info('AWS SNS SMS provider initialized');
    }

    async send(to: string, message: string, from?: string): Promise<any> {
        try {
            this.logger.debug({
                to: this.maskPhoneNumber(to),
                messageLength: message.length
            }, 'Sending SMS via AWS SNS');

            // Stub implementation - would use AWS SDK in production
            const messageId = `aws-sns-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            this.stats.sent++;
            this.stats.lastSuccess = new Date();

            return {
                messageId,
                status: NotificationStatus.SENT,
                providerId: 'aws-sns',
                providerResponse: {
                    MessageId: messageId
                }
            };

        } catch (error: any) {
            this.stats.failed++;
            this.stats.lastError = error.message;
            this.logger.error({ error, to: this.maskPhoneNumber(to) }, 'Failed to send SMS via AWS SNS');
            throw new SMSError(`AWS SNS SMS failed: ${error.message}`);
        }
    }

    async getStatus(messageId: string): Promise<NotificationStatus> {
        // Stub implementation
        return NotificationStatus.DELIVERED;
    }

    async healthCheck(): Promise<boolean> {
        return true;
    }

    getStats() {
        return {
            ...this.stats,
            provider: 'aws-sns',
            successRate: this.stats.sent + this.stats.failed > 0
                ? (this.stats.sent / (this.stats.sent + this.stats.failed)) * 100
                : 0
        };
    }

    private maskPhoneNumber(phoneNumber: string): string {
        if (phoneNumber.length <= 4) return phoneNumber;
        return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
    }
}