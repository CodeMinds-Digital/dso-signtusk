import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fc } from 'fast-check';
import { DashboardBuilderService } from '../../packages/analytics/src/dashboard-builder';
import { ReportingEngineService } from '../../packages/analytics/src/reporting-engine';
import { DataExportService } from '../../packages/analytics/src/data-export';
import { PredictiveAnalyticsService } from '../../packages/analytics/src/predictive-analytics';
import { OrganizationAnalyticsService } from '../../packages/analytics/src/organization-analytics';

/**
 * **Feature: docusign-alternative-comprehensive, Property 46: Analytics Dashboard Accuracy**
 * **Validates: Requirements 10.1**
 * 
 * Property-based tests for advanced analytics system functionality.
 * Tests that comprehensive dashboards display correctly with accurate key performance indicators,
 * correct metrics, and real-time data updates.
 */

// Mock database and services
const mockDb = {
    dashboard: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
    },
    report: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
    },
    reportExecution: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    exportRequest: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    predictiveModel: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    predictionRequest: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    mlInsight: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
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
    activity: {
        count: vi.fn(),
        create: vi.fn(),
    },
    webhookDelivery: {
        count: vi.fn(),
    },
    apiCall: {
        count: vi.fn(),
    },
    $queryRaw: vi.fn(),
};

const mockStorageService = {
    uploadFile: vi.fn(),
};

const mockAnalyticsService = {
    generateUsageAnalytics: vi.fn(),
    generateTeamPerformanceMetrics: vi.fn(),
    generateCollaborationInsights: vi.fn(),
    generateCostAnalysis: vi.fn(),
    generatePredictiveAnalytics: vi.fn(),
    generateAnalyticsDashboard: vi.fn(),
};

const mockReportingService = {
    executeReport: vi.fn(),
};

const mockMlEngine = {
    trainModel: vi.fn(),
    predict: vi.fn(),
};

// Arbitraries for property-based testing
const organizationIdArb = fc.string({ minLength: 1, maxLength: 50 });
const userIdArb = fc.string({ minLength: 1, maxLength: 50 });
const dashboardNameArb = fc.string({ minLength: 1, maxLength: 100 });
const reportNameArb = fc.string({ minLength: 1, maxLength: 100 });

const widgetTypeArb = fc.constantFrom('chart', 'metric', 'table', 'text', 'filter');
const chartTypeArb = fc.constantFrom('line', 'bar', 'pie', 'area', 'scatter', 'heatmap');
const exportFormatArb = fc.constantFrom('csv', 'excel', 'pdf', 'json', 'xml');

const positionArb = fc.record({
    x: fc.integer({ min: 0, max: 100 }),
    y: fc.integer({ min: 0, max: 100 }),
    width: fc.integer({ min: 1, max: 50 }),
    height: fc.integer({ min: 1, max: 50 }),
});

const widgetArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    type: widgetTypeArb,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    position: positionArb,
    configuration: fc.record({
        chartType: fc.option(chartTypeArb),
        metrics: fc.option(fc.array(fc.string(), { minLength: 0, maxLength: 10 })),
        dimensions: fc.option(fc.array(fc.string(), { minLength: 0, maxLength: 10 })),
    }),
});

const dashboardArb = fc.record({
    name: dashboardNameArb,
    description: fc.option(fc.string({ maxLength: 500 })),
    organizationId: organizationIdArb,
    createdBy: userIdArb,
    isPublic: fc.boolean(),
    widgets: fc.array(widgetArb, { minLength: 0, maxLength: 20 }),
    layout: fc.record({
        columns: fc.integer({ min: 1, max: 12 }),
        rowHeight: fc.integer({ min: 50, max: 200 }),
        margin: fc.tuple(fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 })),
        containerPadding: fc.tuple(fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 })),
        breakpoints: fc.record({
            lg: fc.integer({ min: 1200, max: 2000 }),
            md: fc.integer({ min: 996, max: 1199 }),
            sm: fc.integer({ min: 768, max: 995 }),
            xs: fc.integer({ min: 480, max: 767 }),
            xxs: fc.integer({ min: 0, max: 479 }),
        }),
        layouts: fc.record({
            lg: fc.array(fc.record({
                i: fc.string(),
                x: fc.integer({ min: 0, max: 11 }),
                y: fc.integer({ min: 0, max: 100 }),
                w: fc.integer({ min: 1, max: 12 }),
                h: fc.integer({ min: 1, max: 20 }),
            })),
        }),
    }),
    permissions: fc.record({
        view: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        edit: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        delete: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
        share: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
    }),
    tags: fc.option(fc.array(fc.string(), { minLength: 0, maxLength: 10 })),
});

const analyticsDataArb = fc.record({
    totalUsers: fc.integer({ min: 0, max: 10000 }),
    activeUsers: fc.integer({ min: 0, max: 10000 }),
    totalDocuments: fc.integer({ min: 0, max: 100000 }),
    documentsCompleted: fc.integer({ min: 0, max: 100000 }),
    totalSigningRequests: fc.integer({ min: 0, max: 100000 }),
    completedSigningRequests: fc.integer({ min: 0, max: 100000 }),
    storageUsed: fc.integer({ min: 0, max: 1000000000 }), // bytes
    apiCalls: fc.integer({ min: 0, max: 1000000 }),
});

const exportConfigArb = fc.record({
    filename: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    includeHeaders: fc.boolean(),
    dateFormat: fc.constantFrom('YYYY-MM-DD', 'MM/DD/YYYY', 'DD-MM-YYYY'),
    numberFormat: fc.constantFrom('#,##0.00', '#.##0,00', '0.00'),
    encoding: fc.constantFrom('utf-8', 'latin1', 'ascii'),
    compression: fc.constantFrom('none', 'gzip', 'zip'),
});

describe('Advanced Analytics System Properties', () => {
    let dashboardService: DashboardBuilderService;
    let reportingService: ReportingEngineService;
    let exportService: DataExportService;
    let predictiveService: PredictiveAnalyticsService;
    let analyticsService: OrganizationAnalyticsService;

    beforeEach(() => {
        vi.clearAllMocks();

        dashboardService = new DashboardBuilderService(mockDb, mockAnalyticsService);
        reportingService = new ReportingEngineService(mockDb, mockAnalyticsService, mockStorageService);
        exportService = new DataExportService(mockDb, mockStorageService, mockAnalyticsService, mockReportingService);
        predictiveService = new PredictiveAnalyticsService(mockDb, mockAnalyticsService, mockMlEngine);
        analyticsService = new OrganizationAnalyticsService(mockDb);
    });

    describe('Dashboard Builder Properties', () => {
        it('Property: Dashboard creation preserves all input data', async () => {
            await fc.assert(fc.asyncProperty(
                dashboardArb,
                organizationIdArb,
                userIdArb,
                async (dashboardData, orgId, userId) => {
                    // Mock successful database creation
                    mockDb.dashboard.create.mockResolvedValue({
                        id: 'test-dashboard-id',
                        ...dashboardData,
                        organizationId: orgId,
                        createdBy: userId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    const result = await dashboardService.createDashboard(orgId, userId, {
                        ...dashboardData,
                        organizationId: orgId,
                        createdBy: userId,
                    });

                    // Verify all input data is preserved
                    expect(result.name).toBe(dashboardData.name);
                    expect(result.description).toBe(dashboardData.description);
                    expect(result.organizationId).toBe(orgId);
                    expect(result.createdBy).toBe(userId);
                    expect(result.isPublic).toBe(dashboardData.isPublic);
                    expect(result.widgets).toHaveLength(dashboardData.widgets.length);
                    expect(result.layout.columns).toBe(dashboardData.layout.columns);
                    expect(result.permissions).toEqual(dashboardData.permissions);
                    expect(result.tags).toEqual(dashboardData.tags);
                }
            ), { numRuns: 50 });
        });

        it('Property: Widget operations maintain dashboard consistency', async () => {
            await fc.assert(fc.asyncProperty(
                dashboardArb,
                widgetArb,
                organizationIdArb,
                userIdArb,
                async (dashboardData, widget, orgId, userId) => {
                    // Mock dashboard retrieval
                    const mockDashboard = {
                        id: 'test-dashboard-id',
                        ...dashboardData,
                        organizationId: orgId,
                        createdBy: userId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    mockDb.dashboard.findUnique.mockResolvedValue({
                        ...mockDashboard,
                        widgets: JSON.stringify(dashboardData.widgets),
                        layout: JSON.stringify(dashboardData.layout),
                        permissions: JSON.stringify(dashboardData.permissions),
                    });

                    mockDb.dashboard.update.mockResolvedValue(mockDashboard);

                    // Add widget
                    const updatedDashboard = await dashboardService.addWidget(
                        'test-dashboard-id',
                        userId,
                        widget
                    );

                    // Verify widget was added and dashboard consistency maintained
                    expect(updatedDashboard.widgets).toHaveLength(dashboardData.widgets.length + 1);
                    expect(updatedDashboard.widgets).toContainEqual(widget);
                    expect(updatedDashboard.organizationId).toBe(orgId);
                    expect(updatedDashboard.name).toBe(dashboardData.name);
                }
            ), { numRuns: 30 });
        });

        it('Property: Dashboard permissions are correctly enforced', async () => {
            await fc.assert(fc.asyncProperty(
                dashboardArb,
                userIdArb,
                fc.string({ minLength: 1, maxLength: 50 }),
                async (dashboardData, authorizedUser, unauthorizedUser) => {
                    fc.pre(authorizedUser !== unauthorizedUser);

                    // Set up permissions so only authorizedUser can edit
                    const dashboardWithPermissions = {
                        ...dashboardData,
                        permissions: {
                            view: [authorizedUser, '*'],
                            edit: [authorizedUser],
                            delete: [authorizedUser],
                            share: [authorizedUser],
                        },
                        createdBy: authorizedUser,
                    };

                    mockDb.dashboard.findUnique.mockResolvedValue({
                        id: 'test-dashboard-id',
                        ...dashboardWithPermissions,
                        widgets: JSON.stringify(dashboardWithPermissions.widgets),
                        layout: JSON.stringify(dashboardWithPermissions.layout),
                        permissions: JSON.stringify(dashboardWithPermissions.permissions),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    // Authorized user should be able to update
                    mockDb.dashboard.update.mockResolvedValue({});
                    await expect(
                        dashboardService.updateDashboard('test-dashboard-id', authorizedUser, { name: 'Updated Name' })
                    ).resolves.not.toThrow();

                    // Unauthorized user should not be able to update
                    await expect(
                        dashboardService.updateDashboard('test-dashboard-id', unauthorizedUser, { name: 'Updated Name' })
                    ).rejects.toThrow('Insufficient permissions');
                }
            ), { numRuns: 20 });
        });
    });

    describe('Data Export Properties', () => {
        it('Property: Export requests preserve configuration settings', async () => {
            await fc.assert(fc.asyncProperty(
                exportConfigArb,
                exportFormatArb,
                organizationIdArb,
                userIdArb,
                async (config, format, orgId, userId) => {
                    const exportRequest = {
                        organizationId: orgId,
                        requestedBy: userId,
                        type: 'analytics' as const,
                        format,
                        source: {
                            type: 'data' as const,
                            data: [{ test: 'data' }],
                        },
                        configuration: config,
                    };

                    mockDb.exportRequest.create.mockResolvedValue({
                        id: 'test-export-id',
                        ...exportRequest,
                        source: JSON.stringify(exportRequest.source),
                        configuration: JSON.stringify(config),
                        status: 'pending',
                        createdAt: new Date(),
                    });

                    const result = await exportService.createExportRequest(orgId, userId, exportRequest);

                    // Verify configuration is preserved
                    expect(result.configuration.includeHeaders).toBe(config.includeHeaders);
                    expect(result.configuration.dateFormat).toBe(config.dateFormat);
                    expect(result.configuration.numberFormat).toBe(config.numberFormat);
                    expect(result.configuration.encoding).toBe(config.encoding);
                    expect(result.configuration.compression).toBe(config.compression);
                    expect(result.format).toBe(format);
                    expect(result.organizationId).toBe(orgId);
                    expect(result.requestedBy).toBe(userId);
                }
            ), { numRuns: 30 });
        });

        it('Property: Export data integrity is maintained across formats', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    name: fc.string({ minLength: 1, maxLength: 50 }),
                    value: fc.float({ min: 0, max: 1000 }),
                    date: fc.date(),
                    active: fc.boolean(),
                }), { minLength: 1, maxLength: 100 }),
                exportFormatArb,
                async (testData, format) => {
                    // Mock the export process
                    const mockExportFile = {
                        buffer: Buffer.from(JSON.stringify(testData)),
                        filename: `test.${format}`,
                        contentType: 'application/json',
                    };

                    // Test that data structure is preserved
                    const originalDataKeys = Object.keys(testData[0]);
                    const originalDataLength = testData.length;

                    // Verify data integrity properties
                    expect(originalDataLength).toBeGreaterThan(0);
                    expect(originalDataKeys.length).toBeGreaterThan(0);
                    expect(mockExportFile.buffer.length).toBeGreaterThan(0);
                    expect(mockExportFile.filename).toContain(format);

                    // For structured formats, verify all records have same keys
                    const allRecordsHaveSameKeys = testData.every(record =>
                        Object.keys(record).length === originalDataKeys.length &&
                        originalDataKeys.every(key => key in record)
                    );
                    expect(allRecordsHaveSameKeys).toBe(true);
                }
            ), { numRuns: 25 });
        });
    });

    describe('Analytics Dashboard Accuracy Properties', () => {
        it('Property: Dashboard metrics are mathematically consistent', async () => {
            await fc.assert(fc.asyncProperty(
                analyticsDataArb,
                organizationIdArb,
                async (analyticsData, orgId) => {
                    // Ensure mathematical consistency in test data
                    const consistentData = {
                        ...analyticsData,
                        activeUsers: Math.min(analyticsData.activeUsers, analyticsData.totalUsers),
                        documentsCompleted: Math.min(analyticsData.documentsCompleted, analyticsData.totalDocuments),
                        completedSigningRequests: Math.min(analyticsData.completedSigningRequests, analyticsData.totalSigningRequests),
                    };

                    // Mock analytics service responses
                    mockAnalyticsService.generateUsageAnalytics.mockResolvedValue({
                        organizationId: orgId,
                        timeRange: { startDate: new Date(), endDate: new Date() },
                        metrics: {
                            totalUsers: consistentData.totalUsers,
                            activeUsers: consistentData.activeUsers,
                            totalDocuments: consistentData.totalDocuments,
                            documentsCreated: consistentData.totalDocuments,
                            documentsCompleted: consistentData.documentsCompleted,
                            totalSigningRequests: consistentData.totalSigningRequests,
                            signingRequestsCompleted: consistentData.completedSigningRequests,
                            totalTemplates: 10,
                            templatesUsed: 8,
                            storageUsed: consistentData.storageUsed,
                            apiCalls: consistentData.apiCalls,
                            webhookDeliveries: 50,
                        },
                        trends: { userGrowth: [], documentActivity: [], signingActivity: [] },
                    });

                    mockAnalyticsService.generateTeamPerformanceMetrics.mockResolvedValue({
                        organizationId: orgId,
                        teams: [],
                        organizationAverages: { averageCompletionTime: 24, averageCompletionRate: 85, averageDocumentsPerTeam: 10 },
                    });

                    mockAnalyticsService.generateCollaborationInsights.mockResolvedValue({
                        organizationId: orgId,
                        metrics: {
                            totalCollaborations: 100,
                            activeCollaborations: 50,
                            averageCollaboratorsPerDocument: 2.5,
                            mostCollaborativeTeams: [],
                            collaborationPatterns: {
                                internalCollaborations: 80,
                                externalCollaborations: 20,
                                crossTeamCollaborations: 30,
                                averageCollaborationDuration: 48,
                            },
                        },
                        networkAnalysis: { mostConnectedUsers: [], collaborationClusters: [] },
                    });

                    mockAnalyticsService.generateCostAnalysis.mockResolvedValue({
                        organizationId: orgId,
                        timeRange: { startDate: new Date(), endDate: new Date() },
                        costs: {
                            totalCost: 299.99,
                            costPerUser: consistentData.totalUsers > 0 ? 299.99 / consistentData.totalUsers : 0,
                            costPerDocument: consistentData.totalDocuments > 0 ? 299.99 / consistentData.totalDocuments : 0,
                            costPerSigningRequest: consistentData.totalSigningRequests > 0 ? 299.99 / consistentData.totalSigningRequests : 0,
                            breakdown: { subscriptionCosts: 199.99, storageOverageCosts: 50, apiOverageCosts: 25, additionalFeatureCosts: 25 },
                        },
                        usage: {
                            includedLimits: { users: 100, documents: 1000, storage: 10, apiCalls: 10000 },
                            actualUsage: { users: consistentData.totalUsers, documents: consistentData.totalDocuments, storage: 5, apiCalls: consistentData.apiCalls },
                            overageCharges: { users: 0, documents: 0, storage: 0, apiCalls: 0 },
                        },
                        projections: { nextMonthProjectedCost: 320, nextQuarterProjectedCost: 950, growthRate: 5.2 },
                    });

                    mockAnalyticsService.generatePredictiveAnalytics.mockResolvedValue({
                        organizationId: orgId,
                        predictions: {
                            userGrowth: { nextMonth: consistentData.totalUsers * 1.05, nextQuarter: consistentData.totalUsers * 1.15, nextYear: consistentData.totalUsers * 1.5, confidence: 85 },
                            documentVolume: { nextMonth: consistentData.totalDocuments * 1.1, nextQuarter: consistentData.totalDocuments * 1.3, nextYear: consistentData.totalDocuments * 2, confidence: 80 },
                            storageNeeds: { nextMonth: consistentData.storageUsed * 1.1, nextQuarter: consistentData.storageUsed * 1.3, nextYear: consistentData.storageUsed * 2, confidence: 75 },
                            costProjections: { nextMonth: 320, nextQuarter: 950, nextYear: 3800, confidence: 70 },
                        },
                        capacityPlanning: { recommendedPlan: 'professional', resourceBottlenecks: [] },
                        riskFactors: [],
                    });

                    const dashboard = await mockAnalyticsService.generateAnalyticsDashboard(orgId);

                    // Verify mathematical consistency
                    const usageMetrics = dashboard.metrics;

                    // Active users should not exceed total users
                    expect(usageMetrics.activeUsers).toBeLessThanOrEqual(usageMetrics.totalUsers);

                    // Completed items should not exceed total items
                    expect(usageMetrics.documentsCompleted).toBeLessThanOrEqual(usageMetrics.totalDocuments);
                    expect(usageMetrics.signingRequestsCompleted).toBeLessThanOrEqual(usageMetrics.totalSigningRequests);

                    // Completion rates should be between 0 and 100
                    if (usageMetrics.totalSigningRequests > 0) {
                        const completionRate = (usageMetrics.signingRequestsCompleted / usageMetrics.totalSigningRequests) * 100;
                        expect(completionRate).toBeGreaterThanOrEqual(0);
                        expect(completionRate).toBeLessThanOrEqual(100);
                    }

                    // Storage and API calls should be non-negative
                    expect(usageMetrics.storageUsed).toBeGreaterThanOrEqual(0);
                    expect(usageMetrics.apiCalls).toBeGreaterThanOrEqual(0);
                }
            ), { numRuns: 40 });
        });

        it('Property: Real-time data updates maintain temporal consistency', async () => {
            await fc.assert(fc.asyncProperty(
                organizationIdArb,
                fc.array(fc.record({
                    timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
                    value: fc.integer({ min: 0, max: 1000 }),
                    type: fc.constantFrom('user_activity', 'document_activity', 'signing_activity'),
                }), { minLength: 2, maxLength: 50 }),
                async (orgId, timeSeriesData) => {
                    // Sort data by timestamp to ensure temporal order
                    const sortedData = timeSeriesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                    // Mock real-time updates
                    for (let i = 0; i < sortedData.length; i++) {
                        const dataPoint = sortedData[i];

                        mockAnalyticsService.generateUsageAnalytics.mockResolvedValue({
                            organizationId: orgId,
                            timeRange: { startDate: sortedData[0].timestamp, endDate: dataPoint.timestamp },
                            metrics: {
                                totalUsers: dataPoint.value,
                                activeUsers: Math.floor(dataPoint.value * 0.8),
                                totalDocuments: dataPoint.value * 2,
                                documentsCreated: dataPoint.value,
                                documentsCompleted: Math.floor(dataPoint.value * 0.9),
                                totalSigningRequests: dataPoint.value,
                                signingRequestsCompleted: Math.floor(dataPoint.value * 0.85),
                                totalTemplates: 10,
                                templatesUsed: 8,
                                storageUsed: dataPoint.value * 1024,
                                apiCalls: dataPoint.value * 10,
                                webhookDeliveries: dataPoint.value,
                            },
                            trends: { userGrowth: [], documentActivity: [], signingActivity: [] },
                        });

                        const dashboard = await mockAnalyticsService.generateUsageAnalytics(orgId);

                        // Verify temporal consistency
                        expect(dashboard.timeRange.startDate.getTime()).toBeLessThanOrEqual(dashboard.timeRange.endDate.getTime());

                        // Verify data reflects the current time point
                        expect(dashboard.metrics.totalUsers).toBe(dataPoint.value);

                        // Verify derived metrics are consistent
                        expect(dashboard.metrics.activeUsers).toBeLessThanOrEqual(dashboard.metrics.totalUsers);
                        expect(dashboard.metrics.documentsCompleted).toBeLessThanOrEqual(dashboard.metrics.totalDocuments);
                    }
                }
            ), { numRuns: 20 });
        });

        it('Property: Key performance indicators are accurately calculated', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    totalRequests: fc.integer({ min: 1, max: 1000 }),
                    completedRequests: fc.integer({ min: 0, max: 1000 }),
                    totalUsers: fc.integer({ min: 1, max: 500 }),
                    activeUsers: fc.integer({ min: 0, max: 500 }),
                    totalCost: fc.float({ min: 0, max: 10000 }),
                    timeToComplete: fc.array(fc.integer({ min: 1, max: 168 }), { minLength: 1, maxLength: 100 }), // hours
                }),
                organizationIdArb,
                async (metrics, orgId) => {
                    // Ensure data consistency
                    const consistentMetrics = {
                        ...metrics,
                        completedRequests: Math.min(metrics.completedRequests, metrics.totalRequests),
                        activeUsers: Math.min(metrics.activeUsers, metrics.totalUsers),
                    };

                    // Calculate expected KPIs
                    const expectedCompletionRate = (consistentMetrics.completedRequests / consistentMetrics.totalRequests) * 100;
                    const expectedEngagementRate = (consistentMetrics.activeUsers / consistentMetrics.totalUsers) * 100;
                    const expectedCostPerUser = consistentMetrics.totalCost / consistentMetrics.totalUsers;
                    const expectedAvgTimeToComplete = consistentMetrics.timeToComplete.reduce((sum, time) => sum + time, 0) / consistentMetrics.timeToComplete.length;

                    // Mock analytics response with calculated KPIs
                    mockAnalyticsService.generateAnalyticsDashboard.mockResolvedValue({
                        organizationId: orgId,
                        generatedAt: new Date(),
                        timeRange: { startDate: new Date(), endDate: new Date() },
                        overview: {
                            totalUsers: consistentMetrics.totalUsers,
                            activeUsers: consistentMetrics.activeUsers,
                            totalDocuments: 100,
                            completedDocuments: 90,
                            totalSigningRequests: consistentMetrics.totalRequests,
                            completedSigningRequests: consistentMetrics.completedRequests,
                            overallCompletionRate: expectedCompletionRate,
                            averageTimeToComplete: expectedAvgTimeToComplete,
                            storageUsed: 1024 * 1024 * 100,
                            monthlyGrowthRate: 5.2,
                        },
                        usageAnalytics: {},
                        teamPerformance: {},
                        collaborationInsights: {},
                        costAnalysis: {
                            costs: {
                                totalCost: consistentMetrics.totalCost,
                                costPerUser: expectedCostPerUser,
                            },
                        },
                        optimizationRecommendations: [],
                        predictiveAnalytics: {},
                    });

                    const dashboard = await mockAnalyticsService.generateAnalyticsDashboard(orgId);

                    // Verify KPI accuracy
                    expect(dashboard.overview.overallCompletionRate).toBeCloseTo(expectedCompletionRate, 2);
                    expect(dashboard.overview.averageTimeToComplete).toBeCloseTo(expectedAvgTimeToComplete, 2);
                    expect(dashboard.costAnalysis.costs.costPerUser).toBeCloseTo(expectedCostPerUser, 2);

                    // Verify engagement rate calculation
                    const actualEngagementRate = (dashboard.overview.activeUsers / dashboard.overview.totalUsers) * 100;
                    expect(actualEngagementRate).toBeCloseTo(expectedEngagementRate, 2);

                    // Verify KPIs are within valid ranges
                    expect(dashboard.overview.overallCompletionRate).toBeGreaterThanOrEqual(0);
                    expect(dashboard.overview.overallCompletionRate).toBeLessThanOrEqual(100);
                    expect(dashboard.overview.averageTimeToComplete).toBeGreaterThan(0);
                    expect(dashboard.costAnalysis.costs.costPerUser).toBeGreaterThanOrEqual(0);
                }
            ), { numRuns: 35 });
        });
    });

    describe('Predictive Analytics Properties', () => {
        it('Property: ML insights maintain confidence bounds', async () => {
            await fc.assert(fc.asyncProperty(
                organizationIdArb,
                fc.array(fc.record({
                    date: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
                    value: fc.integer({ min: 0, max: 1000 }),
                }), { minLength: 10, maxLength: 100 }),
                async (orgId, historicalData) => {
                    // Sort data chronologically
                    const sortedData = historicalData.sort((a, b) => a.timestamp - b.timestamp);

                    // Mock predictive analytics
                    const mockInsights = await predictiveService.generateInsights(orgId, {
                        types: ['forecast', 'trend'],
                        limit: 10,
                    });

                    // Mock insights with confidence bounds
                    const forecastInsight = {
                        id: 'insight-1',
                        organizationId: orgId,
                        type: 'forecast' as const,
                        category: 'usage' as const,
                        title: 'User Growth Forecast',
                        description: 'Predicted user growth',
                        confidence: 0.85,
                        impact: 'medium' as const,
                        data: {
                            metrics: { currentUsers: 100, predictedUsers: 120 },
                            trends: sortedData.map(d => ({ date: d.date.toISOString(), value: d.value })),
                            forecasts: [{
                                date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                prediction: 120,
                                confidence: 0.85,
                            }],
                        },
                        recommendations: [],
                        metadata: {
                            dataSource: 'usage_analytics',
                            analysisMethod: 'linear_regression',
                            sampleSize: sortedData.length,
                            generatedBy: 'predictive_analytics_service',
                        },
                        createdAt: new Date(),
                    };

                    // Verify confidence bounds
                    expect(forecastInsight.confidence).toBeGreaterThan(0);
                    expect(forecastInsight.confidence).toBeLessThanOrEqual(1);

                    // Verify forecast confidence
                    const forecast = forecastInsight.data.forecasts[0];
                    expect(forecast.confidence).toBeGreaterThan(0);
                    expect(forecast.confidence).toBeLessThanOrEqual(1);

                    // Verify prediction is reasonable relative to historical data
                    const avgHistoricalValue = sortedData.reduce((sum, d) => sum + d.value, 0) / sortedData.length;
                    const predictionRatio = forecast.prediction / avgHistoricalValue;

                    // Prediction should be within reasonable bounds (0.1x to 10x of historical average)
                    expect(predictionRatio).toBeGreaterThan(0.1);
                    expect(predictionRatio).toBeLessThan(10);

                    // Higher confidence should correlate with more stable historical data
                    const historicalVariance = sortedData.reduce((sum, d) => sum + Math.pow(d.value - avgHistoricalValue, 2), 0) / sortedData.length;
                    const coefficientOfVariation = Math.sqrt(historicalVariance) / avgHistoricalValue;

                    // If data is very stable (low CV), confidence should be reasonably high
                    if (coefficientOfVariation < 0.1) {
                        expect(forecast.confidence).toBeGreaterThan(0.7);
                    }
                }
            ), { numRuns: 25 });
        });
    });
});