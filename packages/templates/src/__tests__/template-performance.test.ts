import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplatePerformanceService } from '../template-performance-service';
import { InMemoryCacheService } from '@signtusk/cache';

// Mock PrismaClient
const mockDb = {
    template: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
    },
    signingRequest: {
        count: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
    },
    organization: {
        findMany: vi.fn(),
    },
} as any;

describe('TemplatePerformanceService', () => {
    let performanceService: TemplatePerformanceService;
    let cacheService: InMemoryCacheService;

    beforeEach(() => {
        cacheService = new InMemoryCacheService();
        performanceService = new TemplatePerformanceService(mockDb, cacheService);
        vi.clearAllMocks();
    });

    describe('getTemplateOptimized', () => {
        it('should return cached template when available', async () => {
            const templateId = 'test-template-id';
            const organizationId = 'test-org-id';
            const mockTemplate = {
                id: templateId,
                name: 'Test Template',
                organizationId,
            };

            // Pre-cache the template
            const cacheKey = performanceService.buildCacheKey(templateId, {
                includeFields: false,
                includeRecipients: false,
                includeAnalytics: false,
            });
            await cacheService.set(cacheKey, mockTemplate);

            const result = await performanceService.getTemplateOptimized(templateId, organizationId, {
                includeFields: false,
                includeRecipients: false,
                includeAnalytics: false,
            });

            expect(result).toEqual(mockTemplate);
            expect(mockDb.template.findFirst).not.toHaveBeenCalled();
        });

        it('should load from database when not cached', async () => {
            const templateId = 'test-template-id';
            const organizationId = 'test-org-id';
            const mockTemplate = {
                id: templateId,
                name: 'Test Template',
                organizationId,
            };

            mockDb.template.findFirst.mockResolvedValue(mockTemplate);

            const result = await performanceService.getTemplateOptimized(templateId, organizationId);

            expect(result).toEqual(mockTemplate);
            expect(mockDb.template.findFirst).toHaveBeenCalledWith({
                where: {
                    id: templateId,
                    OR: [
                        { organizationId },
                        { isPublic: true },
                    ],
                },
                include: {
                    templateFields: undefined,
                    templateRecipients: undefined,
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    _count: undefined,
                },
            });
        });

        it('should return null when template not found', async () => {
            const templateId = 'non-existent-template';
            const organizationId = 'test-org-id';

            mockDb.template.findFirst.mockResolvedValue(null);

            const result = await performanceService.getTemplateOptimized(templateId, organizationId);

            expect(result).toBeNull();
        });
    });

    describe('preloadFrequentTemplates', () => {
        it('should preload frequently used templates', async () => {
            const organizationId = 'test-org-id';
            const mockTemplates = [
                { id: 'template-1', _count: { signingRequests: 15 } },
                { id: 'template-2', _count: { signingRequests: 12 } },
            ];

            mockDb.template.findMany.mockResolvedValue(mockTemplates);
            mockDb.template.findFirst
                .mockResolvedValueOnce({ id: 'template-1', name: 'Template 1' })
                .mockResolvedValueOnce({ id: 'template-2', name: 'Template 2' });

            await performanceService.preloadFrequentTemplates(organizationId);

            expect(mockDb.template.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId,
                    signingRequests: {
                        some: {
                            createdAt: {
                                gte: expect.any(Date),
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
                take: 1000,
            });
        });
    });

    describe('analyzeUsagePatterns', () => {
        it('should analyze template usage patterns', async () => {
            const templateId = 'test-template-id';
            const mockUsageData = [
                { createdAt: new Date('2024-12-01T10:00:00Z') },
                { createdAt: new Date('2024-12-01T14:00:00Z') },
                { createdAt: new Date('2024-12-02T09:00:00Z') },
            ];

            mockDb.signingRequest.findMany.mockResolvedValue(mockUsageData);

            const result = await performanceService.analyzeUsagePatterns(templateId);

            expect(result).toMatchObject({
                templateId,
                hourlyUsage: expect.any(Array),
                dailyUsage: expect.any(Array),
                monthlyUsage: expect.any(Array),
                peakUsageHours: expect.any(Array),
                averageUsagePerDay: expect.any(Number),
                usageTrend: expect.stringMatching(/^(increasing|decreasing|stable)$/),
                seasonality: {
                    detected: false,
                    confidence: 0,
                },
            });

            expect(result.hourlyUsage).toHaveLength(24);
            expect(result.dailyUsage).toHaveLength(7);
            expect(result.monthlyUsage).toHaveLength(12);
        });
    });

    describe('getPerformanceMetrics', () => {
        it('should return performance metrics for a template', async () => {
            const templateId = 'test-template-id';

            mockDb.signingRequest.count.mockResolvedValue(5);

            const result = await performanceService.getPerformanceMetrics(templateId);

            expect(result).toMatchObject({
                templateId,
                loadTime: expect.any(Number),
                renderTime: expect.any(Number),
                cacheHitRate: expect.any(Number),
                usageFrequency: 5,
                lastOptimized: null,
                optimizationScore: expect.any(Number),
                recommendations: expect.any(Array),
            });

            expect(result.optimizationScore).toBeGreaterThanOrEqual(0);
            expect(result.optimizationScore).toBeLessThanOrEqual(100);
        });
    });

    describe('optimizeTemplate', () => {
        it('should optimize template and return improvements', async () => {
            const templateId = 'test-template-id';

            mockDb.signingRequest.count.mockResolvedValue(15); // High usage

            const result = await performanceService.optimizeTemplate(templateId);

            expect(result).toMatchObject({
                success: true,
                optimizations: expect.any(Array),
                improvementEstimate: expect.any(Number),
            });

            expect(result.improvementEstimate).toBeGreaterThanOrEqual(0);
        });
    });
});

/**
 * **Feature: docusign-alternative-comprehensive, Property 29: Template Analytics Accuracy**
 * 
 * Property test to verify template performance optimization functionality
 */
describe('Template Performance Optimization Property Tests', () => {
    it('should maintain cache consistency across operations', async () => {
        const cacheService = new InMemoryCacheService();
        const performanceService = new TemplatePerformanceService(mockDb, cacheService);

        const templateId = 'test-template';
        const organizationId = 'test-org';
        const mockTemplate = { id: templateId, name: 'Test Template' };

        mockDb.template.findFirst.mockResolvedValue(mockTemplate);

        // First call should load from database
        const result1 = await performanceService.getTemplateOptimized(templateId, organizationId);
        expect(mockDb.template.findFirst).toHaveBeenCalledTimes(1);

        // Second call should use cache
        const result2 = await performanceService.getTemplateOptimized(templateId, organizationId);
        expect(mockDb.template.findFirst).toHaveBeenCalledTimes(1); // Still only called once

        expect(result1).toEqual(result2);
    });

    it('should generate valid performance recommendations', async () => {
        const cacheService = new InMemoryCacheService();
        const performanceService = new TemplatePerformanceService(mockDb, cacheService);

        mockDb.signingRequest.count.mockResolvedValue(20); // High usage

        const templateId = 'test-template';
        const metrics = await performanceService.getPerformanceMetrics(templateId);

        // All recommendations should have required properties
        for (const recommendation of metrics.recommendations) {
            expect(recommendation).toMatchObject({
                type: expect.stringMatching(/^(caching|preloading|compression|field_optimization|rendering)$/),
                priority: expect.stringMatching(/^(low|medium|high)$/),
                description: expect.any(String),
                expectedImprovement: expect.any(Number),
                implementationCost: expect.stringMatching(/^(low|medium|high)$/),
                autoApplicable: expect.any(Boolean),
            });

            expect(recommendation.expectedImprovement).toBeGreaterThanOrEqual(0);
            expect(recommendation.expectedImprovement).toBeLessThanOrEqual(100);
        }
    });
});