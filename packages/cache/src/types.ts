import { z } from 'zod';

export const CacheConfigSchema = z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    keyPrefix: z.string().default('docusign-alt:'),
    maxRetriesPerRequest: z.number().default(3),
    enableReadyCheck: z.boolean().default(true),
    lazyConnect: z.boolean().default(true),
    cluster: z.object({
        enabled: z.boolean().default(false),
        nodes: z.array(z.object({
            host: z.string(),
            port: z.number(),
        })).optional(),
        retryDelayOnClusterDown: z.number().default(100).optional(),
    }).optional(),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
    compress?: boolean;
    serialize?: boolean;
}

export interface CacheService {
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, options?: CacheOptions): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    increment(key: string, value?: number): Promise<number>;
    decrement(key: string, value?: number): Promise<number>;
    mget(keys: string[]): Promise<(any | null)[]>;
    mset(keyValues: Record<string, any>, options?: CacheOptions): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    flush(): Promise<void>;
    disconnect(): Promise<void>;
}

export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalOperations: number;
}