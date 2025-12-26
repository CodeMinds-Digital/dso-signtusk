/**
 * Utility functions for the Signtusk SDK
 */

import * as crypto from 'node:crypto';
import { WebhookVerificationError } from '../errors';

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 30000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxAttempts) {
                throw lastError;
            }

            // Calculate delay with exponential backoff and jitter
            const delay = Math.min(
                baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
                maxDelay
            );

            await sleep(delay);
        }
    }

    throw lastError!;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Create HMAC signature for webhook verification
 */
export function createHmacSignature(payload: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = createHmacSignature(payload, secret);

    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(cleanSignature, 'hex')
        );
    } catch {
        return false;
    }
}

/**
 * Validate webhook signature and throw error if invalid
 */
export function validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): void {
    if (!verifyWebhookSignature(payload, signature, secret)) {
        throw new WebhookVerificationError('Invalid webhook signature');
    }
}

/**
 * Convert File/Buffer/Stream to FormData compatible format
 */
export function prepareFileForUpload(file: any): any {
    if (typeof window !== 'undefined' && file instanceof File) {
        // Browser environment
        return file;
    } else if (Buffer.isBuffer(file)) {
        // Node.js Buffer
        return file;
    } else if (file && typeof file.pipe === 'function') {
        // Node.js Stream
        return file;
    } else {
        throw new Error('Invalid file format. Expected File, Buffer, or ReadableStream.');
    }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            const sourceValue = source[key];
            const targetValue = result[key];

            if (
                sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)
            ) {
                result[key] = deepMerge(targetValue, sourceValue);
            } else {
                result[key] = sourceValue as T[Extract<keyof T, string>];
            }
        }
    }

    return result;
}

/**
 * Sanitize filename for safe usage
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Parse content type from file extension
 */
export function getContentTypeFromExtension(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();

    const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'rtf': 'application/rtf',
        'odt': 'application/vnd.oasis.opendocument.text',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'svg': 'image/svg+xml'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Validate file type against allowed types
 */
export function isAllowedFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return allowedTypes.includes(ext || '');
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(this: any, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function objectKeysToSnake(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(objectKeysToSnake);
    } else if (obj !== null && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[camelToSnake(key)] = objectKeysToSnake(obj[key]);
            }
        }
        return result;
    }
    return obj;
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function objectKeysToCamel(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(objectKeysToCamel);
    } else if (obj !== null && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[snakeToCamel(key)] = objectKeysToCamel(obj[key]);
            }
        }
        return result;
    }
    return obj;
}