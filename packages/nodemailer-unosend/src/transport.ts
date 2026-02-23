import { type SentMessageInfo, type Transport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';

import type {
  UnosendEmailPayload,
  UnosendErrorResponse,
  UnosendSuccessResponse,
  UnosendTransportOptions,
} from './types/transport';

const UNOSEND_DEFAULT_BASE_URL = 'https://www.unosend.co';

export const UNOSEND_ERROR_CODES_BY_KEY: Record<string, number> = {
  missing_required_field: 422,
  invalid_access: 422,
  invalid_parameter: 422,
  rate_limit_exceeded: 429,
  missing_api_key: 401,
  invalid_api_key: 403,
  invalid_from_address: 403,
  validation_error: 403,
  not_found: 404,
  method_not_allowed: 405,
  application_error: 500,
  internal_server_error: 500,
};

export class UnosendTransport implements Transport<SentMessageInfo> {
  public name = 'UnosendMailTransport';
  public version = '1.0.0';

  private _apiKey: string;
  private _baseUrl: string;

  public static makeTransport(options: Partial<UnosendTransportOptions>) {
    return new UnosendTransport(options);
  }

  constructor(options: Partial<UnosendTransportOptions>) {
    const { apiKey = '', baseUrl = UNOSEND_DEFAULT_BASE_URL } = options;
    this._apiKey = apiKey;
    this._baseUrl = baseUrl.replace(/\/$/, ''); // Strip trailing slash
  }

  public send(
    mail: MailMessage,
    callback: (_err: Error | null, _info: SentMessageInfo) => void,
  ) {
    if (!mail.data.to || !mail.data.from) {
      return callback(new Error('Missing required fields "to" or "from"'), null);
    }

    const payload: UnosendEmailPayload = {
      from: this.toUnosendFromAddress(mail.data.from),
      to: this.toUnosendAddresses(mail.data.to),
      subject: mail.data.subject ?? '',
      html: mail.data.html?.toString() || undefined,
      text: mail.data.text?.toString() || undefined,
      cc: this.toUnosendAddresses(mail.data.cc),
      bcc: this.toUnosendAddresses(mail.data.bcc),
      attachments: this.toUnosendAttachments(mail.data.attachments),
    };

    // Add reply-to if present
    if (mail.data.replyTo) {
      const replyTo = this.toUnosendAddresses(mail.data.replyTo);
      if (replyTo.length > 0) {
        payload.reply_to = replyTo[0];
      }
    }

    // Clean up undefined/empty fields
    if (!payload.html) delete payload.html;
    if (!payload.text) delete payload.text;
    if (!payload.cc || payload.cc.length === 0) delete payload.cc;
    if (!payload.bcc || payload.bcc.length === 0) delete payload.bcc;
    if (!payload.attachments || payload.attachments.length === 0) delete payload.attachments;
    if (!payload.reply_to) delete payload.reply_to;

    fetch(`${this._baseUrl}/api/v1/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this._apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const body = await response.json();

        if (!response.ok) {
          const errorBody = body as UnosendErrorResponse;
          const errorCode = errorBody.error?.code ?? 'unknown_error';
          const errorMessage = errorBody.error?.message ?? response.statusText;
          const statusCode = UNOSEND_ERROR_CODES_BY_KEY[errorCode] ?? response.status;

          throw new Error(`[${statusCode}]: ${errorCode} ${errorMessage}`);
        }

        const successBody = body as UnosendSuccessResponse;
        callback(null, {
          messageId: successBody.id,
          ...successBody,
        });
      })
      .catch((error) => {
        callback(error instanceof Error ? error : new Error(String(error)), null);
      });
  }

  public toUnosendAddresses(addresses: Mail.Options['to']): string[] {
    if (!addresses) {
      return [];
    }

    if (typeof addresses === 'string') {
      return [addresses];
    }

    if (Array.isArray(addresses)) {
      return addresses.map((address) => {
        if (typeof address === 'string') {
          return address;
        }

        return address.address;
      });
    }

    return [addresses.address];
  }

  public toUnosendFromAddress(address: Mail.Options['from']): string {
    if (!address) {
      return '';
    }

    if (typeof address === 'string') {
      return address;
    }

    return `${address.name} <${address.address}>`;
  }

  public toUnosendAttachments(attachments: Mail.Options['attachments']) {
    if (!attachments) {
      return [];
    }

    return attachments.map((attachment) => {
      if (!attachment.filename || !attachment.content) {
        throw new Error('Attachment is missing filename or content');
      }

      let base64Content: string;

      if (typeof attachment.content === 'string') {
        base64Content = Buffer.from(attachment.content).toString('base64');
      } else if (attachment.content instanceof Buffer) {
        base64Content = attachment.content.toString('base64');
      } else {
        throw new Error('Attachment content must be a string or a buffer');
      }

      return {
        filename: attachment.filename,
        content: base64Content,
        content_type: attachment.contentType,
      };
    });
  }
}
