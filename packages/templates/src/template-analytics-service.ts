import { PrismaClient } from '@signtusk/database';
import { pino } from 'pino';

const logger = pino({ name: 'template-analytics-service' });
import { TemplateAnalytics } from './types';

export interface TemplateUsageMetrics {
    templateId: string;
    totalUsage: number;
    completionRate: number;
    averageCompletionTime: number; // in minutes
    averageTimeToFirstSignature: number; // in minutes
    abandonmentRate: number;
    popularFields: Array<{
        fieldName: string;
        fieldType: string;
        usageCount: number;
        completionRate: number;
    }>;
    recipientEngagement: Array<{
        role: string;
        averageTimeToSign: number;
        completionRate: number;
        bounceRate: number;
    }>;
    timeSeriesData: Array<{
        date: string;
        usageCount: number;
        completionCount: number;
        averageCompletionTime: number;
    }>;
    geographicDistribution: Array<{
        country: string;
        usageCount: number;
        completionRate: number;
    }>;
    deviceAnalytics: Array<{
        deviceType: string;
        usageCount: number;
        completionRate: number;
    }>;
}

export interface TemplatePerformanceMetrics {
    templateId: string;
    performanceScore: number; // 0-100
    benchmarkComparison: {
        industryAverage: number;
        organizationAverage: number;
        percentile: number;
    };
    optimizationSuggestions: Array<{
        type: 'field_placement' | 'recipient_order' | 'workflow_simplification' | 'reminder_timing';
        priority: 'high' | 'medium' | 'low';
        description: string;
        expectedImprovement: number; // percentage
        implementationEffort: 'low' | 'medium' | 'high';
    }>;
    bottleneckAnalysis: Array<{
        stage: string;
        averageTime: number;
        dropoffRate: number;
        suggestions: string[];
    }>;
}

export interface TemplateROIAnalysis {
    templateId: string;
    costSavings: {
        paperCosts: number;
        printingCosts: number;
        shippingCosts: number;
        storageReduction: number;
        timeReduction: number; // in hours
        totalSavings: number;
    };
    efficiency: {
        documentsProcessedPerHour: number;
        errorReductionPercentage: number;
        processAcceleration: number; // multiplier
    };
    roi: {
        totalInvestment: number;
        totalReturns: number;
        roiPercentage: number;
        paybackPeriod: number; // in months
    };
}

export interface TemplateComplianceMetrics {
    templateId: string;
    auditTrailCompleteness: number; // percentage
    signatureValidityRate: number; // percentage
    complianceScore: number; // 0-100
    regulatoryAdherence: Array<{
        regulation: string;
        adherenceLevel: number; // percentage
        issues: string[];
    }>;
}

export class TemplateAnalyticsService {
    constructor(private db: PrismaClient) { }

    /**
     * Get comprehensive template analytics
     */
    async getTemplateAnalytics(
        templateId: string,
        userId: string,
        organizationId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<TemplateAnalytics | null> {
        try {
            // Verify template access
            const template = await this.verifyTemplateAccess(templateId, organizationId);
            if (!template) {
                return null;
            }

            const dateFilter = this.buildDateFilter(startDate, endDate);

            // Get basic usage metrics
            const [usageCount, completionRate, avgCompletionTime] = await Promise.all([
                this.getUsageCount(templateId, dateFilter),
                this.getCompletionRate(templateId, dateFilter),
                this.getAverageCompletionTime(templateId, dateFilter),
            ]);

            // Get detailed analytics
            const [popularFields, recipientEngagement, timeSeriesData] = await Promise.all([
                this.getPopularFields(templateId, dateFilter),
                this.getRecipientEngagement(templateId, dateFilter),
                this.getTimeSeriesData(templateId, dateFilter),
            ]);

            // Track analytics access
            await this.trackAnalyticsAccess(templateId, userId, 'view_analytics');

            return {
                templateId,
                usageCount,
                completionRate,
                averageCompletionTime: avgCompletionTime,
                popularFields,
                recipientEngagement,
                timeSeriesData,
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to get template analytics');
            return null;
        }
    }

    /**
     * Get detailed usage metrics with advanced analytics
     */
    async getDetailedUsageMetrics(
        templateId: string,
        organizationId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<TemplateUsageMetrics | null> {
        try {
            const template = await this.verifyTemplateAccess(templateId, organizationId);
            if (!template) {
                return null;
            }

            const dateFilter = this.buildDateFilter(startDate, endDate);

            const [
                totalUsage,
                completionRate,
                averageCompletionTime,
                averageTimeToFirstSignature,
                abandonmentRate,
                popularFields,
                recipientEngagement,
                timeSeriesData,
                geographicDistribution,
                deviceAnalytics,
            ] = await Promise.all([
                this.getUsageCount(templateId, dateFilter),
                this.getCompletionRate(templateId, dateFilter),
                this.getAverageCompletionTime(templateId, dateFilter),
                this.getAverageTimeToFirstSignature(templateId, dateFilter),
                this.getAbandonmentRate(templateId, dateFilter),
                this.getDetailedFieldAnalytics(templateId, dateFilter),
                this.getDetailedRecipientEngagement(templateId, dateFilter),
                this.getDetailedTimeSeriesData(templateId, dateFilter),
                this.getGeographicDistribution(templateId, dateFilter),
                this.getDeviceAnalytics(templateId, dateFilter),
            ]);

            return {
                templateId,
                totalUsage,
                completionRate,
                averageCompletionTime,
                averageTimeToFirstSignature,
                abandonmentRate,
                popularFields,
                recipientEngagement,
                timeSeriesData,
                geographicDistribution,
                deviceAnalytics,
            };
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get detailed usage metrics');
            return null;
        }
    }

    /**
     * Get template performance metrics and optimization suggestions
     */
    async getPerformanceMetrics(
        templateId: string,
        organizationId: string
    ): Promise<TemplatePerformanceMetrics | null> {
        try {
            const template = await this.verifyTemplateAccess(templateId, organizationId);
            if (!template) {
                return null;
            }

            const [
                performanceScore,
                benchmarkComparison,
                optimizationSuggestions,
                bottleneckAnalysis,
            ] = await Promise.all([
                this.calculatePerformanceScore(templateId),
                this.getBenchmarkComparison(templateId, organizationId),
                this.generateOptimizationSuggestions(templateId),
                this.analyzeBottlenecks(templateId),
            ]);

            return {
                templateId,
                performanceScore,
                benchmarkComparison,
                optimizationSuggestions,
                bottleneckAnalysis,
            };
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get performance metrics');
            return null;
        }
    }

    /**
     * Get ROI analysis for template usage
     */
    async getROIAnalysis(
        templateId: string,
        organizationId: string,
        costParameters?: {
            paperCostPerPage?: number;
            printingCostPerPage?: number;
            shippingCostPerDocument?: number;
            hourlyRate?: number;
        }
    ): Promise<TemplateROIAnalysis | null> {
        try {
            const template = await this.verifyTemplateAccess(templateId, organizationId);
            if (!template) {
                return null;
            }

            const defaultCosts = {
                paperCostPerPage: 0.05,
                printingCostPerPage: 0.10,
                shippingCostPerDocument: 5.00,
                hourlyRate: 50.00,
                ...costParameters,
            };

            const [costSavings, efficiency, roi] = await Promise.all([
                this.calculateCostSavings(templateId, defaultCosts),
                this.calculateEfficiencyMetrics(templateId),
                this.calculateROI(templateId, defaultCosts),
            ]);

            return {
                templateId,
                costSavings,
                efficiency,
                roi,
            };
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get ROI analysis');
            return null;
        }
    }

    /**
     * Get compliance metrics for template
     */
    async getComplianceMetrics(
        templateId: string,
        organizationId: string
    ): Promise<TemplateComplianceMetrics | null> {
        try {
            const template = await this.verifyTemplateAccess(templateId, organizationId);
            if (!template) {
                return null;
            }

            const [
                auditTrailCompleteness,
                signatureValidityRate,
                complianceScore,
                regulatoryAdherence,
            ] = await Promise.all([
                this.calculateAuditTrailCompleteness(templateId),
                this.calculateSignatureValidityRate(templateId),
                this.calculateComplianceScore(templateId),
                this.assessRegulatoryAdherence(templateId),
            ]);

            return {
                templateId,
                auditTrailCompleteness,
                signatureValidityRate,
                complianceScore,
                regulatoryAdherence,
            };
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get compliance metrics');
            return null;
        }
    }

    /**
     * Track analytics events
     */
    async trackAnalyticsEvent(
        templateId: string,
        eventType: string,
        userId?: string,
        metadata?: any
    ): Promise<void> {
        try {
            await this.db.templateAnalytics.create({
                data: {
                    templateId,
                    eventType,
                    userId,
                    metadata: metadata || {},
                    timestamp: new Date(),
                },
            });
        } catch (error) {
            logger.error({ error, templateId, eventType }, 'Failed to track analytics event');
        }
    }

    // Private helper methods

    private async verifyTemplateAccess(templateId: string, organizationId: string) {
        return await this.db.template.findFirst({
            where: {
                id: templateId,
                OR: [
                    { organizationId },
                    { isPublic: true },
                ],
            },
        });
    }

    private buildDateFilter(startDate?: Date, endDate?: Date) {
        return {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
        };
    }

    private async getUsageCount(templateId: string, dateFilter: any): Promise<number> {
        return await this.db.signingRequest.count({
            where: {
                templateId,
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
            },
        });
    }

    private async getCompletionRate(templateId: string, dateFilter: any): Promise<number> {
        const [total, completed] = await Promise.all([
            this.db.signingRequest.count({
                where: {
                    templateId,
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                },
            }),
            this.db.signingRequest.count({
                where: {
                    templateId,
                    status: 'COMPLETED',
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                },
            }),
        ]);

        return total > 0 ? (completed / total) * 100 : 0;
    }

    private async getAverageCompletionTime(templateId: string, dateFilter: any): Promise<number> {
        const completedRequests = await this.db.signingRequest.findMany({
            where: {
                templateId,
                status: 'COMPLETED',
                completedAt: { not: null },
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
            },
            select: {
                createdAt: true,
                completedAt: true,
            },
        });

        if (completedRequests.length === 0) {
            return 0;
        }

        const totalTime = completedRequests.reduce((sum, request) => {
            if (request.completedAt) {
                const diffMs = request.completedAt.getTime() - request.createdAt.getTime();
                return sum + (diffMs / (1000 * 60)); // Convert to minutes
            }
            return sum;
        }, 0);

        return totalTime / completedRequests.length;
    }

    private async getPopularFields(templateId: string, dateFilter: any) {
        // This would require tracking field interactions
        // For now, return template fields with usage simulation
        const template = await this.db.template.findUnique({
            where: { id: templateId },
            include: { templateFields: true },
        });

        if (!template?.templateFields) {
            return [];
        }

        return template.templateFields.map((field: any) => ({
            fieldName: field.name || 'Unnamed Field',
            usageCount: Math.floor(Math.random() * 100) + 1, // Simulated data
        }));
    }

    private async getRecipientEngagement(templateId: string, dateFilter: any) {
        // This would require tracking recipient interactions
        // For now, return simulated data based on template recipients
        const template = await this.db.template.findUnique({
            where: { id: templateId },
            include: { templateRecipients: true },
        });

        if (!template?.templateRecipients) {
            return [];
        }

        return template.templateRecipients.map((recipient: any) => ({
            role: recipient.role || 'Signer',
            averageTimeToSign: Math.floor(Math.random() * 1440) + 60, // 1-24 hours in minutes
            completionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        }));
    }

    private async getTimeSeriesData(templateId: string, dateFilter: any) {
        // Generate time series data for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const data = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];

            const [usageCount, completionCount] = await Promise.all([
                this.db.signingRequest.count({
                    where: {
                        templateId,
                        createdAt: {
                            gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                            lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
                        },
                    },
                }),
                this.db.signingRequest.count({
                    where: {
                        templateId,
                        status: 'COMPLETED',
                        completedAt: {
                            gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                            lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
                        },
                    },
                }),
            ]);

            data.push({
                date: dateStr,
                usageCount,
                completionCount,
            });
        }

        return data;
    }

    // Additional private methods for advanced analytics would be implemented here
    private async getAverageTimeToFirstSignature(templateId: string, dateFilter: any): Promise<number> {
        // Implementation for time to first signature
        return 0; // Placeholder
    }

    private async getAbandonmentRate(templateId: string, dateFilter: any): Promise<number> {
        // Implementation for abandonment rate
        return 0; // Placeholder
    }

    private async getDetailedFieldAnalytics(templateId: string, dateFilter: any) {
        // Implementation for detailed field analytics
        return []; // Placeholder
    }

    private async getDetailedRecipientEngagement(templateId: string, dateFilter: any) {
        // Implementation for detailed recipient engagement
        return []; // Placeholder
    }

    private async getDetailedTimeSeriesData(templateId: string, dateFilter: any) {
        // Implementation for detailed time series data
        return []; // Placeholder
    }

    private async getGeographicDistribution(templateId: string, dateFilter: any) {
        // Implementation for geographic distribution
        return []; // Placeholder
    }

    private async getDeviceAnalytics(templateId: string, dateFilter: any) {
        // Implementation for device analytics
        return []; // Placeholder
    }

    private async calculatePerformanceScore(templateId: string): Promise<number> {
        // Implementation for performance score calculation
        return 85; // Placeholder
    }

    private async getBenchmarkComparison(templateId: string, organizationId: string) {
        // Implementation for benchmark comparison
        return {
            industryAverage: 75,
            organizationAverage: 80,
            percentile: 85,
        }; // Placeholder
    }

    private async generateOptimizationSuggestions(templateId: string) {
        // Implementation for optimization suggestions
        return []; // Placeholder
    }

    private async analyzeBottlenecks(templateId: string) {
        // Implementation for bottleneck analysis
        return []; // Placeholder
    }

    private async calculateCostSavings(templateId: string, costs: any) {
        // Implementation for cost savings calculation
        return {
            paperCosts: 0,
            printingCosts: 0,
            shippingCosts: 0,
            storageReduction: 0,
            timeReduction: 0,
            totalSavings: 0,
        }; // Placeholder
    }

    private async calculateEfficiencyMetrics(templateId: string) {
        // Implementation for efficiency metrics
        return {
            documentsProcessedPerHour: 0,
            errorReductionPercentage: 0,
            processAcceleration: 0,
        }; // Placeholder
    }

    private async calculateROI(templateId: string, costs: any) {
        // Implementation for ROI calculation
        return {
            totalInvestment: 0,
            totalReturns: 0,
            roiPercentage: 0,
            paybackPeriod: 0,
        }; // Placeholder
    }

    private async calculateAuditTrailCompleteness(templateId: string): Promise<number> {
        // Implementation for audit trail completeness
        return 100; // Placeholder
    }

    private async calculateSignatureValidityRate(templateId: string): Promise<number> {
        // Implementation for signature validity rate
        return 100; // Placeholder
    }

    private async calculateComplianceScore(templateId: string): Promise<number> {
        // Implementation for compliance score
        return 95; // Placeholder
    }

    private async assessRegulatoryAdherence(templateId: string) {
        // Implementation for regulatory adherence assessment
        return []; // Placeholder
    }

    private async trackAnalyticsAccess(templateId: string, userId: string, eventType: string): Promise<void> {
        await this.trackAnalyticsEvent(templateId, eventType, userId, {
            accessTime: new Date(),
            userAgent: 'analytics-service',
        });
    }
}