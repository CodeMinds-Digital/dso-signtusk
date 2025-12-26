/**
 * Signature Analytics Engine
 * 
 * Comprehensive analytics system for signature tracking providing:
 * - Signing completion rate tracking
 * - Time-to-sign analytics and optimization insights
 * - User behavior tracking and analysis
 * - Performance metrics and bottleneck identification
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Extend PrismaClient with missing models for analytics
interface ExtendedPrismaClient extends PrismaClient {
    signatureAnalytics: {
        create: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
    };
    workflowAnalytics: {
        create: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
    };
    document: {
        findMany: (args: any) => Promise<any[]>;
    };
}

// ============================================================================
// SIGNATURE ANALYTICS TYPES
// ============================================================================

export interface SignatureEvent {
    documentId: string;
    userId?: string;
    sessionId: string;
    eventType: 'signature_start' | 'signature_progress' | 'signature_complete' | 'signature_abandon';
    fieldId?: string;
    fieldType?: 'drawn' | 'typed' | 'uploaded';
    metadata: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}

export interface SignatureWorkflowEvent {
    workflowId: string;
    documentId: string;
    recipientId: string;
    eventType: 'workflow_start' | 'recipient_notified' | 'document_opened' | 'signature_started' | 'signature_completed' | 'workflow_completed' | 'workflow_expired';
    metadata: Record<string, any>;
    timestamp: Date;
}

export interface SignatureCompletionMetrics {
    totalSignatureRequests: number;
    completedSignatures: number;
    completionRate: number; // percentage
    averageTimeToSign: number; // seconds
    medianTimeToSign: number; // seconds
    abandonmentRate: number; // percentage
    completionsByMethod: Array<{
        method: 'drawn' | 'typed' | 'uploaded';
        count: number;
        averageTime: number;
    }>;
    completionTrends: Array<{
        date: string;
        requests: number;
        completions: number;
        rate: number;
    }>;
}

export interface SignaturePerformanceMetrics {
    bottlenecks: Array<{
        type: 'field_placement' | 'field_complexity' | 'document_length' | 'user_experience';
        severity: 'low' | 'medium' | 'high';
        description: string;
        impact: string;
        affectedFields?: string[];
        recommendations: string[];
    }>;
    fieldPerformance: Array<{
        fieldId: string;
        fieldName: string;
        fieldType: string;
        completionRate: number;
        averageTimeToComplete: number;
        abandonmentRate: number;
        errorRate: number;
    }>;
    userBehaviorInsights: {
        mostCommonSignatureMethod: 'drawn' | 'typed' | 'uploaded';
        averageFieldsPerDocument: number;
        peakSigningHours: number[];
        deviceUsage: Array<{
            deviceType: 'desktop' | 'mobile' | 'tablet';
            percentage: number;
            completionRate: number;
        }>;
    };
}

export interface SignatureOptimizationRecommendation {
    type: 'field_placement' | 'field_design' | 'workflow_optimization' | 'user_experience';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
    actionItems: string[];
    estimatedImprovement: {
        metric: 'completion_rate' | 'time_to_sign' | 'abandonment_rate';
        improvement: string;
    };
    affectedFields?: string[];
}

export interface SignatureAnalyticsDashboard {
    organizationId: string;
    timeRange: {
        startDate: Date;
        endDate: Date;
    };
    overview: {
        totalDocuments: number;
        totalSignatureRequests: number;
        totalCompletedSignatures: number;
        overallCompletionRate: number;
        averageTimeToSign: number;
        totalActiveWorkflows: number;
    };
    trends: {
        completionRateTrend: Array<{
            date: string;
            rate: number;
        }>;
        timeToSignTrend: Array<{
            date: string;
            averageTime: number;
        }>;
        volumeTrend: Array<{
            date: string;
            requests: number;
            completions: number;
        }>;
    };
    topPerformingDocuments: Array<{
        documentId: string;
        documentName: string;
        completionRate: number;
        averageTimeToSign: number;
        totalSignatures: number;
    }>;
    underperformingDocuments: Array<{
        documentId: string;
        documentName: string;
        completionRate: number;
        averageTimeToSign: number;
        totalSignatures: number;
        recommendations: SignatureOptimizationRecommendation[];
    }>;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const SignatureEventSchema = z.object({
    documentId: z.string(),
    userId: z.string().nullable().optional(),
    sessionId: z.string(),
    eventType: z.enum(['signature_start', 'signature_progress', 'signature_complete', 'signature_abandon']),
    fieldId: z.string().nullable().optional(),
    fieldType: z.enum(['drawn', 'typed', 'uploaded']).nullable().optional(),
    metadata: z.record(z.any()).default({}),
    timestamp: z.date().default(() => new Date()),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
}).transform(data => ({
    ...data,
    // Ensure null values are properly handled
    userId: data.userId || undefined,
    fieldId: data.fieldId || undefined,
    fieldType: data.fieldType || undefined,
    ipAddress: data.ipAddress || undefined,
    userAgent: data.userAgent || undefined,
}));

export const SignatureWorkflowEventSchema = z.object({
    workflowId: z.string(),
    documentId: z.string(),
    recipientId: z.string(),
    eventType: z.enum(['workflow_start', 'recipient_notified', 'document_opened', 'signature_started', 'signature_completed', 'workflow_completed', 'workflow_expired']),
    metadata: z.record(z.any()).default({}),
    timestamp: z.date().default(() => new Date()),
});

// ============================================================================
// SIGNATURE ANALYTICS ENGINE
// ============================================================================

export class SignatureAnalyticsEngine {
    constructor(private db: ExtendedPrismaClient) { }

    // ============================================================================
    // EVENT TRACKING METHODS
    // ============================================================================

    /**
     * Track a signature event
     */
    async trackSignatureEvent(event: SignatureEvent): Promise<void> {
        const validatedEvent = SignatureEventSchema.parse(event);

        await this.db.signatureAnalytics.create({
            data: {
                documentId: validatedEvent.documentId,
                eventType: validatedEvent.eventType,
                metadata: {
                    sessionId: validatedEvent.sessionId,
                    fieldId: validatedEvent.fieldId,
                    fieldType: validatedEvent.fieldType,
                    ipAddress: validatedEvent.ipAddress,
                    userAgent: validatedEvent.userAgent,
                    ...validatedEvent.metadata,
                },
                userId: validatedEvent.userId,
                timestamp: validatedEvent.timestamp,
            },
        });
    }

    /**
     * Track a signature workflow event
     */
    async trackWorkflowEvent(event: SignatureWorkflowEvent): Promise<void> {
        const validatedEvent = SignatureWorkflowEventSchema.parse(event);

        await this.db.workflowAnalytics.create({
            data: {
                workflowId: validatedEvent.workflowId,
                documentId: validatedEvent.documentId,
                recipientId: validatedEvent.recipientId,
                eventType: validatedEvent.eventType,
                metadata: validatedEvent.metadata,
                timestamp: validatedEvent.timestamp,
            },
        });
    }

    // ============================================================================
    // COMPLETION RATE ANALYTICS
    // ============================================================================

    /**
     * Get signature completion metrics for a document
     */
    async getSignatureCompletionMetrics(
        documentId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<SignatureCompletionMetrics> {
        const whereClause: any = {
            documentId,
        };

        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate) whereClause.timestamp.gte = startDate;
            if (endDate) whereClause.timestamp.lte = endDate;
        }

        const signatureEvents = await this.db.signatureAnalytics.findMany({
            where: whereClause,
            orderBy: { timestamp: 'asc' },
        });

        // Calculate basic metrics by properly pairing start and completion events
        const sessionMap = new Map<string, { started: boolean; completed: boolean; abandoned: boolean }>();

        // Track session states
        signatureEvents.forEach((event: any) => {
            const sessionId = event.metadata?.sessionId;
            if (!sessionId) return;

            if (!sessionMap.has(sessionId)) {
                sessionMap.set(sessionId, { started: false, completed: false, abandoned: false });
            }

            const session = sessionMap.get(sessionId)!;

            switch (event.eventType) {
                case 'signature_start':
                    session.started = true;
                    break;
                case 'signature_complete':
                    if (session.started) session.completed = true;
                    break;
                case 'signature_abandon':
                    if (session.started) session.abandoned = true;
                    break;
            }
        });

        // Count properly paired events
        const sessions = Array.from(sessionMap.values());
        const totalSignatureRequests = sessions.filter(s => s.started).length;
        const completedSignatures = sessions.filter(s => s.started && s.completed).length;
        const abandonedSignatures = sessions.filter(s => s.started && s.abandoned && !s.completed).length;

        // Calculate rates
        let completionRate = totalSignatureRequests > 0 ? (completedSignatures / totalSignatureRequests) * 100 : 0;
        let abandonmentRate = totalSignatureRequests > 0 ? (abandonedSignatures / totalSignatureRequests) * 100 : 0;

        // Round to avoid floating point precision issues
        completionRate = Math.round(completionRate * 100) / 100;
        abandonmentRate = Math.round(abandonmentRate * 100) / 100;

        // Calculate time to sign metrics
        const completionTimes = this.calculateCompletionTimes(signatureEvents);
        const averageTimeToSign = completionTimes.length > 0
            ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
            : 0;

        const sortedTimes = completionTimes.sort((a, b) => a - b);
        const medianTimeToSign = sortedTimes.length > 0
            ? sortedTimes[Math.floor(sortedTimes.length / 2)]
            : 0;

        // Calculate completions by method
        const completionsByMethod = this.calculateCompletionsByMethod(signatureEvents);

        // Calculate completion trends
        const completionTrends = this.calculateCompletionTrends(signatureEvents);

        return {
            totalSignatureRequests,
            completedSignatures,
            completionRate,
            averageTimeToSign,
            medianTimeToSign,
            abandonmentRate,
            completionsByMethod,
            completionTrends,
        };
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    /**
     * Calculate completion times from signature events
     */
    private calculateCompletionTimes(events: any[]): number[] {
        const completionTimes: number[] = [];
        const sessionMap = new Map<string, Date>();

        events.forEach((event: any) => {
            const sessionId = event.metadata?.sessionId;
            if (!sessionId) return;

            if (event.eventType === 'signature_start') {
                sessionMap.set(sessionId, event.timestamp);
            } else if (event.eventType === 'signature_complete' || event.eventType === 'signature_abandon') {
                const startTime = sessionMap.get(sessionId);
                if (startTime) {
                    const completionTime = (event.timestamp.getTime() - startTime.getTime()) / 1000;
                    if (completionTime >= 0) {
                        completionTimes.push(completionTime);
                    }
                }
            }
        });

        return completionTimes;
    }

    /**
     * Calculate completions by signature method
     */
    private calculateCompletionsByMethod(events: any[]): Array<{
        method: 'drawn' | 'typed' | 'uploaded';
        count: number;
        averageTime: number;
    }> {
        const methodStats = new Map<string, { count: number; totalTime: number }>();
        const sessionTimes = new Map<string, Date>();

        events.forEach((event: any) => {
            const sessionId = event.metadata?.sessionId;
            const method = event.metadata?.fieldType;

            if (event.eventType === 'signature_start' && sessionId) {
                sessionTimes.set(sessionId, event.timestamp);
            } else if (event.eventType === 'signature_complete' && sessionId && method) {
                const startTime = sessionTimes.get(sessionId);
                const completionTime = startTime
                    ? (event.timestamp.getTime() - startTime.getTime()) / 1000
                    : 0;

                if (completionTime >= 0) {
                    if (!methodStats.has(method)) {
                        methodStats.set(method, { count: 0, totalTime: 0 });
                    }
                    const stats = methodStats.get(method)!;
                    stats.count++;
                    stats.totalTime += completionTime;
                }
            }
        });

        return Array.from(methodStats.entries()).map(([method, stats]) => ({
            method: method as 'drawn' | 'typed' | 'uploaded',
            count: stats.count,
            averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        }));
    }

    /**
     * Calculate completion trends over time
     */
    private calculateCompletionTrends(events: any[]): Array<{
        date: string;
        requests: number;
        completions: number;
        rate: number;
    }> {
        const trendsByDate = new Map<string, Map<string, { started: boolean; completed: boolean }>>();

        events.forEach((event: any) => {
            const date = event.timestamp.toISOString().split('T')[0];
            const sessionId = event.metadata?.sessionId;
            if (!sessionId) return;

            if (!trendsByDate.has(date)) {
                trendsByDate.set(date, new Map());
            }

            const dayData = trendsByDate.get(date)!;
            if (!dayData.has(sessionId)) {
                dayData.set(sessionId, { started: false, completed: false });
            }

            const session = dayData.get(sessionId)!;

            if (event.eventType === 'signature_start') {
                session.started = true;
            } else if (event.eventType === 'signature_complete') {
                if (session.started) session.completed = true;
            }
        });

        return Array.from(trendsByDate.entries()).map(([date, sessions]) => {
            const sessionArray = Array.from(sessions.values());
            const requests = sessionArray.filter(s => s.started).length;
            const completions = sessionArray.filter(s => s.started && s.completed).length;

            return {
                date,
                requests,
                completions,
                rate: requests > 0 ? (completions / requests) * 100 : 0,
            };
        });
    }

    // ============================================================================
    // PERFORMANCE METRICS METHODS
    // ============================================================================

    /**
     * Get signature performance metrics for a document
     */
    async getSignaturePerformanceMetrics(
        documentId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<SignaturePerformanceMetrics> {
        const whereClause: any = {
            documentId,
        };

        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate) whereClause.timestamp.gte = startDate;
            if (endDate) whereClause.timestamp.lte = endDate;
        }

        const signatureEvents = await this.db.signatureAnalytics.findMany({
            where: whereClause,
            orderBy: { timestamp: 'asc' },
        });

        // Analyze bottlenecks
        const bottlenecks = this.identifyBottlenecks(signatureEvents);

        // Analyze field performance
        const fieldPerformance = this.analyzeFieldPerformance(signatureEvents);

        // Analyze user behavior insights
        const userBehaviorInsights = this.analyzeUserBehavior(signatureEvents);

        return {
            bottlenecks,
            fieldPerformance,
            userBehaviorInsights,
        };
    }

    /**
     * Generate optimization recommendations for a document
     */
    async generateOptimizationRecommendations(
        documentId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<SignatureOptimizationRecommendation[]> {
        const [completionMetrics, performanceMetrics] = await Promise.all([
            this.getSignatureCompletionMetrics(documentId, startDate, endDate),
            this.getSignaturePerformanceMetrics(documentId, startDate, endDate),
        ]);

        const recommendations: SignatureOptimizationRecommendation[] = [];

        // Analyze completion rate
        if (completionMetrics.completionRate < 70) {
            recommendations.push({
                type: 'workflow_optimization',
                priority: 'high',
                title: 'Improve Signature Completion Rate',
                description: `Current completion rate is ${completionMetrics.completionRate.toFixed(1)}%, which is below the recommended 70% threshold.`,
                impact: 'Increasing completion rate can significantly improve document processing efficiency',
                actionItems: [
                    'Simplify the signing process by reducing the number of required fields',
                    'Provide clearer instructions for signature placement',
                    'Consider implementing progress indicators',
                    'Review field placement for better user experience'
                ],
                estimatedImprovement: {
                    metric: 'completion_rate',
                    improvement: '15-25% increase in completion rate'
                }
            });
        }

        // Analyze abandonment rate
        if (completionMetrics.abandonmentRate > 30) {
            recommendations.push({
                type: 'user_experience',
                priority: 'high',
                title: 'Reduce Signature Abandonment',
                description: `Current abandonment rate is ${completionMetrics.abandonmentRate.toFixed(1)}%, indicating users are leaving the signing process.`,
                impact: 'Reducing abandonment rate will improve overall workflow efficiency',
                actionItems: [
                    'Analyze user feedback to identify pain points',
                    'Implement auto-save functionality',
                    'Provide better error messages and guidance',
                    'Optimize for mobile devices if needed'
                ],
                estimatedImprovement: {
                    metric: 'abandonment_rate',
                    improvement: '10-20% reduction in abandonment'
                }
            });
        }

        // Analyze time to sign
        if (completionMetrics.averageTimeToSign > 300) { // 5 minutes
            recommendations.push({
                type: 'field_design',
                priority: 'medium',
                title: 'Optimize Signing Time',
                description: `Average time to sign is ${Math.round(completionMetrics.averageTimeToSign / 60)} minutes, which may indicate complexity issues.`,
                impact: 'Reducing signing time improves user satisfaction and completion rates',
                actionItems: [
                    'Review field placement and grouping',
                    'Consider pre-filling known information',
                    'Simplify field types where possible',
                    'Provide keyboard shortcuts for power users'
                ],
                estimatedImprovement: {
                    metric: 'time_to_sign',
                    improvement: '20-40% reduction in signing time'
                }
            });
        }

        // Add recommendations based on performance bottlenecks
        performanceMetrics.bottlenecks.forEach(bottleneck => {
            if (bottleneck.severity === 'high') {
                // Map bottleneck types to recommendation types
                const recommendationType = bottleneck.type === 'field_complexity' ? 'field_design' :
                    bottleneck.type === 'document_length' ? 'workflow_optimization' :
                        bottleneck.type;
                recommendations.push({
                    type: recommendationType as 'field_placement' | 'field_design' | 'workflow_optimization' | 'user_experience',
                    priority: 'high',
                    title: `Address ${bottleneck.type.replace('_', ' ')} Issues`,
                    description: bottleneck.description,
                    impact: bottleneck.impact,
                    actionItems: bottleneck.recommendations,
                    estimatedImprovement: {
                        metric: 'completion_rate',
                        improvement: 'Varies based on specific bottleneck'
                    },
                    affectedFields: bottleneck.affectedFields
                });
            }
        });

        return recommendations;
    }

    /**
     * Generate analytics dashboard data
     */
    async generateAnalyticsDashboard(
        organizationId: string,
        startDate: Date,
        endDate: Date
    ): Promise<SignatureAnalyticsDashboard> {
        // Get all documents for the organization
        const documents = await this.db.document.findMany({
            where: {
                organizationId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const documentIds = documents.map(doc => doc.id);

        // Get signature events for all documents
        const signatureEvents = await this.db.signatureAnalytics.findMany({
            where: {
                documentId: { in: documentIds },
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { timestamp: 'asc' },
        });

        // Calculate overview metrics
        const overview = this.calculateOverviewMetrics(signatureEvents, documents);

        // Calculate trends
        const trends = this.calculateTrendMetrics(signatureEvents);

        // Identify top and underperforming documents
        const documentPerformance = await this.analyzeDocumentPerformance(documentIds, startDate, endDate);

        return {
            organizationId,
            timeRange: { startDate, endDate },
            overview,
            trends,
            topPerformingDocuments: documentPerformance.topPerforming,
            underperformingDocuments: documentPerformance.underperforming,
        };
    }

    // ============================================================================
    // PRIVATE ANALYSIS METHODS
    // ============================================================================

    /**
     * Identify performance bottlenecks from signature events
     */
    private identifyBottlenecks(events: any[]): Array<{
        type: 'field_placement' | 'field_complexity' | 'document_length' | 'user_experience';
        severity: 'low' | 'medium' | 'high';
        description: string;
        impact: string;
        affectedFields?: string[];
        recommendations: string[];
    }> {
        const bottlenecks: any[] = [];

        // Analyze field abandonment patterns
        const fieldAbandonmentMap = new Map<string, number>();
        const fieldStartMap = new Map<string, number>();

        events.forEach(event => {
            const fieldId = event.metadata?.fieldId;
            if (!fieldId) return;

            if (event.eventType === 'signature_start') {
                fieldStartMap.set(fieldId, (fieldStartMap.get(fieldId) || 0) + 1);
            } else if (event.eventType === 'signature_abandon') {
                fieldAbandonmentMap.set(fieldId, (fieldAbandonmentMap.get(fieldId) || 0) + 1);
            }
        });

        // Identify high-abandonment fields
        const highAbandonmentFields: string[] = [];
        fieldAbandonmentMap.forEach((abandonments, fieldId) => {
            const starts = fieldStartMap.get(fieldId) || 0;
            const abandonmentRate = starts > 0 ? (abandonments / starts) * 100 : 0;

            if (abandonmentRate > 50) {
                highAbandonmentFields.push(fieldId);
            }
        });

        if (highAbandonmentFields.length > 0) {
            bottlenecks.push({
                type: 'field_placement',
                severity: 'high',
                description: `${highAbandonmentFields.length} fields have high abandonment rates (>50%)`,
                impact: 'High abandonment rates indicate poor field placement or complexity',
                affectedFields: highAbandonmentFields,
                recommendations: [
                    'Review field placement and make them more prominent',
                    'Simplify field requirements',
                    'Add helpful tooltips or instructions',
                    'Consider field grouping and logical flow'
                ]
            });
        }

        // Analyze completion times for complexity issues
        const completionTimes = this.calculateCompletionTimes(events);
        const averageTime = completionTimes.length > 0
            ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
            : 0;

        if (averageTime > 180) { // 3 minutes
            bottlenecks.push({
                type: 'field_complexity',
                severity: averageTime > 300 ? 'high' : 'medium',
                description: `Average completion time is ${Math.round(averageTime / 60)} minutes, indicating potential complexity issues`,
                impact: 'Long completion times can lead to user frustration and abandonment',
                recommendations: [
                    'Simplify field types and reduce required information',
                    'Pre-fill known data where possible',
                    'Break complex forms into multiple steps',
                    'Provide clear progress indicators'
                ]
            });
        }

        return bottlenecks;
    }

    /**
     * Analyze field performance metrics
     */
    private analyzeFieldPerformance(events: any[]): Array<{
        fieldId: string;
        fieldName: string;
        fieldType: string;
        completionRate: number;
        averageTimeToComplete: number;
        abandonmentRate: number;
        errorRate: number;
    }> {
        const fieldStats = new Map<string, {
            starts: number;
            completions: number;
            abandonments: number;
            errors: number;
            totalTime: number;
            fieldType: string;
        }>();

        const sessionTimes = new Map<string, Date>();

        events.forEach(event => {
            const fieldId = event.metadata?.fieldId;
            const sessionId = event.metadata?.sessionId;
            const fieldType = event.metadata?.fieldType || 'unknown';

            if (!fieldId) return;

            if (!fieldStats.has(fieldId)) {
                fieldStats.set(fieldId, {
                    starts: 0,
                    completions: 0,
                    abandonments: 0,
                    errors: 0,
                    totalTime: 0,
                    fieldType,
                });
            }

            const stats = fieldStats.get(fieldId)!;

            switch (event.eventType) {
                case 'signature_start':
                    stats.starts++;
                    if (sessionId) {
                        sessionTimes.set(`${fieldId}-${sessionId}`, event.timestamp);
                    }
                    break;
                case 'signature_complete':
                    stats.completions++;
                    if (sessionId) {
                        const startTime = sessionTimes.get(`${fieldId}-${sessionId}`);
                        if (startTime) {
                            const completionTime = (event.timestamp.getTime() - startTime.getTime()) / 1000;
                            if (completionTime >= 0) {
                                stats.totalTime += completionTime;
                            }
                        }
                    }
                    break;
                case 'signature_abandon':
                    stats.abandonments++;
                    break;
            }
        });

        return Array.from(fieldStats.entries()).map(([fieldId, stats]) => ({
            fieldId,
            fieldName: fieldId, // In a real implementation, you'd look up the actual field name
            fieldType: stats.fieldType,
            completionRate: stats.starts > 0 ? (stats.completions / stats.starts) * 100 : 0,
            averageTimeToComplete: stats.completions > 0 ? stats.totalTime / stats.completions : 0,
            abandonmentRate: stats.starts > 0 ? (stats.abandonments / stats.starts) * 100 : 0,
            errorRate: stats.starts > 0 ? (stats.errors / stats.starts) * 100 : 0,
        }));
    }

    /**
     * Analyze user behavior insights
     */
    private analyzeUserBehavior(events: any[]): {
        mostCommonSignatureMethod: 'drawn' | 'typed' | 'uploaded';
        averageFieldsPerDocument: number;
        peakSigningHours: number[];
        deviceUsage: Array<{
            deviceType: 'desktop' | 'mobile' | 'tablet';
            percentage: number;
            completionRate: number;
        }>;
    } {
        // Analyze signature methods
        const methodCounts = new Map<string, number>();
        const hourCounts = new Map<number, number>();
        const deviceCounts = new Map<string, { total: number; completed: number }>();
        const documentFieldCounts = new Map<string, Set<string>>();

        events.forEach(event => {
            const fieldType = event.metadata?.fieldType;
            const userAgent = event.metadata?.userAgent || event.userAgent;
            const hour = event.timestamp.getHours();
            const documentId = event.documentId;
            const fieldId = event.metadata?.fieldId;

            // Count signature methods
            if (fieldType && event.eventType === 'signature_complete') {
                methodCounts.set(fieldType, (methodCounts.get(fieldType) || 0) + 1);
            }

            // Count peak hours
            if (event.eventType === 'signature_start') {
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            }

            // Count fields per document
            if (fieldId && documentId) {
                if (!documentFieldCounts.has(documentId)) {
                    documentFieldCounts.set(documentId, new Set());
                }
                documentFieldCounts.get(documentId)!.add(fieldId);
            }

            // Analyze device usage (simplified)
            if (userAgent) {
                let deviceType = 'desktop';
                if (userAgent.includes('Mobile')) deviceType = 'mobile';
                else if (userAgent.includes('Tablet')) deviceType = 'tablet';

                if (!deviceCounts.has(deviceType)) {
                    deviceCounts.set(deviceType, { total: 0, completed: 0 });
                }

                const deviceStats = deviceCounts.get(deviceType)!;
                if (event.eventType === 'signature_start') {
                    deviceStats.total++;
                } else if (event.eventType === 'signature_complete') {
                    deviceStats.completed++;
                }
            }
        });

        // Find most common signature method
        let mostCommonSignatureMethod: 'drawn' | 'typed' | 'uploaded' = 'drawn';
        let maxCount = 0;
        methodCounts.forEach((count, method) => {
            if (count > maxCount && ['drawn', 'typed', 'uploaded'].includes(method)) {
                maxCount = count;
                mostCommonSignatureMethod = method as 'drawn' | 'typed' | 'uploaded';
            }
        });

        // Calculate average fields per document
        const fieldCounts = Array.from(documentFieldCounts.values()).map(fields => fields.size);
        const averageFieldsPerDocument = fieldCounts.length > 0
            ? fieldCounts.reduce((sum, count) => sum + count, 0) / fieldCounts.length
            : 0;

        // Find peak signing hours (top 3)
        const peakSigningHours = Array.from(hourCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => hour);

        // Calculate device usage
        const totalDeviceEvents = Array.from(deviceCounts.values()).reduce((sum, stats) => sum + stats.total, 0);
        const deviceUsage = Array.from(deviceCounts.entries()).map(([deviceType, stats]) => ({
            deviceType: deviceType as 'desktop' | 'mobile' | 'tablet',
            percentage: totalDeviceEvents > 0 ? (stats.total / totalDeviceEvents) * 100 : 0,
            completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        }));

        return {
            mostCommonSignatureMethod,
            averageFieldsPerDocument,
            peakSigningHours,
            deviceUsage,
        };
    }

    /**
     * Calculate overview metrics for dashboard
     */
    private calculateOverviewMetrics(events: any[], documents: any[]): {
        totalDocuments: number;
        totalSignatureRequests: number;
        totalCompletedSignatures: number;
        overallCompletionRate: number;
        averageTimeToSign: number;
        totalActiveWorkflows: number;
    } {
        const sessionMap = new Map<string, { started: boolean; completed: boolean }>();

        events.forEach(event => {
            const sessionId = event.metadata?.sessionId;
            if (!sessionId) return;

            if (!sessionMap.has(sessionId)) {
                sessionMap.set(sessionId, { started: false, completed: false });
            }

            const session = sessionMap.get(sessionId)!;

            if (event.eventType === 'signature_start') {
                session.started = true;
            } else if (event.eventType === 'signature_complete') {
                if (session.started) session.completed = true;
            }
        });

        const sessions = Array.from(sessionMap.values());
        const totalSignatureRequests = sessions.filter(s => s.started).length;
        const totalCompletedSignatures = sessions.filter(s => s.started && s.completed).length;
        const overallCompletionRate = totalSignatureRequests > 0
            ? (totalCompletedSignatures / totalSignatureRequests) * 100
            : 0;

        const completionTimes = this.calculateCompletionTimes(events);
        const averageTimeToSign = completionTimes.length > 0
            ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
            : 0;

        return {
            totalDocuments: documents.length,
            totalSignatureRequests,
            totalCompletedSignatures,
            overallCompletionRate,
            averageTimeToSign,
            totalActiveWorkflows: documents.filter(doc => doc.status === 'active').length,
        };
    }

    /**
     * Calculate trend metrics for dashboard
     */
    private calculateTrendMetrics(events: any[]): {
        completionRateTrend: Array<{ date: string; rate: number; }>;
        timeToSignTrend: Array<{ date: string; averageTime: number; }>;
        volumeTrend: Array<{ date: string; requests: number; completions: number; }>;
    } {
        const dailyStats = new Map<string, {
            sessions: Map<string, { started: boolean; completed: boolean }>;
            completionTimes: number[];
        }>();

        events.forEach(event => {
            const date = event.timestamp.toISOString().split('T')[0];
            const sessionId = event.metadata?.sessionId;

            if (!dailyStats.has(date)) {
                dailyStats.set(date, {
                    sessions: new Map(),
                    completionTimes: [],
                });
            }

            const dayStats = dailyStats.get(date)!;

            if (sessionId) {
                if (!dayStats.sessions.has(sessionId)) {
                    dayStats.sessions.set(sessionId, { started: false, completed: false });
                }

                const session = dayStats.sessions.get(sessionId)!;

                if (event.eventType === 'signature_start') {
                    session.started = true;
                } else if (event.eventType === 'signature_complete') {
                    if (session.started) session.completed = true;
                }
            }
        });

        // Calculate completion times per day
        const sessionStartTimes = new Map<string, Date>();
        events.forEach(event => {
            const sessionId = event.metadata?.sessionId;
            if (!sessionId) return;

            if (event.eventType === 'signature_start') {
                sessionStartTimes.set(sessionId, event.timestamp);
            } else if (event.eventType === 'signature_complete') {
                const startTime = sessionStartTimes.get(sessionId);
                if (startTime) {
                    const completionTime = (event.timestamp.getTime() - startTime.getTime()) / 1000;
                    if (completionTime >= 0) {
                        const date = event.timestamp.toISOString().split('T')[0];
                        const dayStats = dailyStats.get(date);
                        if (dayStats) {
                            dayStats.completionTimes.push(completionTime);
                        }
                    }
                }
            }
        });

        const completionRateTrend = Array.from(dailyStats.entries()).map(([date, stats]) => {
            const sessions = Array.from(stats.sessions.values());
            const requests = sessions.filter(s => s.started).length;
            const completions = sessions.filter(s => s.started && s.completed).length;
            const rate = requests > 0 ? (completions / requests) * 100 : 0;

            return { date, rate };
        });

        const timeToSignTrend = Array.from(dailyStats.entries()).map(([date, stats]) => {
            const averageTime = stats.completionTimes.length > 0
                ? stats.completionTimes.reduce((sum, time) => sum + time, 0) / stats.completionTimes.length
                : 0;

            return { date, averageTime };
        });

        const volumeTrend = Array.from(dailyStats.entries()).map(([date, stats]) => {
            const sessions = Array.from(stats.sessions.values());
            const requests = sessions.filter(s => s.started).length;
            const completions = sessions.filter(s => s.started && s.completed).length;

            return { date, requests, completions };
        });

        return {
            completionRateTrend,
            timeToSignTrend,
            volumeTrend,
        };
    }

    /**
     * Analyze document performance
     */
    private async analyzeDocumentPerformance(
        documentIds: string[],
        startDate: Date,
        endDate: Date
    ): Promise<{
        topPerforming: Array<{
            documentId: string;
            documentName: string;
            completionRate: number;
            averageTimeToSign: number;
            totalSignatures: number;
        }>;
        underperforming: Array<{
            documentId: string;
            documentName: string;
            completionRate: number;
            averageTimeToSign: number;
            totalSignatures: number;
            recommendations: SignatureOptimizationRecommendation[];
        }>;
    }> {
        const documentPerformance: Array<{
            documentId: string;
            documentName: string;
            completionRate: number;
            averageTimeToSign: number;
            totalSignatures: number;
        }> = [];

        // Calculate performance for each document
        for (const documentId of documentIds) {
            const metrics = await this.getSignatureCompletionMetrics(documentId, startDate, endDate);

            documentPerformance.push({
                documentId,
                documentName: `Document ${documentId.substring(0, 8)}`, // Simplified name
                completionRate: metrics.completionRate,
                averageTimeToSign: metrics.averageTimeToSign,
                totalSignatures: metrics.completedSignatures,
            });
        }

        // Sort by completion rate
        documentPerformance.sort((a, b) => b.completionRate - a.completionRate);

        const topPerforming = documentPerformance.slice(0, 5);
        const underperforming = documentPerformance
            .filter(doc => doc.completionRate < 70)
            .slice(0, 5)
            .map(doc => ({
                ...doc,
                recommendations: [] as SignatureOptimizationRecommendation[], // Would be populated with actual recommendations
            }));

        return {
            topPerforming,
            underperforming,
        };
    }
}