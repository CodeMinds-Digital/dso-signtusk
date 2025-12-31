/**
 * Marketplace Service Implementation
 * 
 * Core service for managing the extension marketplace platform with developer portal,
 * third-party app integration, sandboxing, and revenue sharing system.
 */

import {
    App,
    AppInstallation,
    AppManifest,
    AppStatus,
    Developer,
    MarketplaceAnalytics,
    MarketplaceService,
    RevenueTransaction,
    SandboxEnvironment,
    SandboxLevel,
    MarketplaceEvent
} from './types';
import { SandboxManager } from './sandbox-manager';
import { RevenueManager, MarketplaceDatabase, Logger } from './revenue-manager';
import { AppValidator } from './app-validator';
import { SecurityScanner } from './security-scanner';

export class MarketplaceServiceImpl implements MarketplaceService {
    public sandboxManager: SandboxManager;
    public revenueManager: RevenueManager;
    private appValidator: AppValidator;
    private securityScanner: SecurityScanner;

    constructor(
        public database: MarketplaceDatabase, // Database connection - made public for API access
        private eventEmitter: any, // Event system
        private logger: Logger, // Logger
        sandboxManager?: SandboxManager // Optional sandbox manager for testing
    ) {
        this.sandboxManager = sandboxManager || new SandboxManager();
        this.revenueManager = new RevenueManager(database, logger);
        this.appValidator = new AppValidator();
        this.securityScanner = new SecurityScanner();
    }

    /**
     * Create a new app in the marketplace
     */
    async createApp(developerId: string, manifest: AppManifest): Promise<App> {
        this.logger.info('Creating new app', { developerId, appName: manifest.name });

        // Validate manifest
        const validationResult = await this.appValidator.validateManifest(manifest);
        if (!validationResult.valid) {
            throw new Error(`Invalid manifest: ${validationResult.errors.join(', ')}`);
        }

        // Check developer permissions
        const developer = await this.getDeveloper(developerId);
        if (!developer.verified) {
            throw new Error('Developer must be verified to create apps');
        }

        // Create app record
        const app: App = {
            id: this.generateId('app'),
            developerId,
            organizationId: developer.userId, // Link to developer's org
            manifest,
            status: AppStatus.DRAFT,
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

        // Save to database
        await this.database.apps.create(app);

        // Emit event
        await this.emitEvent({
            type: 'app.created',
            appId: app.id,
            developerId,
            data: { manifest },
            timestamp: new Date()
        });

        this.logger.info('App created successfully', { appId: app.id });
        return app;
    }

    /**
     * Update an existing app
     */
    async updateApp(appId: string, updates: Partial<AppManifest>): Promise<App> {
        this.logger.info('Updating app', { appId });

        const app = await this.getApp(appId);
        if (!app) {
            throw new Error('App not found');
        }

        // Validate updates
        const updatedManifest = { ...app.manifest, ...updates };
        const validationResult = await this.appValidator.validateManifest(updatedManifest);
        if (!validationResult.valid) {
            throw new Error(`Invalid manifest updates: ${validationResult.errors.join(', ')}`);
        }

        // Update app
        const updatedApp = {
            ...app,
            manifest: updatedManifest,
            updatedAt: new Date()
        };

        await this.database.apps.update(appId, updatedApp);

        this.logger.info('App updated successfully', { appId });
        return updatedApp;
    }

    /**
     * Submit app for review
     */
    async submitForReview(appId: string): Promise<void> {
        this.logger.info('Submitting app for review', { appId });

        const app = await this.getApp(appId);
        if (!app) {
            throw new Error('App not found');
        }

        if (app.status !== AppStatus.DRAFT) {
            throw new Error('Only draft apps can be submitted for review');
        }

        // Run security scan
        const securityResult = await this.securityScanner.scanApp(app);
        if (!securityResult.passed) {
            throw new Error(`Security scan failed: ${securityResult.issues.join(', ')}`);
        }

        // Update status
        await this.database.apps.update(appId, {
            status: AppStatus.SUBMITTED,
            updatedAt: new Date()
        });

        // Create review record
        await this.database.appReviews.create({
            id: this.generateId('review'),
            appId,
            reviewerId: null, // Will be assigned by review system
            version: app.manifest.version,
            status: 'pending',
            securityCheck: securityResult.passed,
            performanceCheck: false, // Will be checked during review
            functionalityCheck: false,
            complianceCheck: false,
            createdAt: new Date()
        });

        this.logger.info('App submitted for review', { appId });
    }

    /**
     * Publish an approved app
     */
    async publishApp(appId: string): Promise<void> {
        this.logger.info('Publishing app', { appId });

        const app = await this.getApp(appId);
        if (!app) {
            throw new Error('App not found');
        }

        if (app.status !== AppStatus.APPROVED) {
            throw new Error('Only approved apps can be published');
        }

        // Update status
        await this.database.apps.update(appId, {
            status: AppStatus.PUBLISHED,
            publishedAt: new Date(),
            updatedAt: new Date()
        });

        // Emit event
        await this.emitEvent({
            type: 'app.published',
            appId,
            developerId: app.developerId,
            data: { version: app.manifest.version },
            timestamp: new Date()
        });

        this.logger.info('App published successfully', { appId });
    }

    /**
     * Install an app for an organization
     */
    async installApp(appId: string, organizationId: string, userId: string): Promise<AppInstallation> {
        this.logger.info('Installing app', { appId, organizationId, userId });

        const app = await this.getApp(appId);
        if (!app) {
            throw new Error('App not found');
        }

        if (app.status !== AppStatus.PUBLISHED) {
            throw new Error('Only published apps can be installed');
        }

        // Check if already installed
        const existingInstallation = await this.database.appInstallations.findByAppAndOrg(appId, organizationId);
        if (existingInstallation) {
            throw new Error('App is already installed for this organization');
        }

        // Create installation record
        const installation: AppInstallation = {
            id: this.generateId('installation'),
            appId,
            organizationId,
            userId,
            version: app.manifest.version,
            status: 'installing',
            configuration: {},
            usageCount: 0,
            billingStatus: 'trial', // Start with trial if available
            trialEndsAt: app.manifest.pricing.trialDays ?
                new Date(Date.now() + app.manifest.pricing.trialDays * 24 * 60 * 60 * 1000) :
                undefined,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save installation
        await this.database.appInstallations.create(installation);

        // Create sandbox environment
        const sandbox = await this.createSandbox(installation.id);

        // Update installation status
        await this.database.appInstallations.update(installation.id, {
            status: 'active',
            updatedAt: new Date()
        });

        // Update the installation object to reflect the new status
        installation.status = 'active';
        installation.updatedAt = new Date();

        // Update app metrics
        await this.database.apps.update(appId, {
            activeInstalls: app.activeInstalls + 1,
            downloads: app.downloads + 1,
            updatedAt: new Date()
        });

        // Process payment if not free
        if (app.manifest.pricing.model !== 'free' && !installation.trialEndsAt) {
            await this.processPayment(installation.id, app.manifest.pricing.price || 0);
        }

        // Emit event
        await this.emitEvent({
            type: 'app.installed',
            appId,
            organizationId,
            developerId: app.developerId,
            data: { installationId: installation.id, version: app.manifest.version },
            timestamp: new Date()
        });

        this.logger.info('App installed successfully', { installationId: installation.id });
        return installation;
    }

    /**
     * Uninstall an app
     */
    async uninstallApp(installationId: string): Promise<void> {
        this.logger.info('Uninstalling app', { installationId });

        const installation = await this.getInstallation(installationId);
        if (!installation) {
            throw new Error('Installation not found');
        }

        // Update status
        await this.database.appInstallations.update(installationId, {
            status: 'uninstalling',
            updatedAt: new Date()
        });

        // Destroy sandbox
        const sandbox = await this.database.sandboxes.findByInstallation(installationId);
        if (sandbox) {
            await this.destroySandbox(sandbox.id);
        }

        // Cancel subscription if active
        if (installation.subscriptionId) {
            await this.revenueManager.cancelSubscription(installation.subscriptionId);
        }

        // Remove installation
        await this.database.appInstallations.delete(installationId);

        // Update app metrics
        const app = await this.getApp(installation.appId);
        if (app) {
            await this.database.apps.update(installation.appId, {
                activeInstalls: Math.max(0, app.activeInstalls - 1),
                updatedAt: new Date()
            });
        }

        // Emit event
        await this.emitEvent({
            type: 'app.uninstalled',
            appId: installation.appId,
            organizationId: installation.organizationId,
            data: { installationId },
            timestamp: new Date()
        });

        this.logger.info('App uninstalled successfully', { installationId });
    }

    /**
     * Configure an installed app
     */
    async configureApp(installationId: string, config: Record<string, any>): Promise<void> {
        this.logger.info('Configuring app', { installationId });

        const installation = await this.getInstallation(installationId);
        if (!installation) {
            throw new Error('Installation not found');
        }

        // Validate configuration
        const app = await this.getApp(installation.appId);
        const validationResult = await this.appValidator.validateConfiguration(app!.manifest, config);
        if (!validationResult.valid) {
            throw new Error(`Invalid configuration: ${validationResult.errors.join(', ')}`);
        }

        // Update configuration
        await this.database.appInstallations.update(installationId, {
            configuration: config,
            updatedAt: new Date()
        });

        this.logger.info('App configured successfully', { installationId });
    }

    /**
     * Create sandbox environment for app
     */
    async createSandbox(installationId: string): Promise<SandboxEnvironment> {
        this.logger.info('Creating sandbox', { installationId });

        const installation = await this.getInstallation(installationId);
        if (!installation) {
            throw new Error('Installation not found');
        }

        const app = await this.getApp(installation.appId);
        if (!app) {
            throw new Error('App not found');
        }

        const sandbox = await this.sandboxManager.createSandbox(
            installationId,
            app.manifest.sandbox
        );

        this.logger.info('Sandbox created successfully', { sandboxId: sandbox.id });
        return sandbox;
    }

    /**
     * Execute code in sandbox
     */
    async executeSandboxCode(sandboxId: string, code: string, context: any): Promise<any> {
        return this.sandboxManager.executeCode(sandboxId, code, context);
    }

    /**
     * Destroy sandbox environment
     */
    async destroySandbox(sandboxId: string): Promise<void> {
        await this.sandboxManager.destroySandbox(sandboxId);
    }

    /**
     * Process payment for app installation/usage
     */
    async processPayment(installationId: string, amount: number): Promise<RevenueTransaction> {
        return this.revenueManager.processPayment(installationId, amount);
    }

    /**
     * Calculate revenue split between platform and developer
     */
    async calculateRevenueSplit(amount: number, appId: string): Promise<{ platformFee: number; developerShare: number }> {
        return this.revenueManager.calculateRevenueSplit(amount, appId);
    }

    /**
     * Get marketplace analytics
     */
    async getMarketplaceAnalytics(): Promise<MarketplaceAnalytics> {
        const [
            totalApps,
            totalDevelopers,
            totalInstallations,
            totalRevenue,
            trendingApps,
            topCategories
        ] = await Promise.all([
            this.database.apps.count(),
            this.database.developers.count(),
            this.database.appInstallations.count(),
            this.database.revenueTransactions.sum('amount'),
            this.database.apps.findTrending(10),
            this.database.apps.getCategoryStats()
        ]);

        return {
            totalApps,
            totalDevelopers,
            totalInstallations,
            totalRevenue,
            trendingApps,
            topCategories,
            averageRating: await this.database.apps.averageRating(),
            averageDownloads: totalApps > 0 ? await this.database.apps.sum('downloads') / totalApps : 0,
            dailyInstalls: await this.database.appInstallations.getDailyStats(30),
            monthlyRevenue: await this.database.revenueTransactions.getMonthlyStats(12)
        };
    }

    /**
     * Get analytics for a specific app
     */
    async getAppAnalytics(appId: string): Promise<any> {
        const app = await this.getApp(appId);
        if (!app) {
            throw new Error('App not found');
        }

        return {
            downloads: app.downloads,
            activeInstalls: app.activeInstalls,
            rating: app.rating,
            reviewCount: app.reviewCount,
            totalRevenue: app.totalRevenue,
            monthlyRevenue: app.monthlyRevenue,
            installationTrend: await this.database.appInstallations.getTrendByApp(appId, 30),
            revenueTrend: await this.database.revenueTransactions.getTrendByApp(appId, 30),
            userEngagement: await this.database.appInstallations.getEngagementStats(appId)
        };
    }

    /**
     * Get analytics for a developer
     */
    async getDeveloperAnalytics(developerId: string): Promise<any> {
        const developer = await this.getDeveloper(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }

        return {
            totalApps: developer.totalApps,
            totalDownloads: developer.totalDownloads,
            totalRevenue: developer.totalRevenue,
            appPerformance: await this.database.apps.getPerformanceByDeveloper(developerId),
            revenueBreakdown: await this.database.revenueTransactions.getBreakdownByDeveloper(developerId),
            topApps: await this.database.apps.getTopByDeveloper(developerId, 5)
        };
    }

    // Helper methods
    private async getApp(appId: string): Promise<App | null> {
        return this.database.apps.findById(appId);
    }

    private async getInstallation(installationId: string): Promise<AppInstallation | null> {
        return this.database.appInstallations.findById(installationId);
    }

    private async getDeveloper(developerId: string): Promise<Developer> {
        const developer = await this.database.developers.findById(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }
        return developer;
    }

    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async emitEvent(event: MarketplaceEvent): Promise<void> {
        await this.eventEmitter.emit('marketplace.event', event);
    }
}