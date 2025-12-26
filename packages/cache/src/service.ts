import Redis, { Cluster } from 'ioredis';
import { CacheConfig, CacheOptions, CacheService, CacheStats, CacheConfigSchema } from './types';

export class RedisCacheService implements CacheService {
    private client: Redis | Cluster;
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalOperations: 0,
    };

    constructor(config: CacheConfig) {
        const validatedConfig = CacheConfigSchema.parse(config);

        if (validatedConfig.cluster?.enabled && validatedConfig.cluster.nodes) {
            // Create Redis cluster
            this.client = new Cluster(validatedConfig.cluster.nodes, {
                redisOptions: {
                    password: validatedConfig.password,
                    keyPrefix: validatedConfig.keyPrefix,
                    maxRetriesPerRequest: validatedConfig.maxRetriesPerRequest,
                    enableReadyCheck: validatedConfig.enableReadyCheck,
                    lazyConnect: validatedConfig.lazyConnect,
                },
                retryDelayOnClusterDown: validatedConfig.cluster.retryDelayOnClusterDown,
            });
        } else {
            // Create single Redis instance
            this.client = new Redis({
                host: validatedConfig.host,
                port: validatedConfig.port,
                password: validatedConfig.password,
                db: validatedConfig.db,
                keyPrefix: validatedConfig.keyPrefix,
                maxRetriesPerRequest: validatedConfig.maxRetriesPerRequest,
                enableReadyCheck: validatedConfig.enableReadyCheck,
                lazyConnect: validatedConfig.lazyConnect,
            });
        }

        // Set up error handling
        this.client.on('error', (error) => {
            console.error('Redis connection error:', error);
        });

        this.client.on('connect', () => {
            console.log('Redis connected successfully');
        });
    }

    async get<T = any>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            this.updateStats(value !== null);

            if (value === null) {
                return null;
            }

            try {
                return JSON.parse(value) as T;
            } catch {
                return value as T;
            }
        } catch (error) {
            console.error('Cache get error:', error);
            this.updateStats(false);
            return null;
        }
    }

    async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
        try {
            let serializedValue: string;

            if (options.serialize !== false && typeof value === 'object') {
                serializedValue = JSON.stringify(value);
            } else {
                serializedValue = String(value);
            }

            if (options.ttl) {
                await this.client.setex(key, options.ttl, serializedValue);
            } else {
                await this.client.set(key, serializedValue);
            }
        } catch (error) {
            console.error('Cache set error:', error);
            throw error;
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
            throw error;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }

    async expire(key: string, ttl: number): Promise<void> {
        try {
            await this.client.expire(key, ttl);
        } catch (error) {
            console.error('Cache expire error:', error);
            throw error;
        }
    }

    async increment(key: string, value: number = 1): Promise<number> {
        try {
            return await this.client.incrby(key, value);
        } catch (error) {
            console.error('Cache increment error:', error);
            throw error;
        }
    }

    async decrement(key: string, value: number = 1): Promise<number> {
        try {
            return await this.client.decrby(key, value);
        } catch (error) {
            console.error('Cache decrement error:', error);
            throw error;
        }
    }

    async mget(keys: string[]): Promise<(any | null)[]> {
        try {
            const values = await this.client.mget(...keys);
            return values.map(value => {
                if (value === null) return null;
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            });
        } catch (error) {
            console.error('Cache mget error:', error);
            return keys.map(() => null);
        }
    }

    async mset(keyValues: Record<string, any>, options: CacheOptions = {}): Promise<void> {
        try {
            const pipeline = this.client.pipeline();

            for (const [key, value] of Object.entries(keyValues)) {
                let serializedValue: string;

                if (options.serialize !== false && typeof value === 'object') {
                    serializedValue = JSON.stringify(value);
                } else {
                    serializedValue = String(value);
                }

                if (options.ttl) {
                    pipeline.setex(key, options.ttl, serializedValue);
                } else {
                    pipeline.set(key, serializedValue);
                }
            }

            await pipeline.exec();
        } catch (error) {
            console.error('Cache mset error:', error);
            throw error;
        }
    }

    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            console.error('Cache keys error:', error);
            return [];
        }
    }

    async flush(): Promise<void> {
        try {
            await this.client.flushdb();
        } catch (error) {
            console.error('Cache flush error:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
        } catch (error) {
            console.error('Cache disconnect error:', error);
        }
    }

    getStats(): CacheStats {
        return { ...this.stats };
    }

    private updateStats(hit: boolean): void {
        this.stats.totalOperations++;
        if (hit) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        this.stats.hitRate = this.stats.hits / this.stats.totalOperations;
    }
}

// In-memory cache implementation for testing
export class InMemoryCacheService implements CacheService {
    private cache: Map<string, { value: any; expiresAt?: number }> = new Map();
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalOperations: 0,
    };

    async get<T = any>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);

        if (!entry) {
            this.updateStats(false);
            return null;
        }

        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            this.updateStats(false);
            return null;
        }

        this.updateStats(true);
        return entry.value as T;
    }

    async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
        const expiresAt = options.ttl ? Date.now() + (options.ttl * 1000) : undefined;
        this.cache.set(key, { value, expiresAt });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async exists(key: string): Promise<boolean> {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    async expire(key: string, ttl: number): Promise<void> {
        const entry = this.cache.get(key);
        if (entry) {
            entry.expiresAt = Date.now() + (ttl * 1000);
        }
    }

    async increment(key: string, value: number = 1): Promise<number> {
        const current = await this.get<number>(key) || 0;
        const newValue = current + value;
        await this.set(key, newValue);
        return newValue;
    }

    async decrement(key: string, value: number = 1): Promise<number> {
        const current = await this.get<number>(key) || 0;
        const newValue = current - value;
        await this.set(key, newValue);
        return newValue;
    }

    async mget(keys: string[]): Promise<(any | null)[]> {
        return Promise.all(keys.map(key => this.get(key)));
    }

    async mset(keyValues: Record<string, any>, options: CacheOptions = {}): Promise<void> {
        for (const [key, value] of Object.entries(keyValues)) {
            await this.set(key, value, options);
        }
    }

    async keys(pattern: string): Promise<string[]> {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Array.from(this.cache.keys()).filter(key => regex.test(key));
    }

    async flush(): Promise<void> {
        this.cache.clear();
    }

    async disconnect(): Promise<void> {
        // No-op for in-memory cache
    }

    getStats(): CacheStats {
        return { ...this.stats };
    }

    private updateStats(hit: boolean): void {
        this.stats.totalOperations++;
        if (hit) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        this.stats.hitRate = this.stats.hits / this.stats.totalOperations;
    }
}