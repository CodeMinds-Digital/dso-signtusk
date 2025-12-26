import { PrismaClient } from '@signtusk/database';
import { CacheService } from '@signtusk/cache';
import { pino } from 'pino';
import { TemplatePerformanceService, TemplatePerformanceConfig } from './template-performance-service';

const logger = pino({ name: 'template-performance-monitor' });

export interface PerformanceAlert {
    templateId: string;
    templateName: string;
    organizationId: string;
    alertType: 'performance_degradation' | 'cache_miss_rate' | 'optimization_needed' | 'usage_spike';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metrics: {
        loadTime?: number;
        renderTime?: number;
        cacheHitRate?: number;
        usageFrequency?: number;
        optimizationScore?: number;
    };
    recommendations: string[];
    timestamp: Date;
}

export interface MonitoringConfig {
    enabled: boolean;
    intervals: {
        performanceCheck: number; // minutes
        cacheAnalysis: number; // minutes
        usageAnalysis: number; // minutes
        optimization: number; // minutes
    };
    alerting: {
        enabled: boolean;
        webhookUrl?: string;
        emailRecipients?: string[];
        slackChannel?: string;
    };
    autoOptimization: {
        enabled: boolean;
        scoreThreshold: number; // auto-optimize if score below this
        usageThreshold: number; // only auto-optimize if usage above this
    };
}

export class TemplatePerformanceMonitor {
    private performanceService: TemplatePerformanceService;
    private config: MonitoringConfig;
    private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private db: PrismaClient,
        private cacheService: CacheService,
        performanceConfig?: Partial<TemplatePerformanceConfig>,
        monitoringConfig?: Partial<MonitoringConfig>
    ) {
        this.performanceService = new TemplatePerformanceService(db, cacheService, performanceConfig);

        this.config = {
            enabled: true,
            intervals: {
                performanceCheck: 15, // every 15 minutes
                cacheAnalysis: 30, // every 30 minutes
                usageAnalysis: 60, // every hour
                optimization: 240, // every 4 hours
            },
            alerting: {
                enabled: true,
            },
            autoOptimization: {
                enabled: false, // disabled by default for safety
                scoreThreshold: 60,
                usageThreshold: 10,
            },
            ...monitoringConfig,
        };
    }

    /**
     * Start performance monitoring
     */
    async startMonitoring(): Promise<void> {
        if (!this.config.enabled) {
            logger.info('Performance monitoring is disabled');
            return;
        }

        logger.info('Starting template performance monitoring');

        // Performance check interval
        const performanceInterval = setInterval(
            () => this.runPerformanceCheck(),
            this.config.intervals.performanceCheck * 60 * 1000
        );
        this.monitoringIntervals.set('performance', performanceInterval);

        // Cache analysis interval
        const cacheInterval = setInterval(
            () => this.runCacheAnalysis(),
            this.config.intervals.cacheAnalysis * 60 * 1000
        );
        this.monitoringIntervals.set('cache', cacheInterval);

        // Usage analysis interval
        const usageInterval = setInterval(
            () => this.runUsageAnalysis(),
            this.config.intervals.usageAnalysis * 60 * 1000
        );
        this.monitoringIntervals.set('usage', usageInterval);

        // Optimization interval
        const optimizationInterval = setInterval(
            () => this.runOptimizationCheck(),
            this.config.intervals.optimization * 60 * 1000
        );
        this.monitoringIntervals.set('optimization', optimizationInterval);

        // Run initial checks
        await this.runInitialChecks();

        logger.info('Template performance monitoring started successfully');
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void {
        logger.info('Stopping template performance monitoring');

        for (const [name, interval] of this.monitoringIntervals) {
            clearInterval(interval);
            logger.debug(`Stopped ${name} monitoring interval`);
        }

        this.monitoringIntervals.clear();
        logger.info('Template performance monitoring stopped');
    }

    /**
     * Run performance check for all active templates
     */
    private async runPerformanceCheck(): Promise<void> {
        try {
            logger.debug('Running performance check');

            // Get active templates (used in last 24 hours)
            const activeTemplates = await this.getActiveTemplates();

            const alerts: PerformanceAlert[] = [];

            for (const template of activeTemplates) {
                try {
                    const metrics = await this.performanceService.getPerformanceMetrics(template.id);

                    // Check for performance issues
                    const templateAlerts = await this.checkPerformanceThresholds(template, metrics);
                    alerts.push(...templateAlerts);

                } catch (error) {
                    logger.warn({ error, templateId: template.id }, 'Failed to check template performance');
                }
            }

            // Send alerts if any
            if (alerts.length > 0) {
                await this.sendAlerts(alerts);
            }

            logger.debug(`Performance check completed. Found ${alerts.length} alerts`);
        } catch (error) {
            logger.error({ error }, 'Performance check failed');
        }
    }

    /**
     * Run cache analysis
     */
    private async runCacheAnalysis(): Promise<void> {
        try {
            logger.debug('Running cache analysis');

            const templates = await this.getActiveTemplates();
            const alerts: PerformanceAlert[] = [];

            for (const template of templates) {
                try {
                    const metrics = await this.performanceService.getPerformanceMetrics(template.id);

                    // Check cache hit rate
                    if (metrics.cacheHitRate < 70 && metrics.usageFrequency > 5) {
                        alerts.push({
                            templateId: template.id,
                            templateName: template.name,
                            organizationId: template.organizationId,
                            alertType: 'cache_miss_rate',
                            severity: 'medium',
                            message: `Low cache hit rate (${metrics.cacheHitRate.toFixed(1)}%) for frequently used template`,
                            metrics: {
                                cacheHitRate: metrics.cacheHitRate,
                                usageFrequency: metrics.usageFrequency,
                            },
                            recommendations: [
                                'Enable aggressive caching',
                                'Increase cache TTL',
                                'Add to preload list',
                            ],
                            timestamp: new Date(),
                        });
                    }
                } catch (error) {
                    logger.warn({ error, templateId: template.id }, 'Failed to analyze template cache');
                }
            }

            if (alerts.length > 0) {
                await this.sendAlerts(alerts);
            }

            logger.debug(`Cache analysis completed. Found ${alerts.length} alerts`);
        } catch (error) {
            logger.error({ error }, 'Cache analysis failed');
        }
    }

    /**
     * Run usage analysis
     */
    private async runUsageAnalysis(): Promise<void> {
        try {
            logger.debug('Running usage analysis');

            // Analyze usage patterns and detect spikes
            const usageSpikes = await this.detectUsageSpikes();
            const alerts: PerformanceAlert[] = [];

            for (const spike of usageSpikes) {
                alerts.push({
                    templateId: spike.templateId,
                    templateName: spike.templateName,
                    organizationId: spike.organizationId,
                    alertType: 'usage_spike',
                    severity: spike.severity,
                    message: `Usage spike detected: ${spike.currentUsage} requests (${spike.increasePercentage}% increase)`,
                    metrics: {
                        usageFrequency: spike.currentUsage,
                    },
                    recommendations: [
                        'Consider preloading template',
                        'Increase cache capacity',
                        'Monitor performance closely',
                    ],
                    timestamp: new Date(),
                });
            }

            if (alerts.length > 0) {
                await this.sendAlerts(alerts);
            }

            logger.debug(`Usage analysis completed. Found ${alerts.length} spikes`);
        } catch (error) {
            logger.error({ error }, 'Usage analysis failed');
        }
    }

    /**
     * Run optimization check
     */
    private async runOptimizationCheck(): Promise<void> {
        try {
            logger.debug('Running optimization check');

            const templates = await this.getActiveTemplates();
            const alerts: PerformanceAlert[] = [];
            let optimizedCount = 0;

            for (const template of templates) {
                try {
                    const metrics = await this.performanceService.getPerformanceMetrics(template.id);

                    // Check if optimization is needed
                    if (metrics.optimizationScore < 70) {
                        alerts.push({
                            templateId: template.id,
                            templateName: template.name,
                            organizationId: template.organizationId,
                            alertType: 'optimization_needed',
                            severity: metrics.optimizationScore < 50 ? 'high' : 'medium',
                            message: `Template needs optimization (score: ${metrics.optimizationScore})`,
                            metrics: {
                                optimizationScore: metrics.optimizationScore,
                                loadTime: metrics.loadTime,
                                renderTime: metrics.renderTime,
                                cacheHitRate: metrics.cacheHitRate,
                            },
                            recommendations: metrics.recommendations.map(r => r.description),
                            timestamp: new Date(),
                        });

                        // Auto-optimize if enabled and conditions are met
                        if (
                            this.config.autoOptimization.enabled &&
                            metrics.optimizationScore < this.config.autoOptimization.scoreThreshold &&
                            metrics.usageFrequency >= this.config.autoOptimization.usageThreshold
                        ) {
                            const result = await this.performanceService.optimizeTemplate(template.id);
                            if (result.success) {
                                optimizedCount++;
                                logger.info({
                                    templateId: template.id,
                                    optimizations: result.optimizations
                                }, 'Auto-optimized template');
                            }
                        }
                    }
                } catch (error) {
                    logger.warn({ error, templateId: template.id }, 'Failed to check template optimization');
                }
            }

            if (alerts.length > 0) {
                await this.sendAlerts(alerts);
            }

            if (optimizedCount > 0) {
                logger.info({ optimizedCount }, 'Auto-optimization completed');
            }

            logger.debug(`Optimization check completed. Found ${alerts.length} alerts, optimized ${optimizedCount} templates`);
        } catch (error) {
            logger.error({ error }, 'Optimization check failed');
        }
    }

    /**
     * Run initial checks when monitoring starts
     */
    private async runInitialChecks(): Promise<void> {
        try {
            logger.info('Running initial performance checks');

            // Preload frequently used templates
            const organizations = await this.db.organization.findMany({
                select: { id: true },
            });

            for (const org of organizations) {
                try {
                    await this.performanceService.preloadFrequentTemplates(org.id);
                } catch (error) {
                    logger.warn({ error, organizationId: org.id }, 'Failed to preload templates for organization');
                }
            }

            logger.info('Initial performance checks completed');
        } catch (error) {
            logger.error({ error }, 'Initial performance checks failed');
        }
    }

    /**
     * Get active templates (used in last 24 hours)
     */
    private async getActiveTemplates(): Promise<Array<{ id: string; name: string; organizationId: string }>> {
        return await this.db.template.findMany({
            where: {
                signingRequests: {
                    some: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                },
            },
            select: {
                id: true,
                name: true,
                organizationId: true,
            },
        });
    }

    /**
     * Check performance thresholds and generate alerts
     */
    private async checkPerformanceThresholds(
        template: { id: string; name: string; organizationId: string },
        metrics: any
    ): Promise<PerformanceAlert[]> {
        const alerts: PerformanceAlert[] = [];

        // Check load time
        if (metrics.loadTime > 2000) {
            alerts.push({
                templateId: template.id,
                templateName: template.name,
                organizationId: template.organizationId,
                alertType: 'performance_degradation',
                severity: 'high',
                message: `Slow load time: ${metrics.loadTime}ms (threshold: 2000ms)`,
                metrics: { loadTime: metrics.loadTime },
                recommendations: [
                    'Enable caching',
                    'Optimize template structure',
                    'Reduce field complexity',
                ],
                timestamp: new Date(),
            });
        } else if (metrics.loadTime > 1000) {
            alerts.push({
                templateId: template.id,
                templateName: template.name,
                organizationId: template.organizationId,
                alertType: 'performance_degradation',
                severity: 'medium',
                message: `Moderate load time: ${metrics.loadTime}ms (threshold: 1000ms)`,
                metrics: { loadTime: metrics.loadTime },
                recommendations: [
                    'Consider caching optimization',
                    'Review template complexity',
                ],
                timestamp: new Date(),
            });
        }

        // Check render time
        if (metrics.renderTime > 1000) {
            alerts.push({
                templateId: template.id,
                templateName: template.name,
                organizationId: template.organizationId,
                alertType: 'performance_degradation',
                severity: 'high',
                message: `Slow render time: ${metrics.renderTime}ms (threshold: 1000ms)`,
                metrics: { renderTime: metrics.renderTime },
                recommendations: [
                    'Optimize field rendering',
                    'Reduce template complexity',
                    'Enable lazy loading',
                ],
                timestamp: new Date(),
            });
        }

        return alerts;
    }

    /**
     * Detect usage spikes
     */
    private async detectUsageSpikes(): Promise<Array<{
        templateId: string;
        templateName: string;
        organizationId: string;
        currentUsage: number;
        previousUsage: number;
        increasePercentage: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }>> {
        const spikes = [];

        // Get usage data for last 2 hours vs previous 2 hours
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

        // TODO: Uncomment when migration is applied
        // const currentUsage = await this.db.templateUsageAnalytics.groupBy({
        //     by: ['templateId'],
        //     where: {
        //         eventType: 'instantiate',
        //         timestamp: {
        //             gte: twoHoursAgo,
        //             lte: now,
        //         },
        //     },
        //     _count: {
        //         id: true,
        //     },
        // });

        // const previousUsage = await this.db.templateUsageAnalytics.groupBy({
        //     by: ['templateId'],
        //     where: {
        //         eventType: 'instantiate',
        //         timestamp: {
        //             gte: fourHoursAgo,
        //             lt: twoHoursAgo,
        //         },
        //     },
        //     _count: {
        //         id: true,
        //     },
        // });

        // Return empty array for now since tables don't exist
        return [];

        // Create lookup map for previous usage
        // const previousUsageMap = new Map(
        //     previousUsage.map(p => [p.templateId, p._count.id])
        // );

        // for (const current of currentUsage) {
        //     const previous = previousUsageMap.get(current.templateId) || 0;
        //     const currentCount = current._count.id;

        //     if (previous > 0) {
        //         const increasePercentage = ((currentCount - previous) / previous) * 100;

        //         // Only consider significant increases
        //         if (increasePercentage > 100 && currentCount > 10) {
        //             // Get template details
        //             const template = await this.db.template.findUnique({
        //                 where: { id: current.templateId },
        //                 select: { name: true, organizationId: true },
        //             });

        //             if (template) {
        //                 let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        //                 if (increasePercentage > 500) severity = 'critical';
        //                 else if (increasePercentage > 300) severity = 'high';
        //                 else if (increasePercentage > 200) severity = 'medium';

        //                 spikes.push({
        //                     templateId: current.templateId,
        //                     templateName: template.name,
        //                     organizationId: template.organizationId,
        //                     currentUsage: currentCount,
        //                     previousUsage: previous,
        //                     increasePercentage,
        //                     severity,
        //                 });
        //             }
        //         }
        //     }
        // }

        return spikes;
    }

    /**
     * Send alerts through configured channels
     */
    private async sendAlerts(alerts: PerformanceAlert[]): Promise<void> {
        if (!this.config.alerting.enabled || alerts.length === 0) {
            return;
        }

        try {
            // Group alerts by severity
            const groupedAlerts = alerts.reduce((acc, alert) => {
                if (!acc[alert.severity]) {
                    acc[alert.severity] = [];
                }
                acc[alert.severity].push(alert);
                return acc;
            }, {} as Record<string, PerformanceAlert[]>);

            // Log all alerts
            for (const [severity, severityAlerts] of Object.entries(groupedAlerts)) {
                logger.warn({
                    severity,
                    count: severityAlerts.length,
                    alerts: severityAlerts.map(a => ({
                        templateId: a.templateId,
                        templateName: a.templateName,
                        alertType: a.alertType,
                        message: a.message,
                    })),
                }, 'Template performance alerts');
            }

            // Send webhook if configured
            if (this.config.alerting.webhookUrl) {
                await this.sendWebhookAlert(alerts);
            }

            // Send email if configured
            if (this.config.alerting.emailRecipients?.length) {
                await this.sendEmailAlert(alerts);
            }

            // Send Slack if configured
            if (this.config.alerting.slackChannel) {
                await this.sendSlackAlert(alerts);
            }

        } catch (error) {
            logger.error({ error }, 'Failed to send performance alerts');
        }
    }

    private async sendWebhookAlert(alerts: PerformanceAlert[]): Promise<void> {
        // Implementation would depend on your webhook service
        logger.info({ alertCount: alerts.length }, 'Would send webhook alert');
    }

    private async sendEmailAlert(alerts: PerformanceAlert[]): Promise<void> {
        // Implementation would depend on your email service
        logger.info({ alertCount: alerts.length }, 'Would send email alert');
    }

    private async sendSlackAlert(alerts: PerformanceAlert[]): Promise<void> {
        // Implementation would depend on your Slack integration
        logger.info({ alertCount: alerts.length }, 'Would send Slack alert');
    }
}