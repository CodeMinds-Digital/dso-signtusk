import { z } from 'zod';

// ============================================================================
// ORGANIZATION ANALYTICS TYPES
// ============================================================================

export interface UsageAnalytics {
    organizationId: string;
    timeRange: {
        startDate: Date;
        endDate: Date;
    };
    metrics: {
        totalUsers: number;
        activeUsers: number;
        totalDocuments: number;
        documentsCreated: number;
        documentsCompleted: number;
        totalSigningRequests: number;
        signingRequestsCompleted: number;
        totalTemplates: number;
        templatesUsed: number;
        storageUsed: number; // in bytes
        apiCalls: number;
        webhookDeliveries: number;
    };
    trends: {
        userGrowth: Array<{
            date: string;
            totalUsers: number;
            activeUsers: number;
        }>;
        documentActivity: Array<{
            date: string;
            created: number;
            completed: number;
        }>;
        signingActivity: Array<{
            date: string;
            requested: number;
            completed: number;
        }>;
    };
}

export interface TeamPerformanceMetrics {
    organizationId: string;
    teams: Array<{
        teamId: string;
        teamName: string;
        memberCount: number;
        metrics: {
            documentsCreated: number;
            documentsCompleted: number;
            signingRequestsCreated: number;
            signingRequestsCompleted: number;
            templatesCreated: number;
            templatesUsed: number;
            averageCompletionTime: number; // in hours
            completionRate: number; // percentage
        };
        topPerformers: Array<{
            userId: string;
            userName: string;
            documentsCompleted: number;
            completionRate: number;
        }>;
    }>;
    organizationAverages: {
        averageCompletionTime: number;
        averageCompletionRate: number;
        averageDocumentsPerTeam: number;
    };
}

export interface CollaborationInsights {
    organizationId: string;
    metrics: {
        totalCollaborations: number;
        activeCollaborations: number;
        averageCollaboratorsPerDocument: number;
        mostCollaborativeTeams: Array<{
            teamId: string;
            teamName: string;
            collaborationScore: number;
            crossTeamCollaborations: number;
        }>;
        collaborationPatterns: {
            internalCollaborations: number;
            externalCollaborations: number;
            crossTeamCollaborations: number;
            averageCollaborationDuration: number; // in hours
        };
    };
    networkAnalysis: {
        mostConnectedUsers: Array<{
            userId: string;
            userName: string;
            connectionCount: number;
            collaborationFrequency: number;
        }>;
        collaborationClusters: Array<{
            clusterId: string;
            memberCount: number;
            collaborationIntensity: number;
            primaryTeams: string[];
        }>;
    };
}

export interface CostAnalysis {
    organizationId: string;
    timeRange: {
        startDate: Date;
        endDate: Date;
    };
    costs: {
        totalCost: number;
        costPerUser: number;
        costPerDocument: number;
        costPerSigningRequest: number;
        breakdown: {
            subscriptionCosts: number;
            storageOverageCosts: number;
            apiOverageCosts: number;
            additionalFeatureCosts: number;
        };
    };
    usage: {
        includedLimits: {
            users: number;
            documents: number;
            storage: number; // in GB
            apiCalls: number;
        };
        actualUsage: {
            users: number;
            documents: number;
            storage: number; // in GB
            apiCalls: number;
        };
        overageCharges: {
            users: number;
            documents: number;
            storage: number;
            apiCalls: number;
        };
    };
    projections: {
        nextMonthProjectedCost: number;
        nextQuarterProjectedCost: number;
        growthRate: number; // percentage
    };
}

export interface OptimizationRecommendation {
    id: string;
    type: 'cost' | 'performance' | 'usage' | 'collaboration';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: {
        metric: string;
        estimatedImprovement: string;
        potentialSavings?: number;
    };
    actionItems: string[];
    implementation: {
        effort: 'low' | 'medium' | 'high';
        timeframe: string;
        resources: string[];
    };
    affectedTeams?: string[];
    affectedUsers?: string[];
}

export interface PredictiveAnalytics {
    organizationId: string;
    predictions: {
        userGrowth: {
            nextMonth: number;
            nextQuarter: number;
            nextYear: number;
            confidence: number; // percentage
        };
        documentVolume: {
            nextMonth: number;
            nextQuarter: number;
            nextYear: number;
            confidence: number;
        };
        storageNeeds: {
            nextMonth: number; // in GB
            nextQuarter: number;
            nextYear: number;
            confidence: number;
        };
        costProjections: {
            nextMonth: number;
            nextQuarter: number;
            nextYear: number;
            confidence: number;
        };
    };
    capacityPlanning: {
        recommendedPlan: string;
        planUpgradeDate?: Date;
        resourceBottlenecks: Array<{
            resource: 'users' | 'storage' | 'api_calls' | 'documents';
            currentUtilization: number; // percentage
            projectedExhaustionDate?: Date;
            recommendedAction: string;
        }>;
    };
    riskFactors: Array<{
        factor: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        mitigation: string;
    }>;
}

export interface OrganizationAnalyticsDashboard {
    organizationId: string;
    generatedAt: Date;
    timeRange: {
        startDate: Date;
        endDate: Date;
    };
    overview: {
        totalUsers: number;
        activeUsers: number;
        totalDocuments: number;
        completedDocuments: number;
        totalSigningRequests: number;
        completedSigningRequests: number;
        overallCompletionRate: number;
        averageTimeToComplete: number;
        storageUsed: number;
        monthlyGrowthRate: number;
    };
    usageAnalytics: UsageAnalytics;
    teamPerformance: TeamPerformanceMetrics;
    collaborationInsights: CollaborationInsights;
    costAnalysis: CostAnalysis;
    optimizationRecommendations: OptimizationRecommendation[];
    predictiveAnalytics: PredictiveAnalytics;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const TimeRangeSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
}).refine(data => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to end date",
});

export const AnalyticsRequestSchema = z.object({
    organizationId: z.string().min(1),
    timeRange: TimeRangeSchema.optional(),
    includeTeamMetrics: z.boolean().default(true),
    includeCollaborationInsights: z.boolean().default(true),
    includeCostAnalysis: z.boolean().default(true),
    includePredictiveAnalytics: z.boolean().default(false),
});

export const OptimizationRecommendationSchema = z.object({
    id: z.string(),
    type: z.enum(['cost', 'performance', 'usage', 'collaboration']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string().min(1),
    description: z.string().min(1),
    impact: z.object({
        metric: z.string(),
        estimatedImprovement: z.string(),
        potentialSavings: z.number().optional(),
    }),
    actionItems: z.array(z.string()),
    implementation: z.object({
        effort: z.enum(['low', 'medium', 'high']),
        timeframe: z.string(),
        resources: z.array(z.string()),
    }),
    affectedTeams: z.array(z.string()).optional(),
    affectedUsers: z.array(z.string()).optional(),
});

// ============================================================================
// ANALYTICS EVENT TYPES
// ============================================================================

export interface AnalyticsEvent {
    organizationId: string;
    eventType: 'user_activity' | 'document_activity' | 'signing_activity' | 'collaboration_activity' | 'cost_event';
    eventData: Record<string, any>;
    timestamp: Date;
    userId?: string;
    teamId?: string;
    metadata?: Record<string, any>;
}

export const AnalyticsEventSchema = z.object({
    organizationId: z.string().min(1),
    eventType: z.enum(['user_activity', 'document_activity', 'signing_activity', 'collaboration_activity', 'cost_event']),
    eventData: z.record(z.any()),
    timestamp: z.date().default(() => new Date()),
    userId: z.string().optional(),
    teamId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;
export type ValidatedAnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type ValidatedOptimizationRecommendation = z.infer<typeof OptimizationRecommendationSchema>;