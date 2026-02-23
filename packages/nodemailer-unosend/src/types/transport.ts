export type UnosendTransportOptions = {
  /** API key for Unosend (starts with `un_`) */
  apiKey: string;
  /** Base URL override (default: https://www.unosend.co) */
  baseUrl?: string;
};

export type UnosendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  attachments?: UnosendAttachment[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
};

export type UnosendAttachment = {
  filename: string;
  content: string; // base64 encoded
  content_type?: string;
};

export type UnosendSuccessResponse = {
  id: string;
  from: string;
  to: string[];
  status: string;
  created_at: string;
};

export type UnosendErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export type UnosendResponseError = {
  statusCode: number;
  name: string;
  message: string;
};
