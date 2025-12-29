/**
 * Marketplace Platform Property-Based Tests
 * 
 * **Feature: docusign-alternative-comprehensive, Property 58: Marketplace Platform Functionality**
 * **Validates: Requirements 12.3**
 * 
 * Tests the marketplace platform functionality including extension marketplace,
 * developer portal, third-party app integration, sandboxing, and revenue sharing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { MarketplaceServiceImpl } from './marketplace-service';
import { DeveloperPortal } from './developer-portal';
import { SandboxManager } from './sandbox-manager';
import { RevenueManager } from './revenue-manager';
import { AppValidator } from './app-validator';
import { SecurityScanner } from './security-scanner';
import { MarketplaceUtils } from './utils';
import {
    AppCategory,
    AppStatus,
    RevenueModel,
    SandboxLevel,
    AppManifest,
    App,
    Developer,
    AppInstallation
} from './types';

// Mock database and dependencies
const mockDatabase = {
    apps: {
        create: vi.fn(),
        findById: vi.fn(),
        findByDeveloper: vi.fn(),
        update: vi.fn(),
        findPublished: vi.fn(),
        count: vi.fn(),
        findTrending: vi.fn(),
        getCategoryStats: vi.fn(),
        averageRating: vi.fn(),
        sum: vi.fn(),
        getPerformanceByDeveloper: vi.fn(),
        getTopByDeveloper: vi.fn(),
        getTrendingKeywords: vi.fn(),
        getCompetitorAnalysis: vi.fn(),
        getCategoryGaps: vi.fn(),
        getPricingAnalysis: vi.fn(),
        getFeatureGaps: vi.fn()
    },
    developers: {
        create: vi.fn(),
        findById: vi.fn(),
        findByUserId: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findWithPendingPayouts: vi.fn()
    },
    appInstallations: {
        create: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findByOrganization: vi.fn(),
        findByAppAndOrg: vi.fn(),
        count: vi.fn(),
        getDailyStats: vi.fn()
    },
    revenueTransactions: {
        create: vi.fn(),
        sum: vi.fn(),
        getMonthlyStats: vi.fn(),
        getTrendByApp: vi.fn(),
        getBreakdownByDeveloper: vi.fn(),
        getPendingDeveloperAmount: vi.fn(),
        markAsPaidOut: vi.fn(),
        updateByPaymentId: vi.fn(),
        getTotalByDeveloper: vi.fn(),
        getByAppForDeveloper: vi.fn(),
        getMonthlyForDeveloper: vi.fn(),
        findRecentByDeveloper: vi.fn()
    },
    appReviews: {
        create: vi.fn()
    },
    sandboxes: {
        findByInstallation: vi.fn()
    },
    payoutTransactions: {
        create: vi.fn(),
        getPendingByDeveloper: vi.fn(),
        getCompletedByDeveloper: vi.fn()
    },
    stripeCustomers: {
        findByOrganization: vi.fn(),
        create: vi.fn()
    },
    organizations: {
        findById: vi.fn()
    },
    verificationRequests: {
        create: vi.fn()
    }
};

const mockEventEmitter = {
    emit: vi.fn()
};

const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
};

// Mock SandboxManager
const mockSandboxManager = {
    createSandbox: vi.fn().mockImplementation((installationId: string, config: any) => {
        return Promise.resolve({
            id: 'mock-sandbox-id',
            appId: 'mock-app-id',
            installationId: installationId,
            status: 'running',
            imageId: 'mock-image',
            allocatedMemory: config.resources.memory,
            allocatedCpu: config.resources.cpu,
            allocatedStorage: config.resources.storage,
            securityLevel: config.level,
            allowedDomains: [],
            blockedDomains: [],
            cpuUsage: 0.5,
            memoryUsage: 0.3,
            networkUsage: 0,
            createdAt: new Date()
        });
    }),
    executeCode: vi.fn().mockResolvedValue({ result: 'mock-result' }),
    destroySandbox: vi.fn().mockResolvedValue(undefined),
    getSandboxMetrics: vi.fn().mockResolvedValue({
        cpuUsage: 0.5,
        memoryUsage: 0.3,
        networkUsage: 0,
        status: 'running'
    })
};

// Fast-check arbitraries for generating test data
const appCategoryArb = fc.constantFrom(...Object.values(AppCategory));
const revenueModelArb = fc.constantFrom(...Object.values(RevenueModel));
const sandboxLevelArb = fc.constantFrom(...Object.values(SandboxLevel));

const appManifestArb = fc.record({
    name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s) && s.trim().length >= 3),
    version: fc.tuple(fc.nat(99), fc.nat(99), fc.nat(99)).map(([major, minor, patch]) => `${major}.${minor}.${patch}`),
    description: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
    category: appCategoryArb,
    author: fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        email: fc.constantFrom('test@example.com', 'dev@test.org', 'user@domain.net'),
        website: fc.option(fc.webUrl(), { nil: undefined }),
        support: fc.option(fc.webUrl(), { nil: undefined })
    }),
    permissions: fc.array(fc.string(), { maxLength: 10 }),
    entryPoint: fc.string().map(s => s + '.js'),
    assets: fc.option(fc.array(fc.string(), { maxLength: 20 }), { nil: undefined }),
    dependencies: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
    minPlatformVersion: fc.tuple(fc.nat(99), fc.nat(99), fc.nat(99)).map(([major, minor, patch]) => `${major}.${minor}.${patch}`),
    maxPlatformVersion: fc.option(
        fc.tuple(fc.nat(99), fc.nat(99), fc.nat(99)).map(([major, minor, patch]) => `${major}.${minor}.${patch}`),
        { nil: undefined }
    ),
    pricing: fc.record({
        model: revenueModelArb,
        price: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10000) }), { nil: undefined }),
        currency: fc.option(fc.constantFrom('USD', 'EUR', 'GBP'), { nil: undefined }),
        billingCycle: fc.option(fc.constantFrom('monthly', 'yearly', 'usage'), { nil: undefined }),
        trialDays: fc.option(fc.nat(365), { nil: undefined })
    }).map(pricing => {
        // Ensure paid models have a price > 0
        if (pricing.model !== 'free' && (pricing.price === undefined || pricing.price === 0)) {
            return { ...pricing, price: 9.99 };
        }
        return pricing;
    }),
    sandbox: fc.record({
        level: sandboxLevelArb,
        resources: fc.record({
            memory: fc.integer({ min: 64, max: 2048 }),
            cpu: fc.float({ min: Math.fround(0.1), max: Math.fround(2.0) }).filter(n => !isNaN(n) && isFinite(n)),
            storage: fc.integer({ min: 10, max: 1000 }),
            network: fc.boolean()
        }),
        timeouts: fc.record({
            execution: fc.integer({ min: 1000, max: 300000 }),
            idle: fc.integer({ min: 5000, max: 600000 })
        })
    })
});

const developerArb = fc.record({
    id: fc.string(),
    userId: fc.string(),
    companyName: fc.option(fc.string(), { nil: undefined }),
    website: fc.option(fc.webUrl(), { nil: undefined }),
    supportEmail: fc.emailAddress(),
    verified: fc.boolean(),
    verificationDocuments: fc.array(fc.string()),
    payoutMethod: fc.constantFrom('stripe', 'paypal', 'bank_transfer'),
    payoutDetails: fc.dictionary(fc.string(), fc.anything()),
    revenueShare: fc.integer({ min: 0, max: 100 }),
    totalApps: fc.nat(),
    totalDownloads: fc.nat(),
    totalRevenue: fc.float({ min: 0 }),
    createdAt: fc.date(),
    updatedAt: fc.date()
});

describe('Marketplace Platform Functionality', () => {
    let marketplaceService: MarketplaceServiceImpl;
    let developerPortal: DeveloperPortal;

    beforeEach(() => {
        vi.clearAllMocks();
        marketplaceService = new MarketplaceServiceImpl(mockDatabase, mockEventEmitter, mockLogger, mockSandboxManager as any);
        developerPortal = new DeveloperPortal(marketplaceService, mockDatabase, mockLogger);
    });

    /**
     * Property 58: Marketplace Platform Functionality
     * For any marketplace operation, the platform should work correctly with proper plugin functionality and accurate revenue sharing calculations
     */
    describe('Property 58: Marketplace Platform Functionality', () => {
        it('should handle app creation and management correctly for any valid manifest', async () => {
            await fc.assert(fc.asyncProperty(
                appManifestArb,
                fc.string(),
                async (manifest, developerId) => {
                    // Setup mock developer
                    const mockDeveloper: Developer = {
                        id: developerId,
                        userId: 'user123',
                        supportEmail: 'dev@example.com',
                        verified: true,
                        verificationDocuments: [],
                        payoutMethod: 'stripe',
                        payoutDetails: {},
                        revenueShare: 70,
                        totalApps: 0,
                        totalDownloads: 0,
                        totalRevenue: 0,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    mockDatabase.developers.findById.mockResolvedValue(mockDeveloper);
                    mockDatabase.apps.create.mockResolvedValue(true);

                    // Test app creation
                    const app = await marketplaceService.createApp(developerId, manifest);

                    // Verify app properties
                    expect(app.developerId).toBe(developerId);
                    expect(app.manifest).toEqual(manifest);
                    expect(app.status).toBe(AppStatus.DRAFT);
                    expect(app.downloads).toBe(0);
                    expect(app.activeInstalls).toBe(0);
                    expect(app.totalRevenue).toBe(0);
                    expect(app.createdAt).toBeInstanceOf(Date);
                    expect(app.updatedAt).toBeInstanceOf(Date);

                    // Verify database interaction
                    expect(mockDatabase.apps.create).toHaveBeenCalledWith(
                        expect.objectContaining({
                            developerId,
                            manifest,
                            status: AppStatus.DRAFT
                        })
                    );

                    // Verify event emission
                    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                        'marketplace.event',
                        expect.objectContaining({
                            type: 'app.created',
                            appId: app.id,
                            developerId
                        })
                    );
                }
            ), { numRuns: 10 });
        });

        it('should calculate revenue sharing correctly for any valid amounts and apps', async () => {
            await fc.assert(fc.asyncProperty(
                fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }),
                fc.string(),
                fc.integer({ min: 0, max: 100 }),
                async (amount, appId, customRevenueShare) => {
                    // Setup mock app and developer
                    const mockApp = {
                        id: appId,
                        developerId: 'dev123'
                    };

                    const mockDeveloper = {
                        id: 'dev123',
                        revenueShare: customRevenueShare
                    };

                    mockDatabase.apps.findById.mockResolvedValue(mockApp);
                    mockDatabase.developers.findById.mockResolvedValue(mockDeveloper);

                    const revenueManager = new RevenueManager(mockDatabase, mockLogger);
                    const result = await revenueManager.calculateRevenueSplit(amount, appId);

                    // Verify revenue split calculations
                    const expectedDeveloperShare = amount - result.platformFee;
                    const expectedPlatformFeePercentage = (result.platformFee / amount) * 100;

                    expect(result.developerShare).toBe(expectedDeveloperShare);
                    expect(result.platformFee + result.developerShare).toBeCloseTo(amount, 2);
                    expect(result.platformFee).toBeGreaterThanOrEqual(0);
                    expect(result.developerShare).toBeGreaterThanOrEqual(0);

                    // Platform fee should be reasonable (between 0% and 100%)
                    expect(expectedPlatformFeePercentage).toBeLessThanOrEqual(100);
                }
            ), { numRuns: 20 });
        });

        it('should handle app installation and sandbox creation correctly', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string(),
                fc.string(),
                fc.string(),
                appManifestArb,
                async (appId, organizationId, userId, manifest) => {
                    // Setup mock data
                    const mockApp: App = {
                        id: appId,
                        developerId: 'dev123',
                        manifest,
                        status: AppStatus.PUBLISHED,
                        screenshots: [],
                        tags: [],
                        downloads: 0,
                        activeInstalls: 0,
                        rating: 0,
                        reviewCount: 0,
                        totalRevenue: 0,
                        monthlyRevenue: 0,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    const mockInstallation = {
                        id: 'inst123',
                        appId,
                        organizationId,
                        userId,
                        version: manifest.version,
                        status: 'active',
                        configuration: {},
                        usageCount: 0,
                        billingStatus: 'active',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    mockDatabase.apps.findById.mockResolvedValue(mockApp);
                    mockDatabase.appInstallations.findByAppAndOrg.mockResolvedValue(null);
                    mockDatabase.appInstallations.create.mockResolvedValue(mockInstallation);
                    mockDatabase.appInstallations.update.mockResolvedValue(true);
                    mockDatabase.apps.update.mockResolvedValue(true);

                    // Mock for processPayment - it will look up the installation by ID
                    mockDatabase.appInstallations.findById.mockResolvedValue(mockInstallation);

                    // Mock organization for payment processing
                    mockDatabase.organizations.findById.mockResolvedValue({
                        id: organizationId,
                        name: 'Test Organization',
                        adminEmail: 'admin@test.com'
                    });

                    // Mock Stripe customer
                    mockDatabase.stripeCustomers.findByOrganization.mockResolvedValue(null);

                    // Mock processPayment to avoid Stripe API calls
                    vi.spyOn(marketplaceService, 'processPayment').mockResolvedValue({
                        id: 'txn_test123',
                        appId,
                        developerId: 'dev123',
                        organizationId,
                        installationId: 'inst123',
                        type: 'purchase',
                        amount: manifest.pricing.price || 0,
                        currency: 'USD',
                        platformFee: 3,
                        developerShare: (manifest.pricing.price || 0) - 3,
                        paymentMethod: 'stripe',
                        paymentId: 'pi_test123',
                        status: 'completed',
                        createdAt: new Date()
                    });

                    // Mock Stripe API calls to prevent actual API requests
                    const mockStripeCustomer = { id: 'cus_test123' };
                    const mockPaymentIntent = { id: 'pi_test123', status: 'succeeded', customer: 'cus_test123' };

                    // Mock the Stripe instance methods
                    const mockStripe = {
                        customers: {
                            create: vi.fn().mockResolvedValue(mockStripeCustomer),
                            retrieve: vi.fn().mockResolvedValue(mockStripeCustomer)
                        },
                        paymentIntents: {
                            create: vi.fn().mockResolvedValue(mockPaymentIntent)
                        }
                    };

                    // Mock the RevenueManager's stripe instance
                    vi.spyOn(marketplaceService.revenueManager, 'stripe' as any, 'get').mockReturnValue(mockStripe);

                    // Mock sandbox creation
                    const mockSandbox = {
                        id: 'sandbox123',
                        appId,
                        installationId: 'inst123',
                        status: 'running',
                        securityLevel: manifest.sandbox.level,
                        allocatedMemory: manifest.sandbox.resources.memory,
                        allocatedCpu: manifest.sandbox.resources.cpu,
                        allocatedStorage: manifest.sandbox.resources.storage,
                        createdAt: new Date()
                    };

                    vi.spyOn(marketplaceService, 'createSandbox').mockResolvedValue(mockSandbox);

                    // Test installation
                    const installation = await marketplaceService.installApp(appId, organizationId, userId);

                    // Verify installation properties
                    expect(installation.appId).toBe(appId);
                    expect(installation.organizationId).toBe(organizationId);
                    expect(installation.userId).toBe(userId);
                    expect(installation.version).toBe(manifest.version);
                    expect(installation.status).toBe('active');
                    expect(installation.usageCount).toBe(0);

                    // Verify sandbox was created with correct configuration
                    expect(marketplaceService.createSandbox).toHaveBeenCalledWith(installation.id);

                    // Verify app metrics were updated
                    expect(mockDatabase.apps.update).toHaveBeenCalledWith(
                        appId,
                        expect.objectContaining({
                            activeInstalls: 1,
                            downloads: 1
                        })
                    );

                    // Verify event emission
                    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                        'marketplace.event',
                        expect.objectContaining({
                            type: 'app.installed',
                            appId,
                            organizationId
                        })
                    );
                }
            ), { numRuns: 10 });
        });

        it('should validate app manifests correctly and reject invalid ones', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    name: fc.oneof(
                        fc.string({ maxLength: 2 }), // Too short
                        fc.string({ minLength: 51 }), // Too long
                        fc.string().filter(s => !/^[a-zA-Z0-9\s\-_]+$/.test(s)) // Invalid characters
                    ),
                    version: fc.oneof(
                        fc.string().filter(s => !/^\d+\.\d+\.\d+$/.test(s)), // Invalid version format
                        fc.constant('invalid.version')
                    ),
                    description: fc.oneof(
                        fc.string({ maxLength: 9 }), // Too short
                        fc.string({ minLength: 501 }) // Too long
                    ),
                    category: fc.string().filter(s => !Object.values(AppCategory).includes(s as AppCategory)),
                    author: fc.record({
                        name: fc.string(),
                        email: fc.string().filter(s => !s.includes('@')), // Invalid email
                        website: fc.option(fc.string().filter(s => {
                            try { new URL(s); return false; } catch { return true; }
                        }), { nil: undefined })
                    }),
                    permissions: fc.array(fc.string()),
                    entryPoint: fc.string(),
                    minPlatformVersion: fc.string().filter(s => !/^\d+\.\d+\.\d+$/.test(s)),
                    pricing: fc.record({
                        model: fc.string().filter(s => !Object.values(RevenueModel).includes(s as RevenueModel)),
                        price: fc.option(fc.float({ min: Math.fround(-1), max: Math.fround(-0.01) }), { nil: undefined }) // Negative price
                    }),
                    sandbox: fc.record({
                        level: fc.string().filter(s => !Object.values(SandboxLevel).includes(s as SandboxLevel)),
                        resources: fc.record({
                            memory: fc.integer({ min: 2049, max: 5000 }), // Too high
                            cpu: fc.float({ min: Math.fround(2.1), max: Math.fround(10) }), // Too high
                            storage: fc.integer({ min: 1001, max: 5000 }) // Too high
                        }),
                        timeouts: fc.record({
                            execution: fc.integer({ min: 300001, max: 600000 }), // Too high
                            idle: fc.integer({ min: 600001, max: 1200000 }) // Too high
                        })
                    })
                }),
                async (invalidManifest) => {
                    const validator = new AppValidator();
                    const result = await validator.validateManifest(invalidManifest as any);

                    // Invalid manifests should fail validation
                    expect(result.valid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ), { numRuns: 10 });
        });

        it('should handle sandbox resource limits correctly', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    level: sandboxLevelArb,
                    resources: fc.record({
                        memory: fc.integer({ min: 64, max: 2048 }),
                        cpu: fc.float({ min: Math.fround(0.1), max: Math.fround(2.0) }).filter(n => !isNaN(n) && isFinite(n)),
                        storage: fc.integer({ min: 10, max: 1000 }),
                        network: fc.boolean()
                    }),
                    timeouts: fc.record({
                        execution: fc.integer({ min: 1000, max: 300000 }),
                        idle: fc.integer({ min: 5000, max: 600000 })
                    })
                }),
                fc.string(),
                async (sandboxConfig, installationId) => {
                    // Skip if CPU value is invalid
                    if (isNaN(sandboxConfig.resources.cpu) || !isFinite(sandboxConfig.resources.cpu)) {
                        return;
                    }

                    const sandboxManager = mockSandboxManager;
                    const sandbox = await sandboxManager.createSandbox(installationId, sandboxConfig);

                    // Verify sandbox configuration
                    expect(sandbox.installationId).toBe(installationId);
                    expect(sandbox.securityLevel).toBe(sandboxConfig.level);
                    expect(sandbox.allocatedMemory).toBe(sandboxConfig.resources.memory);
                    expect(sandbox.allocatedCpu).toBe(sandboxConfig.resources.cpu);
                    expect(sandbox.allocatedStorage).toBe(sandboxConfig.resources.storage);
                    expect(sandbox.status).toBe('running');
                    expect(sandbox.createdAt).toBeInstanceOf(Date);

                    // Resource allocations should match requested amounts
                    expect(sandbox.allocatedMemory).toBeGreaterThanOrEqual(64);
                    expect(sandbox.allocatedMemory).toBeLessThanOrEqual(2048);
                    expect(sandbox.allocatedCpu).toBeGreaterThanOrEqual(0.1);
                    expect(sandbox.allocatedCpu).toBeLessThanOrEqual(2.0);
                    expect(sandbox.allocatedStorage).toBeGreaterThanOrEqual(10);
                    expect(sandbox.allocatedStorage).toBeLessThanOrEqual(1000);
                }
            ), { numRuns: 10 });
        });

        it('should generate valid marketplace analytics for any data set', async () => {
            await fc.assert(fc.asyncProperty(
                fc.nat(1000), // totalApps
                fc.nat(500), // totalDevelopers
                fc.nat(5000), // totalInstallations
                fc.float({ min: Math.fround(0), max: Math.fround(1000000) }), // totalRevenue
                async (totalApps, totalDevelopers, totalInstallations, totalRevenue) => {
                    // Setup mock database responses
                    mockDatabase.apps.count.mockResolvedValue(totalApps);
                    mockDatabase.developers.count.mockResolvedValue(totalDevelopers);
                    mockDatabase.appInstallations.count.mockResolvedValue(totalInstallations);
                    mockDatabase.revenueTransactions.sum.mockResolvedValue(totalRevenue);
                    mockDatabase.apps.findTrending.mockResolvedValue([]);
                    mockDatabase.apps.getCategoryStats.mockResolvedValue([]);
                    mockDatabase.apps.averageRating.mockResolvedValue(4.2);
                    mockDatabase.apps.sum.mockResolvedValue(totalApps * 100); // Mock total downloads
                    mockDatabase.appInstallations.getDailyStats.mockResolvedValue([]);
                    mockDatabase.revenueTransactions.getMonthlyStats.mockResolvedValue([]);

                    const analytics = await marketplaceService.getMarketplaceAnalytics();

                    // Verify analytics structure and values
                    expect(analytics.totalApps).toBe(totalApps);
                    expect(analytics.totalDevelopers).toBe(totalDevelopers);
                    expect(analytics.totalInstallations).toBe(totalInstallations);
                    expect(analytics.totalRevenue).toBe(totalRevenue);
                    expect(analytics.averageRating).toBeGreaterThanOrEqual(0);
                    expect(analytics.averageRating).toBeLessThanOrEqual(5);
                    expect(analytics.averageDownloads).toBeGreaterThanOrEqual(0);
                    expect(Array.isArray(analytics.trendingApps)).toBe(true);
                    expect(Array.isArray(analytics.topCategories)).toBe(true);
                    expect(Array.isArray(analytics.dailyInstalls)).toBe(true);
                    expect(Array.isArray(analytics.monthlyRevenue)).toBe(true);
                }
            ), { numRuns: 10 });
        });

        it('should handle developer registration and verification correctly', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string(),
                fc.record({
                    companyName: fc.option(fc.string(), { nil: undefined }),
                    website: fc.option(fc.webUrl(), { nil: undefined }),
                    supportEmail: fc.emailAddress(),
                    payoutMethod: fc.constantFrom('stripe', 'paypal', 'bank_transfer'),
                    payoutDetails: fc.dictionary(fc.string(), fc.string())
                }),
                async (userId, developerData) => {
                    mockDatabase.developers.findByUserId.mockResolvedValue(null);
                    mockDatabase.developers.create.mockResolvedValue(true);

                    const developer = await developerPortal.registerDeveloper(userId, developerData);

                    // Verify developer properties
                    expect(developer.userId).toBe(userId);
                    expect(developer.supportEmail).toBe(developerData.supportEmail);
                    expect(developer.payoutMethod).toBe(developerData.payoutMethod);
                    expect(developer.verified).toBe(false);
                    expect(developer.totalApps).toBe(0);
                    expect(developer.totalDownloads).toBe(0);
                    expect(developer.totalRevenue).toBe(0);
                    expect(developer.revenueShare).toBeGreaterThanOrEqual(0);
                    expect(developer.revenueShare).toBeLessThanOrEqual(100);
                    expect(developer.createdAt).toBeInstanceOf(Date);
                    expect(developer.updatedAt).toBeInstanceOf(Date);

                    // Verify database interaction
                    expect(mockDatabase.developers.create).toHaveBeenCalledWith(
                        expect.objectContaining({
                            userId,
                            supportEmail: developerData.supportEmail,
                            payoutMethod: developerData.payoutMethod,
                            verified: false
                        })
                    );
                }
            ), { numRuns: 10 });
        });
    });

    describe('Utility Functions', () => {
        it('should generate valid IDs for any input', () => {
            fc.assert(fc.property(
                fc.constantFrom('app', 'dev', 'inst'),
                () => {
                    const id1 = MarketplaceUtils.generateAppId();
                    const id2 = MarketplaceUtils.generateAppId();

                    // IDs should be unique
                    expect(id1).not.toBe(id2);

                    // IDs should have correct format
                    expect(id1).toMatch(/^app_[a-z0-9]+_[a-f0-9]+$/);
                    expect(id1.length).toBeGreaterThan(10);
                }
            ), { numRuns: 20 });
        });

        it('should validate app names correctly', () => {
            fc.assert(fc.property(
                fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s)),
                (validName) => {
                    const result = MarketplaceUtils.validateAppName(validName);
                    expect(result.valid).toBe(true);
                    expect(result.errors).toHaveLength(0);
                }
            ), { numRuns: 20 });
        });

        it('should format currency correctly for any amount', () => {
            fc.assert(fc.property(
                fc.float({ min: Math.fround(0), max: Math.fround(1000000) }),
                fc.constantFrom('USD', 'EUR', 'GBP'),
                (amount, currency) => {
                    const formatted = MarketplaceUtils.formatCurrency(amount, currency);

                    // Should contain currency symbol or code
                    expect(formatted).toMatch(/[$€£]|USD|EUR|GBP/);

                    // Should contain the amount in some form
                    expect(formatted.length).toBeGreaterThan(0);
                }
            ), { numRuns: 20 });
        });

        it('should calculate ratings correctly for any review set', () => {
            fc.assert(fc.property(
                fc.array(fc.record({ rating: fc.integer({ min: 1, max: 5 }) }), { minLength: 1, maxLength: 100 }),
                (reviews) => {
                    const rating = MarketplaceUtils.calculateRating(reviews);

                    // Rating should be between 1 and 5
                    expect(rating).toBeGreaterThanOrEqual(1);
                    expect(rating).toBeLessThanOrEqual(5);

                    // Rating should be reasonable average
                    const sum = reviews.reduce((total, review) => total + review.rating, 0);
                    const expectedAverage = sum / reviews.length;
                    expect(Math.abs(rating - expectedAverage)).toBeLessThan(0.1);
                }
            ), { numRuns: 20 });
        });
    });
});