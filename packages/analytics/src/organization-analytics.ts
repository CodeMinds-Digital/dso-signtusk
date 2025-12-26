import { z } from 'zod';
import {
    UsageAnalytics,
    TeamPerformanceMetrics,
    CollaborationInsights,
    CostAnalysis,
    OptimizationRecommendation,
    PredictiveAnalytics,
    OrganizationAnalyticsDashboard,
    AnalyticsRequest,
    AnalyticsEvent,
    AnalyticsRequestSchema,
    AnalyticsEventSchema,
    OptimizationRecommendationSchema,
} from './types';

export class OrganizationAnalyticsService {
    constructor(private db: any) { }

    /**
     * Generate comprehensive usage analytics for an organization
     */
    async generateUsageAnalytics(
        organizationId: string,
        timeRange?: { startDate: Date; endDate: Date }
    ): Promise<UsageAnalytics> {
        const defaultTimeRange = {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
        };

        const range = timeRange || defaultTimeRange;

        // Get basic metrics
        const totalUsers = await this.db.user.count({
            where: { organizationId },
        });

        const activeUsers = await this.db.activity.count({
            where: {
                organizationId,
                timestamp: {
                    gte: range.startDate,
                    lte: range.endDate,
                },
            },
            distinct: ['userId'],
        });

        const totalDocuments = await this.db.document.count({
            where: { organizationId },
        });

        const documentsCreated = await this.db.document.count({
            where: {
                organizationId,
                createdAt: {
                    gte: range.startDate,
                    lte: range.endDate,
                },
            },
        });

        const documentsCompleted = await this.db.document.count({
            where: {
                organizationId,
                status: 'completed',
                updatedAt: {
                    gte: range.startDate,
                    lte: range.endDate,
                },
            },
        });

        const totalSigningRequests = await this.db.signingRequest.count({
            where: { organizationId },
        });

        const signingRequestsCompleted = await this.db.signingRequest.count({
            where: {
                organizationId,
                status: 'completed',
                completedAt: {
                    gte: range.startDate,
                    lte: range.endDate,
                },
            },
        });

        const totalTemplates = await this.db.template.count({
            where: { organizationId },
        });

        const templatesUsed = await this.calculateTemplatesUsed(organizationId, range);
        const storageUsed = await this.calculateStorageUsage(organizationId);
        const apiCalls = await this.db.apiCall.count({
            where: {
                organizationId,
                timestamp: {
                    gte: range.startDate,
                    lte: range.endDate,
                },
            },
        });

        const webhookDeliveries = await this.db.webhookDelivery.count({
            where: {
                organizationId,
                timestamp: {
                    gte: range.startDate,
                    lte: range.endDate,
                },
            },
        });

        // Generate trends
        const userGrowthTrend = await this.generateUserGrowthTrend(organizationId, range);
        const documentActivityTrend = await this.generateDocumentActivityTrend(organizationId, range);
        const signingActivityTrend = await this.generateSigningActivityTrend(organizationId, range);

        return {
            organizationId,
            timeRange: range,
            metrics: {
                totalUsers,
                activeUsers,
                totalDocuments,
                documentsCreated,
                documentsCompleted,
                totalSigningRequests,
                signingRequestsCompleted,
                totalTemplates,
                templatesUsed,
                storageUsed,
                apiCalls,
                webhookDeliveries,
            },
            trends: {
                userGrowth: userGrowthTrend,
                documentActivity: documentActivityTrend,
                signingActivity: signingActivityTrend,
            },
        };
    }

    /**
     * Generate team performance metrics
     */
    async generateTeamPerformanceMetrics(
        organizationId: string,
        timeRange?: { startDate: Date; endDate: Date }
    ): Promise<TeamPerformanceMetrics> {
        const defaultTimeRange = {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
        };

        const range = timeRange || defaultTimeRange;

        const teams = await this.db.team.findMany({
            where: { organizationId },
            include: {
                members: true,
            },
        });

        const teamMetrics = await Promise.all(
            teams.map(async (team: any) => {
                const memberIds = team.members.map((member: any) => member.userId);

                const documentsCreated = await this.db.document.count({
                    where: {
                        createdBy: { in: memberIds },
                        createdAt: {
                            gte: range.startDate,
                            lte: range.endDate,
                        },
                    },
                });

                const documentsCompleted = await this.db.document.count({
                    where: {
                        createdBy: { in: memberIds },
                        status: 'completed',
                        updatedAt: {
                            gte: range.startDate,
                            lte: range.endDate,
                        },
                    },
                });

                const signingRequestsCreated = await this.db.signingRequest.count({
                    where: {
                        createdBy: { in: memberIds },
                        createdAt: {
                            gte: range.startDate,
                            lte: range.endDate,
                        },
                    },
                });

                const signingRequestsCompleted = await this.db.signingRequest.count({
                    where: {
                        createdBy: { in: memberIds },
                        status: 'completed',
                        completedAt: {
                            gte: range.startDate,
                            lte: range.endDate,
                        },
                    },
                });

                const templatesCreated = await this.db.template.count({
                    where: {
                        createdBy: { in: memberIds },
                        createdAt: {
                            gte: range.startDate,
                            lte: range.endDate,
                        },
                    },
                });

                const templatesUsed = await this.db.document.count({
                    where: {
                        templateId: { not: null },
                        createdBy: { in: memberIds },
                        createdAt: {
                            gte: range.startDate,
                            lte: range.endDate,
                        },
                    },
                });

                // Calculate average completion time
                const completedRequests = await this.db.signingRequest.findMany({
                    where: {
                        createdBy: { in: memberIds },
                        status: 'completed',
                        completedAt: {
                            gte: range.startDate,
                            lte: range.endDate,
                        },
                    },
                    select: {
                        createdAt: true,
                        completedAt: true,
                    },
                });

                const averageCompletionTime = completedRequests.length > 0
                    ? completedRequests.reduce((sum: number, req: any) => {
                        const timeDiff = new Date(req.completedAt).getTime() - new Date(req.createdAt).getTime();
                        return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
                    }, 0) / completedRequests.length
                    : 0;

                const completionRate = signingRequestsCreated > 0
                    ? (signingRequestsCompleted / signingRequestsCreated) * 100
                    : 0;

                // Get top performers
                const topPerformers = await this.getTopPerformers(memberIds, range);

                return {
                    teamId: team.id,
                    teamName: team.name,
                    memberCount: team.members.length,
                    metrics: {
                        documentsCreated,
                        documentsCompleted,
                        signingRequestsCreated,
                        signingRequestsCompleted,
                        templatesCreated,
                        templatesUsed,
                        averageCompletionTime,
                        completionRate,
                    },
                    topPerformers,
                };
            })
        );

        // Calculate organization averages
        const organizationAverages = {
            averageCompletionTime: teamMetrics.reduce((sum, team) => sum + team.metrics.averageCompletionTime, 0) / teamMetrics.length,
            averageCompletionRate: teamMetrics.reduce((sum, team) => sum + team.metrics.completionRate, 0) / teamMetrics.length,
            averageDocumentsPerTeam: teamMetrics.reduce((sum, team) => sum + team.metrics.documentsCompleted, 0) / teamMetrics.length,
        };

        return {
            organizationId,
            teams: teamMetrics,
            organizationAverages,
        };
    }

    /**
     * Generate collaboration insights
     */
    async generateCollaborationInsights(organizationId: string): Promise<CollaborationInsights> {
        // Mock implementation - in real app, this would analyze collaboration patterns
        return {
            organizationId,
            metrics: {
                totalCollaborations: 150,
                activeCollaborations: 45,
                averageCollaboratorsPerDocument: 2.3,
                mostCollaborativeTeams: [],
                collaborationPatterns: {
                    internalCollaborations: 120,
                    externalCollaborations: 30,
                    crossTeamCollaborations: 25,
                    averageCollaborationDuration: 4.5,
                },
            },
            networkAnalysis: {
                mostConnectedUsers: [],
                collaborationClusters: [],
            },
        };
    }

    /**
     * Generate cost analysis
     */
    async generateCostAnalysis(
        organizationId: string,
        timeRange: { startDate: Date; endDate: Date }
    ): Promise<CostAnalysis> {
        // Mock implementation - in real app, this would calculate actual costs
        return {
            organizationId,
            timeRange,
            costs: {
                totalCost: 2500,
                costPerUser: 55.56,
                costPerDocument: 2.30,
                costPerSigningRequest: 3.45,
                breakdown: {
                    subscriptionCosts: 2000,
                    storageOverageCosts: 150,
                    apiOverageCosts: 200,
                    additionalFeatureCosts: 150,
                },
            },
            usage: {
                includedLimits: {
                    users: 50,
                    documents: 1000,
                    storage: 100,
                    apiCalls: 10000,
                },
                actualUsage: {
                    users: 45,
                    documents: 1087,
                    storage: 85,
                    apiCalls: 12500,
                },
                overageCharges: {
                    users: 0,
                    documents: 87,
                    storage: 0,
                    apiCalls: 2500,
                },
            },
            projections: {
                nextMonthProjectedCost: 2650,
                nextQuarterProjectedCost: 8200,
                growthRate: 6.0,
            },
        };
    }

    /**
     * Generate predictive analytics
     */
    async generatePredictiveAnalytics(organizationId: string): Promise<PredictiveAnalytics> {
        // Mock implementation - in real app, this would use ML models
        return {
            organizationId,
            predictions: {
                userGrowth: {
                    nextMonth: 48,
                    nextQuarter: 55,
                    nextYear: 75,
                    confidence: 85,
                },
                documentVolume: {
                    nextMonth: 1200,
                    nextQuarter: 3800,
                    nextYear: 16000,
                    confidence: 78,
                },
                storageNeeds: {
                    nextMonth: 95,
                    nextQuarter: 120,
                    nextYear: 200,
                    confidence: 82,
                },
                costProjections: {
                    nextMonth: 2650,
                    nextQuarter: 8200,
                    nextYear: 35000,
                    confidence: 75,
                },
            },
            capacityPlanning: {
                recommendedPlan: 'Professional',
                planUpgradeDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                resourceBottlenecks: [
                    {
                        resource: 'api_calls',
                        currentUtilization: 125,
                        projectedExhaustionDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                        recommendedAction: 'Upgrade to higher API limit plan',
                    },
                ],
            },
            riskFactors: [
                {
                    factor: 'API usage exceeding limits',
                    severity: 'high',
                    description: 'Current API usage is 25% over the plan limit',
                    mitigation: 'Consider upgrading to a higher tier plan',
                },
            ],
        };
    }

    /**
     * Generate comprehensive analytics dashboard
     */
    async generateAnalyticsDashboard(
        organizationId: string,
        request?: Partial<AnalyticsRequest>
    ): Promise<OrganizationAnalyticsDashboard> {
        const validatedRequest = AnalyticsRequestSchema.parse({
            organizationId,
            ...request,
        });

        const timeRange = validatedRequest.timeRange || {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
        };

        const usageAnalytics = await this.generateUsageAnalytics(organizationId, timeRange);
        const teamPerformance = validatedRequest.includeTeamMetrics
            ? await this.generateTeamPerformanceMetrics(organizationId, timeRange)
            : null;
        const collaborationInsights = validatedRequest.includeCollaborationInsights
            ? await this.generateCollaborationInsights(organizationId)
            : null;
        const costAnalysis = validatedRequest.includeCostAnalysis
            ? await this.generateCostAnalysis(organizationId, timeRange)
            : null;
        const predictiveAnalytics = validatedRequest.includePredictiveAnalytics
            ? await this.generatePredictiveAnalytics(organizationId)
            : null;

        // Generate optimization recommendations
        const optimizationRecommendations = await this.generateOptimizationRecommendations(
            organizationId,
            usageAnalytics,
            teamPerformance,
            collaborationInsights
        );

        return {
            organizationId,
            generatedAt: new Date(),
            timeRange,
            overview: {
                totalUsers: usageAnalytics.metrics.totalUsers,
                activeUsers: usageAnalytics.metrics.activeUsers,
                totalDocuments: usageAnalytics.metrics.totalDocuments,
                completedDocuments: usageAnalytics.metrics.documentsCompleted,
                totalSigningRequests: usageAnalytics.metrics.totalSigningRequests,
                completedSigningRequests: usageAnalytics.metrics.signingRequestsCompleted,
                overallCompletionRate: usageAnalytics.metrics.totalSigningRequests > 0
                    ? (usageAnalytics.metrics.signingRequestsCompleted / usageAnalytics.metrics.totalSigningRequests) * 100
                    : 0,
                averageTimeToComplete: teamPerformance?.organizationAverages.averageCompletionTime || 0,
                storageUsed: usageAnalytics.metrics.storageUsed,
                monthlyGrowthRate: 12.5, // Mock value
            },
            usageAnalytics,
            teamPerformance: teamPerformance!,
            collaborationInsights: collaborationInsights!,
            costAnalysis: costAnalysis!,
            optimizationRecommendations,
            predictiveAnalytics: predictiveAnalytics!,
        };
    }

    /**
     * Track analytics events
     */
    async trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
        const validatedEvent = AnalyticsEventSchema.parse(event);

        await this.db.activity.create({
            data: {
                organizationId: validatedEvent.organizationId,
                eventType: validatedEvent.eventType,
                eventData: validatedEvent.eventData,
                timestamp: validatedEvent.timestamp,
                userId: validatedEvent.userId,
                teamId: validatedEvent.teamId,
                metadata: validatedEvent.metadata,
            },
        });
    }

    /**
     * Generate optimization recommendations
     */
    async generateOptimizationRecommendations(
        organizationId: string,
        usageAnalytics: UsageAnalytics,
        teamPerformance?: TeamPerformanceMetrics | null,
        collaborationInsights?: CollaborationInsights | null
    ): Promise<OptimizationRecommendation[]> {
        const recommendations: OptimizationRecommendation[] = [];

        // Low user engagement recommendation
        if (usageAnalytics.metrics.activeUsers / usageAnalytics.metrics.totalUsers < 0.7) {
            recommendations.push({
                id: `rec-${Date.now()}-1`,
                type: 'usage',
                priority: 'medium',
                title: 'Improve User Engagement',
                description: 'User engagement is below optimal levels. Consider implementing user training and onboarding improvements.',
                impact: {
                    metric: 'Active User Rate',
                    estimatedImprovement: '+15-25%',
                },
                actionItems: [
                    'Conduct user training sessions',
                    'Improve onboarding process',
                    'Send engagement reminders',
                ],
                implementation: {
                    effort: 'medium',
                    timeframe: '2-4 weeks',
                    resources: ['Training team', 'Product team'],
                },
            });
        }

        // Template usage recommendation
        if (usageAnalytics.metrics.templatesUsed / usageAnalytics.metrics.totalTemplates < 0.5) {
            recommendations.push({
                id: `rec-${Date.now()}-2`,
                type: 'performance',
                priority: 'low',
                title: 'Increase Template Utilization',
                description: 'Many templates are underutilized. Promote template usage to improve efficiency.',
                impact: {
                    metric: 'Document Creation Efficiency',
                    estimatedImprovement: '+20-30%',
                },
                actionItems: [
                    'Create template usage guidelines',
                    'Highlight popular templates',
                    'Provide template training',
                ],
                implementation: {
                    effort: 'low',
                    timeframe: '1-2 weeks',
                    resources: ['Content team'],
                },
            });
        }

        return recommendations;
    }

    // Private helper methods
    private async calculateStorageUsage(organizationId: string): Promise<number> {
        const documents = await this.db.document.findMany({
            where: { organizationId },
            select: { size: true },
        });

        return documents.reduce((total: number, doc: any) => total + (doc.size || 0), 0);
    }

    private async calculateTemplatesUsed(
        organizationId: string,
        timeRange: { startDate: Date; endDate: Date }
    ): Promise<number> {
        return await this.db.document.count({
            where: {
                organizationId,
                templateId: { not: null },
                createdAt: {
                    gte: timeRange.startDate,
                    lte: timeRange.endDate,
                },
            },
            distinct: ['templateId'],
        });
    }

    private async generateUserGrowthTrend(
        organizationId: string,
        timeRange: { startDate: Date; endDate: Date }
    ): Promise<Array<{ date: string; totalUsers: number; activeUsers: number }>> {
        // Mock implementation - in real app, this would generate actual trend data
        const days = Math.ceil((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const trend = [];

        for (let i = 0; i < Math.min(days, 30); i++) {
            const date = new Date(timeRange.startDate.getTime() + i * 24 * 60 * 60 * 1000);
            trend.push({
                date: date.toISOString().split('T')[0],
                totalUsers: 40 + i,
                activeUsers: 25 + Math.floor(i * 0.8),
            });
        }

        return trend;
    }

    private async generateDocumentActivityTrend(
        organizationId: string,
        timeRange: { startDate: Date; endDate: Date }
    ): Promise<Array<{ date: string; created: number; completed: number }>> {
        // Mock implementation
        const days = Math.ceil((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const trend = [];

        for (let i = 0; i < Math.min(days, 30); i++) {
            const date = new Date(timeRange.startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const created = Math.floor(Math.random() * 20) + 10;
            const completed = Math.floor(created * 0.8);
            trend.push({
                date: date.toISOString().split('T')[0],
                created,
                completed,
            });
        }

        return trend;
    }

    private async generateSigningActivityTrend(
        organizationId: string,
        timeRange: { startDate: Date; endDate: Date }
    ): Promise<Array<{ date: string; requested: number; completed: number }>> {
        // Mock implementation
        const days = Math.ceil((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const trend = [];

        for (let i = 0; i < Math.min(days, 30); i++) {
            const date = new Date(timeRange.startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const requested = Math.floor(Math.random() * 15) + 8;
            const completed = Math.floor(requested * 0.85);
            trend.push({
                date: date.toISOString().split('T')[0],
                requested,
                completed,
            });
        }

        return trend;
    }

    private async getTopPerformers(
        memberIds: string[],
        timeRange: { startDate: Date; endDate: Date }
    ): Promise<Array<{ userId: string; userName: string; documentsCompleted: number; completionRate: number }>> {
        // Mock implementation
        return memberIds.slice(0, 3).map((userId, index) => ({
            userId,
            userName: `User ${index + 1}`,
            documentsCompleted: Math.floor(Math.random() * 50) + 20,
            completionRate: Math.floor(Math.random() * 20) + 80,
        }));
    }
}
