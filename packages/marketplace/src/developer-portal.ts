/**
 * Developer Portal
 * 
 * Provides developer-facing functionality for managing apps,
 * viewing analytics, and handling revenue.
 */

import { App, Developer, AppStatus, MarketplaceAnalytics } from './types';
import { MarketplaceServiceImpl } from './marketplace-service';

export interface DeveloperDashboard {
    developer: Developer;
    apps: App[];
    totalRevenue: number;
    monthlyRevenue: number;
    totalDownloads: number;
    activeInstalls: number;
    recentTransactions: any[];
    performanceMetrics: any;
}

export interface AppSubmissionResult {
    success: boolean;
    appId?: string;
    errors?: string[];
    reviewId?: string;
}

export class DeveloperPortal {
    constructor(
        private marketplaceService: MarketplaceServiceImpl,
        private database: any,
        private logger: any
    ) { }

    /**
     * Register a new developer
     */
    async registerDeveloper(
        userId: string,
        developerData: {
            companyName?: string;
            website?: string;
            supportEmail: string;
            payoutMethod: 'stripe' | 'paypal' | 'bank_transfer';
            payoutDetails: Record<string, any>;
        }
    ): Promise<Developer> {
        this.logger.info('Registering new developer', { userId });

        // Check if developer already exists
        const existingDeveloper = await this.database.developers.findByUserId(userId);
        if (existingDeveloper) {
            throw new Error('Developer already registered');
        }

        // Create developer profile
        const developer: Developer = {
            id: this.generateId('dev'),
            userId,
            companyName: developerData.companyName,
            website: developerData.website,
            supportEmail: developerData.supportEmail,
            verified: false,
            verificationDocuments: [],
            payoutMethod: developerData.payoutMethod,
            payoutDetails: developerData.payoutDetails,
            revenueShare: 70, // Default 70% to developer, 30% platform fee
            totalApps: 0,
            totalDownloads: 0,
            totalRevenue: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await this.database.developers.create(developer);

        this.logger.info('Developer registered successfully', { developerId: developer.id });
        return developer;
    }

    /**
     * Get developer dashboard data
     */
    async getDeveloperDashboard(developerId: string): Promise<DeveloperDashboard> {
        const developer = await this.database.developers.findById(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }

        const [
            apps,
            recentTransactions,
            performanceMetrics
        ] = await Promise.all([
            this.database.apps.findByDeveloper(developerId),
            this.database.revenueTransactions.findRecentByDeveloper(developerId, 10),
            this.marketplaceService.getDeveloperAnalytics(developerId)
        ]);

        // Calculate aggregated metrics
        const totalRevenue = apps.reduce((sum: number, app: App) => sum + app.totalRevenue, 0);
        const monthlyRevenue = apps.reduce((sum: number, app: App) => sum + app.monthlyRevenue, 0);
        const totalDownloads = apps.reduce((sum: number, app: App) => sum + app.downloads, 0);
        const activeInstalls = apps.reduce((sum: number, app: App) => sum + app.activeInstalls, 0);

        return {
            developer,
            apps,
            totalRevenue,
            monthlyRevenue,
            totalDownloads,
            activeInstalls,
            recentTransactions,
            performanceMetrics
        };
    }

    /**
     * Submit app for review
     */
    async submitApp(developerId: string, appData: any): Promise<AppSubmissionResult> {
        try {
            this.logger.info('Submitting app for review', { developerId, appName: appData.manifest.name });

            // Validate developer
            const developer = await this.database.developers.findById(developerId);
            if (!developer) {
                return { success: false, errors: ['Developer not found'] };
            }

            if (!developer.verified) {
                return { success: false, errors: ['Developer must be verified to submit apps'] };
            }

            // Create app
            const app = await this.marketplaceService.createApp(developerId, appData.manifest);

            // Upload package if provided
            if (appData.packageFile) {
                const packageUrl = await this.uploadAppPackage(app.id, appData.packageFile);
                await this.database.apps.update(app.id, { packageUrl });
            }

            // Upload screenshots
            if (appData.screenshots) {
                const screenshotUrls = await this.uploadScreenshots(app.id, appData.screenshots);
                await this.database.apps.update(app.id, { screenshots: screenshotUrls });
            }

            // Submit for review
            await this.marketplaceService.submitForReview(app.id);

            return {
                success: true,
                appId: app.id,
                reviewId: `review_${app.id}_${Date.now()}`
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown submission error';
            this.logger.error('App submission failed', { developerId, error: errorMessage });
            return {
                success: false,
                errors: [errorMessage]
            };
        }
    }

    /**
     * Update app information
     */
    async updateApp(developerId: string, appId: string, updates: any): Promise<App> {
        // Verify ownership
        const app = await this.database.apps.findById(appId);
        if (!app) {
            throw new Error('App not found');
        }

        if (app.developerId !== developerId) {
            throw new Error('Access denied: not app owner');
        }

        // Update app
        return this.marketplaceService.updateApp(appId, updates);
    }

    /**
     * Get app analytics for developer
     */
    async getAppAnalytics(developerId: string, appId: string): Promise<any> {
        // Verify ownership
        const app = await this.database.apps.findById(appId);
        if (!app) {
            throw new Error('App not found');
        }

        if (app.developerId !== developerId) {
            throw new Error('Access denied: not app owner');
        }

        return this.marketplaceService.getAppAnalytics(appId);
    }

    /**
     * Get revenue analytics for developer
     */
    async getRevenueAnalytics(developerId: string, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
        const developer = await this.database.developers.findById(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }

        const [
            totalRevenue,
            revenueByApp,
            revenueByMonth,
            pendingPayouts,
            completedPayouts
        ] = await Promise.all([
            this.database.revenueTransactions.getTotalByDeveloper(developerId),
            this.database.revenueTransactions.getByAppForDeveloper(developerId),
            this.database.revenueTransactions.getMonthlyForDeveloper(developerId, timeframe),
            this.database.payoutTransactions.getPendingByDeveloper(developerId),
            this.database.payoutTransactions.getCompletedByDeveloper(developerId, 12)
        ]);

        return {
            totalRevenue,
            revenueByApp,
            revenueByMonth,
            pendingPayouts,
            completedPayouts,
            nextPayoutDate: this.calculateNextPayoutDate(),
            revenueShare: developer.revenueShare
        };
    }

    /**
     * Request developer verification
     */
    async requestVerification(developerId: string, documents: string[]): Promise<void> {
        const developer = await this.database.developers.findById(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }

        if (developer.verified) {
            throw new Error('Developer is already verified');
        }

        // Update verification documents
        await this.database.developers.update(developerId, {
            verificationDocuments: documents,
            updatedAt: new Date()
        });

        // Create verification request
        await this.database.verificationRequests.create({
            id: this.generateId('verification'),
            developerId,
            documents,
            status: 'pending',
            createdAt: new Date()
        });

        this.logger.info('Verification requested', { developerId });
    }

    /**
     * Update payout settings
     */
    async updatePayoutSettings(
        developerId: string,
        settings: {
            payoutMethod: 'stripe' | 'paypal' | 'bank_transfer';
            payoutDetails: Record<string, any>;
        }
    ): Promise<void> {
        const developer = await this.database.developers.findById(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }

        // Validate payout details based on method
        await this.validatePayoutDetails(settings.payoutMethod, settings.payoutDetails);

        // Update settings
        await this.database.developers.update(developerId, {
            payoutMethod: settings.payoutMethod,
            payoutDetails: settings.payoutDetails,
            updatedAt: new Date()
        });

        this.logger.info('Payout settings updated', { developerId, method: settings.payoutMethod });
    }

    /**
     * Get marketplace insights for developers
     */
    async getMarketplaceInsights(): Promise<{
        topCategories: any[];
        trendingKeywords: string[];
        averageRating: number;
        competitorAnalysis: any[];
        marketOpportunities: string[];
    }> {
        const analytics = await this.marketplaceService.getMarketplaceAnalytics();

        const [
            trendingKeywords,
            competitorAnalysis,
            marketOpportunities
        ] = await Promise.all([
            this.database.apps.getTrendingKeywords(30),
            this.database.apps.getCompetitorAnalysis(),
            this.generateMarketOpportunities(analytics)
        ]);

        return {
            topCategories: analytics.topCategories,
            trendingKeywords,
            averageRating: analytics.averageRating,
            competitorAnalysis,
            marketOpportunities
        };
    }

    // Private helper methods

    private async uploadAppPackage(appId: string, packageFile: any): Promise<string> {
        // In a real implementation, this would upload to secure storage
        // with virus scanning and validation
        const filename = `packages/${appId}/${Date.now()}.tar.gz`;

        // Mock upload
        return `https://storage.docusign-alternative.com/${filename}`;
    }

    private async uploadScreenshots(appId: string, screenshots: any[]): Promise<string[]> {
        // In a real implementation, this would upload images to CDN
        const urls: string[] = [];

        for (let i = 0; i < screenshots.length; i++) {
            const filename = `screenshots/${appId}/${i + 1}.png`;
            urls.push(`https://cdn.docusign-alternative.com/${filename}`);
        }

        return urls;
    }

    private async validatePayoutDetails(method: string, details: Record<string, any>): Promise<void> {
        switch (method) {
            case 'stripe':
                if (!details.stripeAccountId) {
                    throw new Error('Stripe account ID is required');
                }
                break;
            case 'paypal':
                if (!details.paypalEmail) {
                    throw new Error('PayPal email is required');
                }
                break;
            case 'bank_transfer':
                if (!details.accountNumber || !details.routingNumber) {
                    throw new Error('Bank account details are required');
                }
                break;
            default:
                throw new Error(`Unsupported payout method: ${method}`);
        }
    }

    private calculateNextPayoutDate(): Date {
        // Payouts are processed monthly on the 15th
        const now = new Date();
        const nextPayout = new Date(now.getFullYear(), now.getMonth(), 15);

        if (nextPayout <= now) {
            nextPayout.setMonth(nextPayout.getMonth() + 1);
        }

        return nextPayout;
    }

    private async generateMarketOpportunities(analytics: MarketplaceAnalytics): Promise<string[]> {
        const opportunities: string[] = [];

        // Analyze gaps in categories
        const categoryGaps = await this.database.apps.getCategoryGaps();
        for (const gap of categoryGaps) {
            opportunities.push(`High demand for ${gap.category} apps with ${gap.missingFeatures.join(', ')}`);
        }

        // Analyze pricing opportunities
        const pricingAnalysis = await this.database.apps.getPricingAnalysis();
        if (pricingAnalysis.underservedPriceRanges.length > 0) {
            opportunities.push(`Opportunity in ${pricingAnalysis.underservedPriceRanges.join(', ')} price ranges`);
        }

        // Analyze feature gaps
        const featureGaps = await this.database.apps.getFeatureGaps();
        for (const gap of featureGaps) {
            opportunities.push(`Users requesting ${gap.feature} in ${gap.category} apps`);
        }

        return opportunities;
    }

    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}