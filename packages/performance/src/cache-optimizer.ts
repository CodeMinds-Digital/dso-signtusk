import { CacheOptimization, CacheInvalidationStrategy } from './types';

export interface CacheEntry {
    key: string;
    value: any;
    size: number; // bytes
    ttl: number; // seconds
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    hitCount: number;
    missCount: number;
}

export interface CacheStats {
    totalKeys: number;
    totalSize: number; // bytes
    hitRate: number; // percentage
    averageAccessTime: number; // milliseconds
    evictionRate: number; // evictions per hour
    memoryUsage: number; // percentage
}

export class CacheOptimizer {
    private cacheEntries = new Map<string, CacheEntry>();
    private accessHistory: Array<{ key: string; timestamp: Date; hit: boolean; responseTime: number }> = [];
    private evictionHistory: Array<{ key: string; timestamp: Date; reason: string }> = [];
    private maxHistorySize = 10000;

    recordCacheAccess(key: string, hit: boolean, responseTime: number, value?: any, size?: number): void {
        const timestamp = new Date();

        // Record access history
        this.accessHistory.push({ key, timestamp, hit, responseTime });
        if (this.accessHistory.length > this.maxHistorySize) {
            this.accessHistory = this.accessHistory.slice(-this.maxHistorySize);
        }

        // Update or create cache entry
        let entry = this.cacheEntries.get(key);
        if (!entry && hit && value !== undefined && size !== undefined) {
            entry = {
                key,
                value,
                size,
                ttl: 3600, // Default 1 hour
                createdAt: timestamp,
                lastAccessed: timestamp,
                accessCount: 1,
                hitCount: hit ? 1 : 0,
                missCount: hit ? 0 : 1,
            };
            this.cacheEntries.set(key, entry);
        } else if (entry) {
            entry.lastAccessed = timestamp;
            entry.accessCount++;
            if (hit) {
                entry.hitCount++;
            } else {
                entry.missCount++;
            }
        }
    }

    recordCacheEviction(key: string, reason: string): void {
        this.evictionHistory.push({
            key,
            timestamp: new Date(),
            reason,
        });

        if (this.evictionHistory.length > this.maxHistorySize) {
            this.evictionHistory = this.evictionHistory.slice(-this.maxHistorySize);
        }

        this.cacheEntries.delete(key);
    }

    getCacheStats(): CacheStats {
        const entries = Array.from(this.cacheEntries.values());
        const recentAccesses = this.accessHistory.filter(
            access => Date.now() - access.timestamp.getTime() < 3600000 // Last hour
        );

        const totalHits = recentAccesses.filter(a => a.hit).length;
        const totalAccesses = recentAccesses.length;
        const hitRate = totalAccesses > 0 ? (totalHits / totalAccesses) * 100 : 0;

        const averageAccessTime = recentAccesses.length > 0
            ? recentAccesses.reduce((sum, a) => sum + a.responseTime, 0) / recentAccesses.length
            : 0;

        const recentEvictions = this.evictionHistory.filter(
            eviction => Date.now() - eviction.timestamp.getTime() < 3600000 // Last hour
        );

        return {
            totalKeys: entries.length,
            totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
            hitRate,
            averageAccessTime,
            evictionRate: recentEvictions.length,
            memoryUsage: this.calculateMemoryUsage(),
        };
    }

    private calculateMemoryUsage(): number {
        // Simplified memory usage calculation
        // In a real implementation, this would query the actual cache system
        const totalSize = Array.from(this.cacheEntries.values())
            .reduce((sum, entry) => sum + entry.size, 0);

        const maxMemory = 1024 * 1024 * 1024; // 1GB default
        return (totalSize / maxMemory) * 100;
    }

    analyzeCachePerformance(): CacheOptimization[] {
        const optimizations: CacheOptimization[] = [];
        const entries = Array.from(this.cacheEntries.values());

        // Analyze individual cache entries
        for (const entry of entries) {
            const hitRate = entry.accessCount > 0
                ? (entry.hitCount / entry.accessCount) * 100
                : 0;

            const accessFrequency = this.calculateAccessFrequency(entry.key);
            const ageInHours = (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60);

            // Low hit rate optimization
            if (hitRate < 50 && entry.accessCount > 10) {
                optimizations.push({
                    key: entry.key,
                    hitRate,
                    accessFrequency,
                    size: entry.size,
                    ttl: entry.ttl,
                    recommendation: 'remove',
                });
            }

            // High access frequency with reasonable hit rate - increase TTL
            if (accessFrequency > 10 && hitRate > 70 && entry.ttl < 3600) {
                optimizations.push({
                    key: entry.key,
                    hitRate,
                    accessFrequency,
                    size: entry.size,
                    ttl: entry.ttl,
                    recommendation: 'increase-ttl',
                });
            }

            // Low access frequency - decrease TTL or remove
            if (accessFrequency < 1 && ageInHours > 24) {
                optimizations.push({
                    key: entry.key,
                    hitRate,
                    accessFrequency,
                    size: entry.size,
                    ttl: entry.ttl,
                    recommendation: entry.size > 1024 * 1024 ? 'remove' : 'decrease-ttl', // Remove if > 1MB
                });
            }

            // Large entries with low hit rate
            if (entry.size > 10 * 1024 * 1024 && hitRate < 80) { // > 10MB
                optimizations.push({
                    key: entry.key,
                    hitRate,
                    accessFrequency,
                    size: entry.size,
                    ttl: entry.ttl,
                    recommendation: 'optimize-size',
                });
            }
        }

        return optimizations;
    }

    private calculateAccessFrequency(key: string): number {
        const oneHourAgo = Date.now() - 3600000;
        const recentAccesses = this.accessHistory.filter(
            access => access.key === key && access.timestamp.getTime() > oneHourAgo
        );
        return recentAccesses.length;
    }

    suggestInvalidationStrategy(key: string): CacheInvalidationStrategy {
        const entry = this.cacheEntries.get(key);
        if (!entry) {
            return {
                type: 'manual',
                config: {},
            };
        }

        const accessFrequency = this.calculateAccessFrequency(key);
        const hitRate = entry.accessCount > 0
            ? (entry.hitCount / entry.accessCount) * 100
            : 0;

        // High frequency, high hit rate - use TTL with longer duration
        if (accessFrequency > 20 && hitRate > 80) {
            return {
                type: 'ttl',
                config: {
                    ttl: Math.max(entry.ttl * 2, 7200), // At least 2 hours
                },
            };
        }

        // Medium frequency - use LRU
        if (accessFrequency > 5 && accessFrequency <= 20) {
            return {
                type: 'lru',
                config: {
                    maxSize: 1000,
                },
            };
        }

        // Low frequency - use LFU
        if (accessFrequency <= 5) {
            return {
                type: 'lfu',
                config: {
                    maxSize: 500,
                },
            };
        }

        // Event-based for frequently changing data
        if (this.isFrequentlyChangingData(key)) {
            return {
                type: 'event-based',
                config: {
                    events: ['update', 'delete'],
                    patterns: [key.replace(/:\d+$/, ':*')], // Pattern matching
                },
            };
        }

        return {
            type: 'ttl',
            config: {
                ttl: entry.ttl,
            },
        };
    }

    private isFrequentlyChangingData(key: string): boolean {
        // Heuristics to determine if data changes frequently
        const patterns = [
            /user:\d+:session/,
            /cart:\d+/,
            /temp:/,
            /lock:/,
            /counter:/,
        ];

        return patterns.some(pattern => pattern.test(key));
    }

    generateCacheReport(): {
        summary: CacheStats;
        topPerformingKeys: Array<{ key: string; hitRate: number; accessCount: number }>;
        underperformingKeys: Array<{ key: string; hitRate: number; accessCount: number; size: number }>;
        optimizations: CacheOptimization[];
        recommendations: string[];
    } {
        const stats = this.getCacheStats();
        const optimizations = this.analyzeCachePerformance();
        const entries = Array.from(this.cacheEntries.values());

        // Top performing keys
        const topPerforming = entries
            .map(entry => ({
                key: entry.key,
                hitRate: entry.accessCount > 0 ? (entry.hitCount / entry.accessCount) * 100 : 0,
                accessCount: entry.accessCount,
            }))
            .filter(item => item.accessCount > 5)
            .sort((a, b) => b.hitRate - a.hitRate)
            .slice(0, 10);

        // Underperforming keys
        const underperforming = entries
            .map(entry => ({
                key: entry.key,
                hitRate: entry.accessCount > 0 ? (entry.hitCount / entry.accessCount) * 100 : 0,
                accessCount: entry.accessCount,
                size: entry.size,
            }))
            .filter(item => item.hitRate < 50 && item.accessCount > 5)
            .sort((a, b) => a.hitRate - b.hitRate)
            .slice(0, 10);

        const recommendations = [
            `Current hit rate: ${stats.hitRate.toFixed(1)}% ${stats.hitRate < 80 ? '(Consider optimization)' : '(Good)'}`,
            `Memory usage: ${stats.memoryUsage.toFixed(1)}% ${stats.memoryUsage > 80 ? '(Consider cleanup)' : '(Acceptable)'}`,
            `Average access time: ${stats.averageAccessTime.toFixed(1)}ms ${stats.averageAccessTime > 10 ? '(Consider optimization)' : '(Good)'}`,
            'Implement cache warming for frequently accessed data',
            'Use appropriate TTL values based on data volatility',
            'Consider cache partitioning for different data types',
            'Monitor and alert on cache hit rate degradation',
            'Implement intelligent cache preloading for predictable access patterns',
        ];

        return {
            summary: stats,
            topPerformingKeys: topPerforming,
            underperformingKeys: underperforming,
            optimizations,
            recommendations,
        };
    }

    // Cache warming utilities
    identifyWarmingCandidates(): Array<{
        key: string;
        pattern: string;
        frequency: number;
        predictedNextAccess: Date;
        priority: 'high' | 'medium' | 'low';
    }> {
        const candidates: Array<{
            key: string;
            pattern: string;
            frequency: number;
            predictedNextAccess: Date;
            priority: 'high' | 'medium' | 'low';
        }> = [];

        const keyPatterns = this.groupKeysByPattern();

        for (const [pattern, keys] of keyPatterns) {
            const totalAccesses = keys.reduce((sum, key) => {
                const entry = this.cacheEntries.get(key);
                return sum + (entry?.accessCount || 0);
            }, 0);

            const averageFrequency = totalAccesses / keys.length;

            if (averageFrequency > 5) {
                for (const key of keys) {
                    const entry = this.cacheEntries.get(key);
                    if (entry) {
                        const timeSinceLastAccess = Date.now() - entry.lastAccessed.getTime();
                        const averageAccessInterval = timeSinceLastAccess / entry.accessCount;

                        candidates.push({
                            key,
                            pattern,
                            frequency: averageFrequency,
                            predictedNextAccess: new Date(Date.now() + averageAccessInterval),
                            priority: averageFrequency > 20 ? 'high' : averageFrequency > 10 ? 'medium' : 'low',
                        });
                    }
                }
            }
        }

        return candidates.sort((a, b) => b.frequency - a.frequency);
    }

    private groupKeysByPattern(): Map<string, string[]> {
        const patterns = new Map<string, string[]>();

        for (const key of this.cacheEntries.keys()) {
            const pattern = this.extractKeyPattern(key);
            if (!patterns.has(pattern)) {
                patterns.set(pattern, []);
            }
            patterns.get(pattern)!.push(key);
        }

        return patterns;
    }

    private extractKeyPattern(key: string): string {
        // Extract pattern by replacing IDs and timestamps with placeholders
        return key
            .replace(/:\d+/g, ':*') // Replace numeric IDs
            .replace(/:[a-f0-9-]{36}/g, ':*') // Replace UUIDs
            .replace(/:\d{4}-\d{2}-\d{2}/g, ':*') // Replace dates
            .replace(/:\d{10,13}/g, ':*'); // Replace timestamps
    }

    // Intelligent cache preloading
    createPreloadingStrategy(): {
        schedule: Array<{
            pattern: string;
            time: string; // cron expression
            priority: number;
            estimatedBenefit: string;
        }>;
        triggers: Array<{
            event: string;
            keys: string[];
            condition: string;
        }>;
    } {
        const candidates = this.identifyWarmingCandidates();
        const schedule: Array<{
            pattern: string;
            time: string;
            priority: number;
            estimatedBenefit: string;
        }> = [];
        const triggers: Array<{
            event: string;
            keys: string[];
            condition: string;
        }> = [];

        // Create schedule for high-frequency patterns
        const highFrequencyPatterns = candidates
            .filter(c => c.priority === 'high')
            .reduce((acc, c) => {
                if (!acc.has(c.pattern)) {
                    acc.set(c.pattern, []);
                }
                acc.get(c.pattern)!.push(c);
                return acc;
            }, new Map<string, typeof candidates>());

        for (const [pattern, items] of highFrequencyPatterns) {
            const avgFrequency = items.reduce((sum, item) => sum + item.frequency, 0) / items.length;

            schedule.push({
                pattern,
                time: avgFrequency > 50 ? '*/5 * * * *' : '*/15 * * * *', // Every 5 or 15 minutes
                priority: Math.round(avgFrequency),
                estimatedBenefit: `Reduce cache misses by ${Math.min(avgFrequency * 2, 90)}%`,
            });
        }

        // Create event-based triggers
        const eventPatterns = [
            { pattern: 'user:*:profile', event: 'user.login', condition: 'user.isActive' },
            { pattern: 'document:*:metadata', event: 'document.access', condition: 'document.isPublic' },
            { pattern: 'template:*:fields', event: 'template.use', condition: 'template.isActive' },
        ];

        for (const eventPattern of eventPatterns) {
            const matchingKeys = Array.from(this.cacheEntries.keys())
                .filter(key => this.matchesPattern(key, eventPattern.pattern));

            if (matchingKeys.length > 0) {
                triggers.push({
                    event: eventPattern.event,
                    keys: matchingKeys,
                    condition: eventPattern.condition,
                });
            }
        }

        return { schedule, triggers };
    }

    private matchesPattern(key: string, pattern: string): boolean {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '[^:]+') + '$');
        return regex.test(key);
    }
}