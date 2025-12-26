import { Twilio } from 'twilio';
import { SMSConfig, NotificationStatus, SMSError } from '../../types';
import { Logger } from 'pino';

/**
 * Twilio SMS Provider Implementation
 */
export class TwilioSMSProvider {
    private client: Twilio;
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
        this.logger = logger.child({ provider: 'twilio' });

        if (!config.accountSid || !config.authToken) {
            throw new SMSError('Twilio account SID and auth token are required');
        }

        try {
            this.client = new Twilio(config.accountSid, config.authToken);
            this.logger.info('Twilio SMS provider initialized');
        } catch (error) {
            this.logger.error({ error }, 'Failed to initialize Twilio client');
            throw new SMSError(`Failed to initialize Twilio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async send(to: string, message: string, from?: string): Promise<any> {
        const fromNumber = from || this.config.fromNumber;

        if (!fromNumber) {
            throw new SMSError('From number is required for Twilio SMS');
        }

        try {
            this.logger.debug({
                to: this.maskPhoneNumber(to),
                from: fromNumber,
                messageLength: message.length
            }, 'Sending SMS via Twilio');

            const result = await this.client.messages.create({
                body: message,
                from: fromNumber,
                to: to
            });

            this.stats.sent++;
            this.stats.lastSuccess = new Date();

            this.logger.info({
                messageSid: result.sid,
                status: result.status
            }, 'SMS sent via Twilio');

            return {
                messageId: result.sid,
                status: this.mapTwilioStatus(result.status),
                providerId: 'twilio',
                providerResponse: {
                    sid: result.sid,
                    status: result.status,
                    direction: result.direction,
                    dateCreated: result.dateCreated,
                    price: result.price,
                    priceUnit: result.priceUnit
                }
            };

        } catch (error: any) {
            this.stats.failed++;
            this.stats.lastError = error.message;

            this.logger.error({
                error,
                to: this.maskPhoneNumber(to),
                twilioCode: error.code,
                twilioStatus: error.status
            }, 'Failed to send SMS via Twilio');

            // Map Twilio-specific errors
            if (error.code === 21211) {
                throw new SMSError('Invalid phone number format');
            } else if (error.code === 21408) {
                throw new SMSError('Permission denied for this phone number');
            } else if (error.code === 21610) {
                throw new SMSError('Message blocked by carrier');
            } else if (error.code === 21614) {
                throw new SMSError('Message body is invalid');
            }

            throw new SMSError(`Twilio SMS failed: ${error.message}`, {
                code: error.code,
                status: error.status,
                moreInfo: error.moreInfo
            });
        }
    }

    async getStatus(messageId: string): Promise<NotificationStatus> {
        try {
            const message = await this.client.messages(messageId).fetch();
            return this.mapTwilioStatus(message.status);
        } catch (error: any) {
            this.logger.error({ error, messageId }, 'Failed to get message status from Twilio');
            throw new SMSError(`Failed to get message status: ${error.message}`);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            // Try to fetch account information as a health check
            if (!this.config.accountSid) {
                return false;
            }
            await this.client.api.accounts(this.config.accountSid).fetch();
            return true;
        } catch (error) {
            this.logger.error({ error }, 'Twilio health check failed');
            return false;
        }
    }

    getStats() {
        return {
            ...this.stats,
            provider: 'twilio',
            successRate: this.stats.sent + this.stats.failed > 0
                ? (this.stats.sent / (this.stats.sent + this.stats.failed)) * 100
                : 0
        };
    }

    private mapTwilioStatus(twilioStatus: string): NotificationStatus {
        switch (twilioStatus) {
            case 'queued':
            case 'accepted':
                return NotificationStatus.PENDING;
            case 'sending':
                return NotificationStatus.SENT;
            case 'sent':
            case 'delivered':
                return NotificationStatus.DELIVERED;
            case 'failed':
            case 'undelivered':
                return NotificationStatus.FAILED;
            case 'canceled':
                return NotificationStatus.CANCELLED;
            default:
                return NotificationStatus.PENDING;
        }
    }

    private maskPhoneNumber(phoneNumber: string): string {
        if (phoneNumber.length <= 4) return phoneNumber;
        return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
    }

    /**
     * Get Twilio account balance (if available)
     */
    async getAccountBalance(): Promise<{ balance: string; currency: string } | null> {
        try {
            const balance = await this.client.balance.fetch();
            return {
                balance: balance.balance,
                currency: balance.currency
            };
        } catch (error) {
            this.logger.error({ error }, 'Failed to get Twilio account balance');
            return null;
        }
    }

    /**
     * Validate phone number using Twilio Lookup API
     */
    async validatePhoneNumber(phoneNumber: string): Promise<{
        valid: boolean;
        formatted?: string;
        carrier?: string;
        type?: string;
    }> {
        try {
            const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch({
                type: ['carrier']
            });

            return {
                valid: true,
                formatted: lookup.phoneNumber,
                carrier: lookup.carrier?.name,
                type: lookup.carrier?.type
            };
        } catch (error: any) {
            if (error.code === 20404) {
                return { valid: false };
            }

            this.logger.error({ error, phoneNumber: this.maskPhoneNumber(phoneNumber) }, 'Phone number validation failed');
            throw new SMSError(`Phone number validation failed: ${error.message}`);
        }
    }

    /**
     * Get message details including delivery information
     */
    async getMessageDetails(messageId: string): Promise<any> {
        try {
            const message = await this.client.messages(messageId).fetch();
            return {
                sid: message.sid,
                status: message.status,
                direction: message.direction,
                from: message.from,
                to: message.to,
                body: message.body,
                numSegments: message.numSegments,
                price: message.price,
                priceUnit: message.priceUnit,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage,
                dateCreated: message.dateCreated,
                dateSent: message.dateSent,
                dateUpdated: message.dateUpdated
            };
        } catch (error: any) {
            this.logger.error({ error, messageId }, 'Failed to get message details from Twilio');
            throw new SMSError(`Failed to get message details: ${error.message}`);
        }
    }
}