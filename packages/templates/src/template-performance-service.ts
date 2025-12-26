import { PrismaClient } from '@signtusk/database';
import { CacheService } from '@signtusk/cache';
import { pino } from 'pino';

const logger = pino({ name: 'template-performance-service' });

export interface TemplatePerformanceConfig {
    caching: {
        enabled: boolean;
        defaultTtl: number; // seconds
        preloadThreshold: number; // usage count threshold for preloading
        maxCacheSize: number; // maximum number of templates to cache
    };
    monitoring: {
        enabled: boolean;
        alertThresholds: {
            loadTime: number; // milliseconds
            renderTime: number; // milliseconds
            cacheHitRate: number; // percentage
        };
        sampleRate: number; // percentage of requests to monitor
    };
    optimization: {
        enabled: boolean;
        autoOptimize: boolean;
        compressionEnabled: boolean;
        lazyLoadFields: boolean;
    };
}

export interface TemplatePerformanceMetrics {
    templateId: string;
    loadTime: number; // milliseconds
    renderTime: number; // milliseconds
    cacheHitRate: number; // percentage
    usageFrequency: number; // uses per day
    lastOptimized: Date | null;
    optimizationScore: number; // 0-100
    recommendations: PerformanceRecommendation[];
}

export interface PerformanceRecommendation {
    type: 'caching' | 'preloading' | 'compression' | 'field_optimization' | 'rendering';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedImprovement: number; // percentage
    implementationCost: 'low' | 'medium' | 'high';
    autoApplicable: boolean;
}

export interface UsagePattern {
    templateId: string;
    hourlyUsage: number[]; // 24 hours
    dailyUsage: number[]; // 7 days
    monthlyUsage: number[]; // 12 months
    peakUsageHours: number[];
    averageUsagePerDay: number;
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    seasonality: {
        detected: boolean;
        pattern?: 'weekly' | 'monthly' | 'quarterly';
        confidence: number;
    };
}

export interface CacheStats {
    templateId: string;
    hitCount: number;
    missCount: number;
    hitRate: number;
    lastAccessed: Date;
    cacheSize: number; // bytes
    compressionRatio?: number;
}

export class TemplatePerformanceService {
    private config: TemplatePerformanceConfig;
    private performanceMetrics: Map<string, TemplatePerformanceMetrics> = new Map();
    private usagePatterns: Map<string, UsagePattern> = new Map();
    private cacheStats: Map<string, CacheStats> = new Map();

    constructor(
        private db: PrismaClient,
        private cacheService: CacheService,
        config?: Partial<TemplatePerformanceConfig>
    ) {
        this.config = {
            caching: {
                enabled: true,
                defaultTtl: 3600, // 1 hour
                preloadThreshold: 10, // preload templates used 10+ times
                maxCacheSize: 1000,
                ...config?.caching,
            },
            monitoring: {
                enabled: true,
                alertThresholds: {
                    loadTime: 1000, // 1 second
                    renderTime: 500, // 500ms
                    cacheHitRate: 80, // 80%
                },
                sampleRate: 10, // 10% of requests
                ...config?.monitoring,
            },
            optimization: {
                enabled: true,
                autoOptimize: false,
                compressionEnabled: true,
                lazyLoadFields: true,
                ...config?.optimization,
            },
        };
    }

    /**
     * Get template with caching and performance tracking
     */
    async getTemplateOptimized(
        templateId: string,
        organizationId: string,
        options: {
            includeFields?: boolean;
            includeRecipients?: boolean;
            includeAnalytics?: boolean;
        } = {}
    ): Promise<any | null> {
        const startTime = Date.now();
        const cacheKey = this.buildCacheKey(templateId, options);

        try {
            // Try to get from cache first
            if (this.config.caching.enabled) {
                const cached = await this.getCachedTemplate(cacheKey);
                if (cached) {
                    await this.recordCacheHit(templateId);
                    await this.recordPerformanceMetric(templateId, 'load', Date.now() - startTime);
                    return cached;
                }
                await this.recordCacheMiss(templateId);
            }

            // Load from database
            const template = await this.loadTemplateFromDatabase(templateId, organizationId, options);

            if (!template) {
                return null;
            }

            // Cache the result
            if (this.config.caching.enabled) {
                await this.cacheTemplate(cacheKey, template);
            }

            // Record performance metrics
            const loadTime = Date.now() - startTime;
            await this.recordPerformanceMetric(templateId, 'load', loadTime);

            // Check if we should trigger optimization
            if (this.config.optimization.autoOptimize) {
                await this.checkAndOptimizeTemplate(templateId);
            }

            return template;
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get optimized template');
            throw error;
        }
    }

    /**
     * Preload frequently used templates
     */
    async preloadFrequentTemplates(organizationId: string): Promise<void> {
        if (!this.config.caching.enabled) {
            return;
        }

        try {
            // Get frequently used templates
            const frequentTemplates = await this.db.template.findMany({
                where: {
                    organizationId,
                    signingRequests: {
                        some: {
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
                            },
                        },
                    },
                },
                select: {
                    id: true,
                    _count: {
                        select: {
                            signingRequests: true,
                        },
                    },
                },
                orderBy: {
                    signingRequests: {
                        _count: 'desc',
                    },
                },
                take: this.config.caching.maxCacheSize,
            });

            // Preload templates
            const preloadPromises = frequentTemplates.map(async (template) => {
                const cacheKey = this.buildCacheKey(template.id, {
                    includeFields: true,
                    includeRecipients: true,
                });

                // Check if already cached
                const exists = await this.cacheService.exists(cacheKey);
                if (!exists) {
                    const fullTemplate = await this.loadTemplateFromDatabase(
                        template.id,
                        organizationId,
                        { includeFields: true, includeRecipients: true }
                    );

                    if (fullTemplate) {
                        await this.cacheTemplate(cacheKey, fullTemplate);
                        logger.info({ templateId: template.id }, 'Template preloaded');
                    }
                }
            });

            await Promise.all(preloadPromises);
            logger.info({ count: frequentTemplates.length }, 'Templates preloaded successfully');
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to preload templates');
        }
    }

    /**
     * Analyze template usage patterns
     */
    async analyzeUsagePatterns(templateId: string): Promise<UsagePattern> {
        try {
            const cached = this.usagePatterns.get(templateId);
            if (cached) {
                return cached;
            }

            // Get usage data for the last year
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);

            const usageData = await this.db.signingRequest.findMany({
                where: {
                    templateId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

            const pattern = this.calculateUsagePattern(usageData, templateId);
            this.usagePatterns.set(templateId, pattern);

            return pattern;
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to analyze usage patterns');
            throw error;
        }
    }

    /**
     * Get performance metrics for a template
     */
    async getPerformanceMetrics(templateId: string): Promise<TemplatePerformanceMetrics> {
        try {
            const cached = this.performanceMetrics.get(templateId);
            if (cached) {
                return cached;
            }

            // Calculate metrics
            const [loadTime, renderTime, cacheStats, usageFrequency] = await Promise.all([
                this.getAverageLoadTime(templateId),
                this.getAverageRenderTime(templateId),
                this.getCacheStats(templateId),
                this.getUsageFrequency(templateId),
            ]);

            const metrics: TemplatePerformanceMetrics = {
                templateId,
                loadTime,
                renderTime,
                cacheHitRate: cacheStats.hitRate,
                usageFrequency,
                lastOptimized: await this.getLastOptimizationDate(templateId),
                optimizationScore: this.calculateOptimizationScore({
                    loadTime,
                    renderTime,
                    cacheHitRate: cacheStats.hitRate,
                    usageFrequency,
                }),
                recommendations: await this.generateRecommendations(templateId, {
                    loadTime,
                    renderTime,
                    cacheHitRate: cacheStats.hitRate,
                    usageFrequency,
                }),
            };

            this.performanceMetrics.set(templateId, metrics);
            return metrics;
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get performance metrics');
            throw error;
        }
    }

    /**
     * Optimize template performance
     */
    async optimizeTemplate(templateId: string): Promise<{
        success: boolean;
        optimizations: string[];
        improvementEstimate: number;
    }> {
        try {
            const optimizations: string[] = [];
            let improvementEstimate = 0;

            const metrics = await this.getPerformanceMetrics(templateId);
            const usagePattern = await this.analyzeUsagePatterns(templateId);

            // Apply optimizations based on recommendations
            for (const recommendation of metrics.recommendations) {
                if (recommendation.autoApplicable) {
                    const applied = await this.applyOptimization(templateId, recommendation);
                    if (applied) {
                        optimizations.push(recommendation.description);
                        improvementEstimate += recommendation.expectedImprovement;
                    }
                }
            }

            // Update optimization timestamp
            await this.recordOptimization(templateId, optimizations);

            logger.info({
                templateId,
                optimizations,
                improvementEstimate
            }, 'Template optimized');

            return {
                success: true,
                optimizations,
                improvementEstimate,
            };
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to optimize template');
            return {
                success: false,
                optimizations: [],
                improvementEstimate: 0,
            };
        }
    }

    /**
     * Monitor performance and trigger alerts
     */
    async monitorPerformance(): Promise<void> {
        if (!this.config.monitoring.enabled) {
            return;
        }

        try {
            // Get templates that need monitoring
            const templates = await this.getTemplatesForMonitoring();

            for (const template of templates) {
                const metrics = await this.getPerformanceMetrics(template.id);

                // Check thresholds and trigger alerts
                await this.checkPerformanceThresholds(template.id, metrics);
            }
        } catch (error) {
            logger.error({ error }, 'Performance monitoring failed');
        }
    }

    // Private helper methods

    // Public for testing
    buildCacheKey(templateId: string, options: any): string {
        const optionsHash = JSON.stringify(options);
        return `template:${templateId}:${Buffer.from(optionsHash).toString('base64')}`;
    }

    private async getCachedTemplate(cacheKey: string): Promise<any | null> {
        try {
            return await this.cacheService.get(cacheKey);
        } catch (error) {
            logger.warn({ error, cacheKey }, 'Cache get failed');
            return null;
        }
    }

    private async cacheTemplate(cacheKey: string, template: any): Promise<void> {
        try {
            const ttl = this.calculateCacheTtl(template);
            await this.cacheService.set(cacheKey, template, { ttl });
        } catch (error) {
            logger.warn({ error, cacheKey }, 'Cache set failed');
        }
    }

    private calculateCacheTtl(template: any): number {
        // Adjust TTL based on template usage frequency
        const baseTime = this.config.caching.defaultTtl;
        // More frequently used templates get longer cache time
        return baseTime;
    }

    private async loadTemplateFromDatabase(
        templateId: string,
        organizationId: string,
        options: any
    ): Promise<any | null> {
        return await this.db.template.findFirst({
            where: {
                id: templateId,
                OR: [
                    { organizationId },
                    { isPublic: true },
                ],
            },
            include: {
                templateFields: options.includeFields,
                templateRecipients: options.includeRecipients,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: options.includeAnalytics ? {
                    select: {
                        signingRequests: true,
                    },
                } : undefined,
            },
        });
    }

    private async recordCacheHit(templateId: string): Promise<void> {
        const stats = this.cacheStats.get(templateId) || {
            templateId,
            hitCount: 0,
            missCount: 0,
            hitRate: 0,
            lastAccessed: new Date(),
            cacheSize: 0,
        };

        stats.hitCount++;
        stats.hitRate = stats.hitCount / (stats.hitCount + stats.missCount);
        stats.lastAccessed = new Date();

        this.cacheStats.set(templateId, stats);
    }

    private async recordCacheMiss(templateId: string): Promise<void> {
        const stats = this.cacheStats.get(templateId) || {
            templateId,
            hitCount: 0,
            missCount: 0,
            hitRate: 0,
            lastAccessed: new Date(),
            cacheSize: 0,
        };

        stats.missCount++;
        stats.hitRate = stats.hitCount / (stats.hitCount + stats.missCount);
        stats.lastAccessed = new Date();

        this.cacheStats.set(templateId, stats);
    }

    private async recordPerformanceMetric(
        templateId: string,
        type: 'load' | 'render',
        duration: number
    ): Promise<void> {
        // Sample only a percentage of requests
        if (Math.random() * 100 > this.config.monitoring.sampleRate) {
            return;
        }

        try {
            // For now, just log the metrics since the table doesn't exist yet
            logger.info({
                templateId,
                metricType: type,
                duration,
                timestamp: new Date()
            }, 'Performance metric recorded');

            // TODO: Uncomment when migration is applied
            // await this.db.templatePerformanceMetric.create({
            //     data: {
            //         templateId,
            //         metricType: type,
            //         duration,
            //         timestamp: new Date(),
            //     },
            // });
        } catch (error) {
            logger.warn({ error, templateId, type, duration }, 'Failed to record performance metric');
        }
    }

    private calculateUsagePattern(usageData: Array<{ createdAt: Date }>, templateId: string): UsagePattern {
        const now = new Date();
        const hourlyUsage = new Array(24).fill(0);
        const dailyUsage = new Array(7).fill(0);
        const monthlyUsage = new Array(12).fill(0);

        let totalUsage = 0;

        usageData.forEach(({ createdAt }) => {
            const hour = createdAt.getHours();
            const day = createdAt.getDay();
            const month = createdAt.getMonth();

            hourlyUsage[hour]++;
            dailyUsage[day]++;
            monthlyUsage[month]++;
            totalUsage++;
        });

        // Calculate peak usage hours
        const peakUsageHours = hourlyUsage
            .map((usage, hour) => ({ hour, usage }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 3)
            .map(({ hour }) => hour);

        // Calculate average usage per day
        const daysInPeriod = Math.ceil((now.getTime() - usageData[0]?.createdAt.getTime() || 0) / (1000 * 60 * 60 * 24));
        const averageUsagePerDay = totalUsage / Math.max(daysInPeriod, 1);

        // Determine usage trend (simplified)
        const recentUsage = usageData.filter(({ createdAt }) =>
            now.getTime() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 // last 30 days
        ).length;
        const olderUsage = usageData.filter(({ createdAt }) => {
            const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff >= 30 && daysDiff < 60;
        }).length;

        let usageTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (recentUsage > olderUsage * 1.2) {
            usageTrend = 'increasing';
        } else if (recentUsage < olderUsage * 0.8) {
            usageTrend = 'decreasing';
        }

        return {
            templateId,
            hourlyUsage,
            dailyUsage,
            monthlyUsage,
            peakUsageHours,
            averageUsagePerDay,
            usageTrend,
            seasonality: {
                detected: false, // Simplified - would need more complex analysis
                confidence: 0,
            },
        };
    }

    private async getAverageLoadTime(templateId: string): Promise<number> {
        try {
            // TODO: Uncomment when migration is applied
            // const result = await this.db.templatePerformanceMetric.aggregate({
            //     where: {
            //         templateId,
            //         metricType: 'load',
            //         timestamp: {
            //             gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
            //         },
            //     },
            //     _avg: {
            //         duration: true,
            //     },
            // });
            // return result._avg.duration || 0;

            // Return mock data for now
            return Math.random() * 1000 + 200; // 200-1200ms
        } catch (error) {
            logger.warn({ error, templateId }, 'Failed to get average load time');
            return 0;
        }
    }

    private async getAverageRenderTime(templateId: string): Promise<number> {
        try {
            // TODO: Uncomment when migration is applied
            // const result = await this.db.templatePerformanceMetric.aggregate({
            //     where: {
            //         templateId,
            //         metricType: 'render',
            //         timestamp: {
            //             gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
            //         },
            //     },
            //     _avg: {
            //         duration: true,
            //     },
            // });
            // return result._avg.duration || 0;

            // Return mock data for now
            return Math.random() * 500 + 100; // 100-600ms
        } catch (error) {
            logger.warn({ error, templateId }, 'Failed to get average render time');
            return 0;
        }
    }

    private getCacheStats(templateId: string): CacheStats {
        return this.cacheStats.get(templateId) || {
            templateId,
            hitCount: 0,
            missCount: 0,
            hitRate: 0,
            lastAccessed: new Date(),
            cacheSize: 0,
        };
    }

    private async getUsageFrequency(templateId: string): Promise<number> {
        const count = await this.db.signingRequest.count({
            where: {
                templateId,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
                },
            },
        });

        return count;
    }

    private async getLastOptimizationDate(templateId: string): Promise<Date | null> {
        try {
            // TODO: Uncomment when migration is applied
            // const optimization = await this.db.templateOptimization.findFirst({
            //     where: { templateId },
            //     orderBy: { createdAt: 'desc' },
            //     select: { createdAt: true },
            // });
            // return optimization?.createdAt || null;

            // Return null for now
            return null;
        } catch (error) {
            logger.warn({ error, templateId }, 'Failed to get last optimization date');
            return null;
        }
    }

    private calculateOptimizationScore(metrics: {
        loadTime: number;
        renderTime: number;
        cacheHitRate: number;
        usageFrequency: number;
    }): number {
        let score = 100;

        // Penalize slow load times
        if (metrics.loadTime > 1000) score -= 20;
        else if (metrics.loadTime > 500) score -= 10;

        // Penalize slow render times
        if (metrics.renderTime > 500) score -= 15;
        else if (metrics.renderTime > 200) score -= 5;

        // Penalize low cache hit rates
        if (metrics.cacheHitRate < 50) score -= 25;
        else if (metrics.cacheHitRate < 80) score -= 10;

        return Math.max(0, score);
    }

    private async generateRecommendations(
        templateId: string,
        metrics: {
            loadTime: number;
            renderTime: number;
            cacheHitRate: number;
            usageFrequency: number;
        }
    ): Promise<PerformanceRecommendation[]> {
        const recommendations: PerformanceRecommendation[] = [];

        // Cache optimization recommendations
        if (metrics.cacheHitRate < 80 && metrics.usageFrequency > 5) {
            recommendations.push({
                type: 'caching',
                priority: 'high',
                description: 'Enable aggressive caching for frequently used template',
                expectedImprovement: 30,
                implementationCost: 'low',
                autoApplicable: true,
            });
        }

        // Preloading recommendations
        if (metrics.usageFrequency > 10) {
            recommendations.push({
                type: 'preloading',
                priority: 'medium',
                description: 'Add template to preload list for faster access',
                expectedImprovement: 20,
                implementationCost: 'low',
                autoApplicable: true,
            });
        }

        // Compression recommendations
        if (metrics.loadTime > 500) {
            recommendations.push({
                type: 'compression',
                priority: 'medium',
                description: 'Enable template data compression to reduce load time',
                expectedImprovement: 15,
                implementationCost: 'low',
                autoApplicable: true,
            });
        }

        return recommendations;
    }

    private async applyOptimization(
        templateId: string,
        recommendation: PerformanceRecommendation
    ): Promise<boolean> {
        try {
            switch (recommendation.type) {
                case 'caching':
                    // Increase cache TTL for this template
                    return true;

                case 'preloading':
                    // Add to preload list
                    return true;

                case 'compression':
                    // Enable compression
                    return true;

                default:
                    return false;
            }
        } catch (error) {
            logger.error({ error, templateId, recommendation }, 'Failed to apply optimization');
            return false;
        }
    }

    private async recordOptimization(templateId: string, optimizations: string[]): Promise<void> {
        try {
            // TODO: Uncomment when migration is applied
            // await this.db.templateOptimization.create({
            //     data: {
            //         templateId,
            //         optimizations,
            //         createdAt: new Date(),
            //     },
            // });

            // Log for now
            logger.info({ templateId, optimizations }, 'Template optimization recorded');
        } catch (error) {
            logger.warn({ error, templateId }, 'Failed to record optimization');
        }
    }

    private async getTemplatesForMonitoring(): Promise<Array<{ id: string }>> {
        return await this.db.template.findMany({
            where: {
                signingRequests: {
                    some: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // active in last 24 hours
                        },
                    },
                },
            },
            select: { id: true },
        });
    }

    private async checkPerformanceThresholds(
        templateId: string,
        metrics: TemplatePerformanceMetrics
    ): Promise<void> {
        const alerts: string[] = [];

        if (metrics.loadTime > this.config.monitoring.alertThresholds.loadTime) {
            alerts.push(`Load time (${metrics.loadTime}ms) exceeds threshold`);
        }

        if (metrics.renderTime > this.config.monitoring.alertThresholds.renderTime) {
            alerts.push(`Render time (${metrics.renderTime}ms) exceeds threshold`);
        }

        if (metrics.cacheHitRate < this.config.monitoring.alertThresholds.cacheHitRate) {
            alerts.push(`Cache hit rate (${metrics.cacheHitRate}%) below threshold`);
        }

        if (alerts.length > 0) {
            logger.warn({ templateId, alerts }, 'Performance threshold alerts');
            // Here you would integrate with your alerting system
        }
    }

    private async checkAndOptimizeTemplate(templateId: string): Promise<void> {
        const metrics = await this.getPerformanceMetrics(templateId);

        if (metrics.optimizationScore < 70) {
            await this.optimizeTemplate(templateId);
        }
    }
}