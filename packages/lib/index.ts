export { };

// Export ID generation utilities
export { nanoid, alphaid, fancyId, prefixedId, generateDatabaseId } from './universal/id';

// Simple generateId function for general use
export const generateId = () => {
    const { nanoid } = require('nanoid');
    return nanoid();
};

// Generate secure token for webhooks and other security purposes
export function generateSecureToken(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
