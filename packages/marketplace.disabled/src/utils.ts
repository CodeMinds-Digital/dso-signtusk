/**
 * Marketplace Utilities
 * 
 * Utility functions for the marketplace platform including
 * validation helpers, formatting, and common operations.
 */

import { AppCategory, AppStatus, RevenueModel, SandboxLevel } from './types';
import * as crypto from 'node:crypto';

export class MarketplaceUtils {
    /**
     * Generate secure app ID
     */
    static generateAppId(): string {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `app_${timestamp}_${random}`;
    }

    /**
     * Generate secure installation ID
     */
    static generateInstallationId(): string {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `inst_${timestamp}_${random}`;
    }

    /**
     * Generate secure developer ID
     */
    static generateDeveloperId(): string {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `dev_${timestamp}_${random}`;
    }

    /**
     * Validate app name
     */
    static validateAppName(name: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!name || name.trim().length === 0) {
            errors.push('App name is required');
        }

        if (name.length < 3) {
            errors.push('App name must be at least 3 characters long');
        }

        if (name.length > 50) {
            errors.push('App name must be less than 50 characters');
        }

        if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
            errors.push('App name contains invalid characters');
        }

        // Check for reserved names
        const reservedNames = ['admin', 'api', 'system', 'marketplace', 'developer'];
        if (reservedNames.includes(name.toLowerCase())) {
            errors.push('App name is reserved');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate semantic version
     */
    static validateVersion(version: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

        if (!semverRegex.test(version)) {
            errors.push('Invalid semantic version format (expected: major.minor.patch)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate email address
     */
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL
     */
    static validateUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Format currency amount
     */
    static formatCurrency(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    }

    /**
     * Format file size
     */
    static formatFileSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Format duration in milliseconds to human readable
     */
    static formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Calculate app rating from reviews
     */
    static calculateRating(reviews: { rating: number }[]): number {
        if (reviews.length === 0) return 0;

        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal place
    }

    /**
     * Generate app slug from name
     */
    static generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
    }

    /**
     * Sanitize HTML content
     */
    static sanitizeHtml(html: string): string {
        // Basic HTML sanitization - in production, use a proper library like DOMPurify
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    /**
     * Extract keywords from text
     */
    static extractKeywords(text: string, maxKeywords: number = 10): string[] {
        // Simple keyword extraction - in production, use NLP libraries
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);

        // Count word frequency
        const wordCount = new Map<string, number>();
        words.forEach(word => {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });

        // Sort by frequency and return top keywords
        return Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxKeywords)
            .map(([word]) => word);
    }

    /**
     * Check if app category is valid
     */
    static isValidCategory(category: string): boolean {
        return Object.values(AppCategory).includes(category as AppCategory);
    }

    /**
     * Check if app status is valid
     */
    static isValidStatus(status: string): boolean {
        return Object.values(AppStatus).includes(status as AppStatus);
    }

    /**
     * Check if revenue model is valid
     */
    static isValidRevenueModel(model: string): boolean {
        return Object.values(RevenueModel).includes(model as RevenueModel);
    }

    /**
     * Check if sandbox level is valid
     */
    static isValidSandboxLevel(level: string): boolean {
        return Object.values(SandboxLevel).includes(level as SandboxLevel);
    }

    /**
     * Generate secure API key
     */
    static generateApiKey(): string {
        const prefix = 'mk'; // marketplace key
        const random = crypto.randomBytes(32).toString('hex');
        return `${prefix}_${random}`;
    }

    /**
     * Hash sensitive data
     */
    static hashData(data: string, salt?: string): string {
        const actualSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
        return `${actualSalt}:${hash.toString('hex')}`;
    }

    /**
     * Verify hashed data
     */
    static verifyHash(data: string, hash: string): boolean {
        const [salt, originalHash] = hash.split(':');
        const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
        return originalHash === newHash.toString('hex');
    }

    /**
     * Generate webhook signature
     */
    static generateWebhookSignature(payload: string, secret: string): string {
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }

    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
        const expectedSignature = this.generateWebhookSignature(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Rate limit key generator
     */
    static generateRateLimitKey(identifier: string, action: string): string {
        return `ratelimit:${action}:${identifier}`;
    }

    /**
     * Parse user agent for analytics
     */
    static parseUserAgent(userAgent: string): {
        browser: string;
        version: string;
        os: string;
        device: string;
    } {
        // Simple user agent parsing - in production, use a proper library
        const browser = userAgent.includes('Chrome') ? 'Chrome' :
            userAgent.includes('Firefox') ? 'Firefox' :
                userAgent.includes('Safari') ? 'Safari' :
                    userAgent.includes('Edge') ? 'Edge' : 'Unknown';

        const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
                userAgent.includes('Linux') ? 'Linux' :
                    userAgent.includes('Android') ? 'Android' :
                        userAgent.includes('iOS') ? 'iOS' : 'Unknown';

        const device = userAgent.includes('Mobile') ? 'Mobile' :
            userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';

        return {
            browser,
            version: 'Unknown', // Would need more complex parsing
            os,
            device
        };
    }

    /**
     * Generate pagination metadata
     */
    static generatePagination(page: number, limit: number, total: number) {
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null
        };
    }

    /**
     * Validate and normalize search query
     */
    static normalizeSearchQuery(query: string): string {
        return query
            .trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
            .replace(/\s+/g, ' ') // Normalize whitespace
            .substring(0, 100); // Limit length
    }

    /**
     * Generate cache key
     */
    static generateCacheKey(prefix: string, ...parts: string[]): string {
        return `${prefix}:${parts.join(':')}`;
    }

    /**
     * Check if string contains profanity (basic implementation)
     */
    static containsProfanity(text: string): boolean {
        // Basic profanity filter - in production, use a comprehensive library
        const profanityWords = ['spam', 'scam', 'fake', 'virus', 'malware'];
        const lowerText = text.toLowerCase();
        return profanityWords.some(word => lowerText.includes(word));
    }

    /**
     * Generate color from string (for avatars, etc.)
     */
    static generateColorFromString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }
}