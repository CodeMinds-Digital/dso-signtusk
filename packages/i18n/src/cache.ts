import { TranslationCache } from './types';
import { SupportedLocale } from './types';

// Export the TranslationCache interface for external use
export { TranslationCache } from './types';

export class InMemoryTranslationCache implements TranslationCache {
    private cache: Map<string, { value: string; expires: number }>;
    private stats: { hits: number; misses: number };

    constructor() {
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0 };
    }

    async get(key: string, locale: SupportedLocale): Promise<string | null> {
        const cacheKey = `${key}:${locale}`;
        const entry = this.cache.get(cacheKey);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() > entry.expires) {
            this.cache.delete(cacheKey);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.value;
    }

    async set(key: string, locale: SupportedLocale, value: string, ttl: number = 3600): Promise<void> {
        const cacheKey = `${key}:${locale}`;
        const expires = Date.now() + (ttl * 1000);

        this.cache.set(cacheKey, { value, expires });
    }

    async delete(key: string, locale?: SupportedLocale): Promise<void> {
        if (locale) {
            const cacheKey = `${key}:${locale}`;
            this.cache.delete(cacheKey);
        } else {
            // Delete all entries for this key across all locales
            const keysToDelete = Array.from(this.cache.keys()).filter(k => k.startsWith(`${key}:`));
            for (const keyToDelete of keysToDelete) {
                this.cache.delete(keyToDelete);
            }
        }
    }

    async clear(): Promise<void> {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
    }

    async getStats(): Promise<{ hits: number; misses: number; size: number }> {
        // Clean up expired entries
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expires) {
                this.cache.delete(key);
            }
        }

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
        };
    }
}

export class RedisTranslationCache implements TranslationCache {
    private redis: any; // Redis client
    private keyPrefix: string;
    private stats: { hits: number; misses: number };

    constructor(redisClient: any, keyPrefix: string = 'i18n:') {
        this.redis = redisClient;
        this.keyPrefix = keyPrefix;
        this.stats = { hits: 0, misses: 0 };
    }

    async get(key: string, locale: SupportedLocale): Promise<string | null> {
        try {
            const cacheKey = `${this.keyPrefix}${key}:${locale}`;
            const value = await this.redis.get(cacheKey);

            if (value) {
                this.stats.hits++;
                return value;
            } else {
                this.stats.misses++;
                return null;
            }
        } catch (error) {
            console.warn('Redis cache get error:', error);
            this.stats.misses++;
            return null;
        }
    }

    async set(key: string, locale: SupportedLocale, value: string, ttl: number = 3600): Promise<void> {
        try {
            const cacheKey = `${this.keyPrefix}${key}:${locale}`;
            await this.redis.setex(cacheKey, ttl, value);
        } catch (error) {
            console.warn('Redis cache set error:', error);
        }
    }

    async delete(key: string, locale?: SupportedLocale): Promise<void> {
        try {
            if (locale) {
                const cacheKey = `${this.keyPrefix}${key}:${locale}`;
                await this.redis.del(cacheKey);
            } else {
                // Delete all entries for this key across all locales
                const pattern = `${this.keyPrefix}${key}:*`;
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            }
        } catch (error) {
            console.warn('Redis cache delete error:', error);
        }
    }

    async clear(): Promise<void> {
        try {
            const pattern = `${this.keyPrefix}*`;
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            this.stats = { hits: 0, misses: 0 };
        } catch (error) {
            console.warn('Redis cache clear error:', error);
        }
    }

    async getStats(): Promise<{ hits: number; misses: number; size: number }> {
        try {
            const pattern = `${this.keyPrefix}*`;
            const keys = await this.redis.keys(pattern);
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                size: keys.length,
            };
        } catch (error) {
            console.warn('Redis cache stats error:', error);
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                size: 0,
            };
        }
    }
}