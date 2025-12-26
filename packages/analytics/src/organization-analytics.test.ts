import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationAnalyticsService } from './organization-analytics';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockDb = {
    user: {
        count: vi.fn(),
        findMany: vi.fn(),
    },
    document: {
        count: vi.fn(),
        findMany: vi.fn(),
    },
    signingRequest: {
        count: vi.fn(),
        findMany: vi.fn(),
    },
    template: {
        count: vi.fn(),
        findMany: vi.fn(),
    },
    team: {
        findMany: vi.fn(),
    },
    subscription: {
        findUnique: vi.fn(),
    },
    webhookDelivery: {
        count: vi.fn(),
    },
    activity: {
        count: vi.fn(),
        create: vi.fn(),
    },
    templateCollaborator: {
        findMany: vi.fn(),
    },
    documentShare: {
        findMany: vi.fn(),
    },
} as unknown as PrismaClient;

describe('OrganizationAnalyticsService', () => {
    let analyticsService: OrganizationAnalyticsService;
    const organizationId = 'test-org-123';
    const timeRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
    };

    beforeEach(() => {
        analyticsService = new OrganizationAnalyticsService(mockDb);
        vi.clearAllMocks();
    });

    describe('generateUsageAnalytics', () => {
        it('should generate usage analytics with correct metrics', async () => {
            // Mock database responses
            mockDb.user.count
                .mockResolvedValueOnce(100) // totalUsers
                .mockResolvedValueOnce(75); // activeUsers

            mockDb.document.findMany.mockResolvedValue([
                { id: '1', status: 'COMPLETED', createdAt: new Date('2024-01-15') },
                { id: '2', status: 'DRAFT', createdAt: new Date('2024-01-20') },
            ]);

            mockDb.signingRequest.findMany.mockResolvedValue([
                { id: '1', status: 'COMPLETED', createdAt: new Date('2024-01-10'), completedAt: new Date('2024-01-12') },
                { id: '2', status: 'SENT', createdAt: new Date('2024-01-25'), completedAt: null },
            ]);

            mockDb.template.findMany.mockResolvedValue([
                { id: '1', createdAt: new Date('2024-01-05') },
            ]);

            mockDb.webhookDelivery.count.mockResolvedValue(50);
            mockDb.activity.count.mockResolvedValue(200);

            // Mock private methods
            vi.spyOn(analyticsService as any, 'calculateStorageUsage').mockResolvedValue(1024 * 1024 * 100); // 100MB
            vi.spyOn(analyticsService as any, 'calculateTemplatesUsed').mockResolvedValue(5);
            vi.spyOn(analyticsService as any, 'generateUserGrowthTrend').mockResolvedValue([]);
            vi.spyOn(analyticsService as any, 'generateDocumentActivityTrend').mockResolvedValue([]);
            vi.spyOn(analyticsService as any, 'generateSigningActivityTrend').mockResolvedValue([]);

            const result = await analyticsService.generateUsageAnalytics(organizationId, timeRange);

            expect(result).toEqual({
                organizationId,
                timeRange,
                metrics: {
                    totalUsers: 100,
                    activeUsers: 75,
                    totalDocuments: 2,
                    documentsCreated: 2,
                    documentsCompleted: 1,
                    totalSigningRequests: 2,
                    signingRequestsCompleted: 1,
                    totalTemplates: 1,
                    templatesUsed: 5,
                    storageUsed: 1024 * 1024 * 100,
                    apiCalls: 1000, // 200 activities * 5
                    webhookDeliveries: 50,
                },
                trends: {
                    userGrowth: [],
                    documentActivity: [],
                    signingActivity: [],
                },
            });
        });

        it('should handle empty data gracefully', async () => {
            // Mock empty responses
            mockDb.user.count.mockResolvedValue(0);
            mockDb.document.findMany.mockResolvedValue([]);
            mockDb.signingRequest.findMany.mockResolvedValue([]);
            mockDb.template.findMany.mockResolvedValue([]);
            mockDb.webhookDelivery.count.mockResolvedValue(0);
            mockDb.activity.count.mockResolvedValue(0);

            vi.spyOn(analyticsService as any, 'calculateStorageUsage').mockResolvedValue(0);
            vi.spyOn(analyticsService as any, 'calculateTemplatesUsed').mockResolvedValue(0);
            vi.spyOn(analyticsService as any, 'generateUserGrowthTrend').mockResolvedValue([]);
            vi.spyOn(analyticsService as any, 'generateDocumentActivityTrend').mockResolvedValue([]);
            vi.spyOn(analyticsService as any, 'generateSigningActivityTrend').mockResolvedValue([]);

            const result = await analyticsService.generateUsageAnalytics(organizationId, timeRange);

            expect(result.metrics.totalUsers).toBe(0);
            expect(result.metrics.activeUsers).toBe(0);
            expect(result.metrics.totalDocuments).toBe(0);
            expect(result.metrics.apiCalls).toBe(0);
        });
    });

    describe('generateAnalyticsDashboard', () => {
        it('should generate comprehensive analytics dashboard', async () => {
            // Mock all required methods
            vi.spyOn(analyticsService, 'generateUsageAnalytics').mockResolvedValue({
                organizationId,
                timeRange,
                metrics: {
                    totalUsers: 100,
                    activeUsers: 75,
                    totalDocuments: 500,
                    documentsCreated: 50,
                    documentsCompleted: 45,
                    totalSigningRequests: 200,
                    signingRequestsCompleted: 180,
                    totalTemplates: 25,
                    templatesUsed: 20,
                    storageUsed: 1024 * 1024 * 500, // 500MB
                    apiCalls: 1000,
                    webhookDeliveries: 100,
                },
                trends: {
                    userGrowth: [{ date: '2024-01-01', totalUsers: 95, activeUsers: 70 }],
                    documentActivity: [{ date: '2024-01-01', created: 5, completed: 4 }],
                    signingActivity: [{ date: '2024-01-01', requested: 10, completed: 9 }],
                },
            });

            vi.spyOn(analyticsService, 'generateTeamPerformanceMetrics').mockResolvedValue({
                organizationId,
                teams: [],
                organizationAverages: {
                    averageCompletionTime: 24,
                    averageCompletionRate: 90,
                    averageDocumentsPerTeam: 50,
                },
            });

            vi.spyOn(analyticsService, 'generateCollaborationInsights').mockResolvedValue({
                organizationId,
                metrics: {
                    totalCollaborations: 150,
                    activeCollaborations: 75,
                    averageCollaboratorsPerDocument: 2.5,
                    mostCollaborativeTeams: [],
                    collaborationPatterns: {
                        internalCollaborations: 120,
                        externalCollaborations: 30,
                        crossTeamCollaborations: 45,
                        averageCollaborationDuration: 48,
                    },
                },
                networkAnalysis: {
                    mostConnectedUsers: [],
                    collaborationClusters: [],
                },
            });

            vi.spyOn(analyticsService, 'generateCostAnalysis').mockResolvedValue({
                organizationId,
                timeRange,
                costs: {
                    totalCost: 299.99,
                    costPerUser: 3.00,
                    costPerDocument: 0.60,
                    costPerSigningRequest: 1.50,
                    breakdown: {
                        subscriptionCosts: 199.99,
                        storageOverageCosts: 50.00,
                        apiOverageCosts: 25.00,
                        additionalFeatureCosts: 25.00,
                    },
                },
                usage: {
                    includedLimits: { users: 100, documents: 1000, storage: 10, apiCalls: 10000 },
                    actualUsage: { users: 100, documents: 500, storage: 0.5, apiCalls: 1000 },
                    overageCharges: { users: 0, documents: 0, storage: 0, apiCalls: 0 },
                },
                projections: {
                    nextMonthProjectedCost: 320.00,
                    nextQuarterProjectedCost: 950.00,
                    growthRate: 5.2,
                },
            });

            vi.spyOn(analyticsService, 'generatePredictiveAnalytics').mockResolvedValue({
                organizationId,
                predictions: {
                    userGrowth: { nextMonth: 105, nextQuarter: 115, nextYear: 150, confidence: 85 },
                    documentVolume: { nextMonth: 525, nextQuarter: 575, nextYear: 750, confidence: 80 },
                    storageNeeds: { nextMonth: 0.6, nextQuarter: 0.8, nextYear: 1.2, confidence: 75 },
                    costProjections: { nextMonth: 320, nextQuarter: 950, nextYear: 3800, confidence: 70 },
                },
                capacityPlanning: {
                    recommendedPlan: 'professional',
                    resourceBottlenecks: [],
                },
                riskFactors: [],
            });

            vi.spyOn(analyticsService, 'generateOptimizationRecommendations').mockResolvedValue([]);

            const result = await analyticsService.generateAnalyticsDashboard({
                organizationId,
                timeRange,
                includeTeamMetrics: true,
                includeCollaborationInsights: true,
                includeCostAnalysis: true,
                includePredictiveAnalytics: true,
            });

            expect(result.organizationId).toBe(organizationId);
            expect(result.timeRange).toEqual(timeRange);
            expect(result.overview.totalUsers).toBe(100);
            expect(result.overview.overallCompletionRate).toBe(90); // 180/200 * 100
            expect(result.usageAnalytics).toBeDefined();
            expect(result.teamPerformance).toBeDefined();
            expect(result.collaborationInsights).toBeDefined();
            expect(result.costAnalysis).toBeDefined();
            expect(result.predictiveAnalytics).toBeDefined();
            expect(result.optimizationRecommendations).toBeDefined();
        });

        it('should use default time range when not provided', async () => {
            const mockUsageAnalytics = {
                organizationId,
                timeRange: { startDate: new Date(), endDate: new Date() },
                metrics: {
                    totalUsers: 0,
                    activeUsers: 0,
                    totalDocuments: 0,
                    documentsCreated: 0,
                    documentsCompleted: 0,
                    totalSigningRequests: 0,
                    signingRequestsCompleted: 0,
                    totalTemplates: 0,
                    templatesUsed: 0,
                    storageUsed: 0,
                    apiCalls: 0,
                    webhookDeliveries: 0,
                },
                trends: { userGrowth: [], documentActivity: [], signingActivity: [] },
            };

            const mockTeamPerformance = {
                organizationId,
                teams: [],
                organizationAverages: { averageCompletionTime: 0, averageCompletionRate: 0, averageDocumentsPerTeam: 0 },
            };

            const mockCollaborationInsights = {
                organizationId,
                metrics: {
                    totalCollaborations: 0,
                    activeCollaborations: 0,
                    averageCollaboratorsPerDocument: 0,
                    mostCollaborativeTeams: [],
                    collaborationPatterns: {
                        internalCollaborations: 0,
                        externalCollaborations: 0,
                        crossTeamCollaborations: 0,
                        averageCollaborationDuration: 0,
                    },
                },
                networkAnalysis: { mostConnectedUsers: [], collaborationClusters: [] },
            };

            const mockCostAnalysis = {
                organizationId,
                timeRange: { startDate: new Date(), endDate: new Date() },
                costs: {
                    totalCost: 0,
                    costPerUser: 0,
                    costPerDocument: 0,
                    costPerSigningRequest: 0,
                    breakdown: { subscriptionCosts: 0, storageOverageCosts: 0, apiOverageCosts: 0, additionalFeatureCosts: 0 },
                },
                usage: {
                    includedLimits: { users: 0, documents: 0, storage: 0, apiCalls: 0 },
                    actualUsage: { users: 0, documents: 0, storage: 0, apiCalls: 0 },
                    overageCharges: { users: 0, documents: 0, storage: 0, apiCalls: 0 },
                },
                projections: { nextMonthProjectedCost: 0, nextQuarterProjectedCost: 0, growthRate: 0 },
            };

            const mockPredictiveAnalytics = {
                organizationId,
                predictions: {
                    userGrowth: { nextMonth: 0, nextQuarter: 0, nextYear: 0, confidence: 0 },
                    documentVolume: { nextMonth: 0, nextQuarter: 0, nextYear: 0, confidence: 0 },
                    storageNeeds: { nextMonth: 0, nextQuarter: 0, nextYear: 0, confidence: 0 },
                    costProjections: { nextMonth: 0, nextQuarter: 0, nextYear: 0, confidence: 0 },
                },
                capacityPlanning: { recommendedPlan: 'current', resourceBottlenecks: [] },
                riskFactors: [],
            };

            vi.spyOn(analyticsService, 'generateUsageAnalytics').mockResolvedValue(mockUsageAnalytics);
            vi.spyOn(analyticsService, 'generateTeamPerformanceMetrics').mockResolvedValue(mockTeamPerformance);
            vi.spyOn(analyticsService, 'generateCollaborationInsights').mockResolvedValue(mockCollaborationInsights);
            vi.spyOn(analyticsService, 'generateCostAnalysis').mockResolvedValue(mockCostAnalysis);
            vi.spyOn(analyticsService, 'generatePredictiveAnalytics').mockResolvedValue(mockPredictiveAnalytics);
            vi.spyOn(analyticsService, 'generateOptimizationRecommendations').mockResolvedValue([]);

            const result = await analyticsService.generateAnalyticsDashboard({
                organizationId,
            });

            expect(result.timeRange.startDate).toBeInstanceOf(Date);
            expect(result.timeRange.endDate).toBeInstanceOf(Date);
            expect(result.timeRange.endDate.getTime()).toBeGreaterThan(result.timeRange.startDate.getTime());
        });
    });

    describe('trackAnalyticsEvent', () => {
        it('should track analytics events successfully', async () => {
            mockDb.activity.create.mockResolvedValue({ id: 'activity-123' });

            const event = {
                organizationId,
                eventType: 'user_activity' as const,
                eventData: { action: 'login', userId: 'user-123' },
                userId: 'user-123',
                timestamp: new Date(),
            };

            await analyticsService.trackAnalyticsEvent(event);

            expect(mockDb.activity.create).toHaveBeenCalledWith({
                data: {
                    type: 'USER_LOGIN',
                    description: 'Analytics event: user_activity',
                    metadata: {
                        originalEventType: 'user_activity',
                        eventData: { action: 'login', userId: 'user-123' },
                        organizationId,
                    },
                    userId: 'user-123',
                    timestamp: event.timestamp,
                },
            });
        });

        it('should validate analytics events', async () => {
            const invalidEvent = {
                organizationId: '', // Invalid: empty string
                eventType: 'invalid_type' as any,
                eventData: {},
            };

            await expect(analyticsService.trackAnalyticsEvent(invalidEvent)).rejects.toThrow();
        });
    });

    describe('generateOptimizationRecommendations', () => {
        it('should generate recommendations for low user engagement', async () => {
            const usageAnalytics = {
                organizationId,
                timeRange,
                metrics: {
                    totalUsers: 100,
                    activeUsers: 50, // 50% engagement - below 60% threshold
                    totalDocuments: 200,
                    documentsCreated: 20,
                    documentsCompleted: 18,
                    totalSigningRequests: 50,
                    signingRequestsCompleted: 45,
                    totalTemplates: 10,
                    templatesUsed: 8,
                    storageUsed: 1024 * 1024 * 100,
                    apiCalls: 500,
                    webhookDeliveries: 25,
                },
                trends: {
                    userGrowth: [],
                    documentActivity: [],
                    signingActivity: [],
                },
            };

            const teamPerformance = {
                organizationId,
                teams: [],
                organizationAverages: {
                    averageCompletionTime: 24,
                    averageCompletionRate: 85,
                    averageDocumentsPerTeam: 20,
                },
            };

            const collaborationInsights = {
                organizationId,
                metrics: {
                    totalCollaborations: 50,
                    activeCollaborations: 25,
                    averageCollaboratorsPerDocument: 1.5, // Below 2 threshold
                    mostCollaborativeTeams: [],
                    collaborationPatterns: {
                        internalCollaborations: 40,
                        externalCollaborations: 10,
                        crossTeamCollaborations: 15,
                        averageCollaborationDuration: 36,
                    },
                },
                networkAnalysis: {
                    mostConnectedUsers: [],
                    collaborationClusters: [],
                },
            };

            const costAnalysis = {
                organizationId,
                timeRange,
                costs: {
                    totalCost: 1200, // High cost
                    costPerUser: 12, // Above $10 threshold
                    costPerDocument: 6,
                    costPerSigningRequest: 24,
                    breakdown: {
                        subscriptionCosts: 999,
                        storageOverageCosts: 100,
                        apiOverageCosts: 50,
                        additionalFeatureCosts: 51,
                    },
                },
                usage: {
                    includedLimits: { users: 100, documents: 1000, storage: 10, apiCalls: 10000 },
                    actualUsage: { users: 100, documents: 200, storage: 5, apiCalls: 500 },
                    overageCharges: { users: 0, documents: 0, storage: 0, apiCalls: 0 },
                },
                projections: {
                    nextMonthProjectedCost: 1300,
                    nextQuarterProjectedCost: 3900,
                    growthRate: 8.3,
                },
            };

            const recommendations = await analyticsService.generateOptimizationRecommendations(
                organizationId,
                usageAnalytics,
                teamPerformance,
                collaborationInsights,
                costAnalysis
            );

            expect(recommendations).toHaveLength(3);

            // Check for user engagement recommendation
            const engagementRec = recommendations.find(r => r.type === 'usage');
            expect(engagementRec).toBeDefined();
            expect(engagementRec?.title).toContain('Low User Engagement');
            expect(engagementRec?.priority).toBe('medium');

            // Check for cost optimization recommendation
            const costRec = recommendations.find(r => r.type === 'cost');
            expect(costRec).toBeDefined();
            expect(costRec?.title).toContain('High Cost Per User');
            expect(costRec?.priority).toBe('high');

            // Check for collaboration recommendation
            const collabRec = recommendations.find(r => r.type === 'collaboration');
            expect(collabRec).toBeDefined();
            expect(collabRec?.title).toContain('Low Collaboration Levels');
            expect(collabRec?.priority).toBe('medium');
        });
    });
});