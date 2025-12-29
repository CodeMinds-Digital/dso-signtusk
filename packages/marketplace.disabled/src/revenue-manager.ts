/**
 * Revenue Manager
 * 
 * Handles payment processing, revenue sharing, and automated payouts
 * for the marketplace platform.
 */

import Stripe from 'stripe';
import { RevenueTransaction, RevenueModel } from './types';

// Database interface for RevenueManager dependencies
export interface MarketplaceDatabase {
    appInstallations: {
        findById(id: string): Promise<any>;
        findBySubscription(subscriptionId: string): Promise<any>;
        findByAppAndOrg(appId: string, organizationId: string): Promise<any>;
        findByOrganization(organizationId: string): Promise<any[]>;
        create(installation: any): Promise<void>;
        update(id: string, data: any): Promise<void>;
        delete(id: string): Promise<void>;
        count(): Promise<number>;
        getTrendByApp(appId: string, days: number): Promise<any[]>;
        getDailyStats(days: number): Promise<any[]>;
        getEngagementStats(appId: string): Promise<any>;
    };
    apps: {
        findById(id: string): Promise<any>;
        findPublished(options: any): Promise<{ items: any[]; total: number }>;
        create(app: any): Promise<void>;
        update(id: string, data: any): Promise<void>;
        count(): Promise<number>;
        findTrending(limit: number): Promise<any[]>;
        getCategoryStats(): Promise<any[]>;
        averageRating(): Promise<number>;
        sum(field: string): Promise<number>;
        getPerformanceByDeveloper(developerId: string): Promise<any>;
        getTopByDeveloper(developerId: string, limit: number): Promise<any[]>;
    };
    developers: {
        findById(id: string): Promise<any>;
        findWithPendingPayouts(): Promise<any[]>;
        update(id: string, data: any): Promise<void>;
        count(): Promise<number>;
    };
    revenueTransactions: {
        create(transaction: any): Promise<void>;
        updateByPaymentId(paymentId: string, data: any): Promise<void>;
        getPendingDeveloperAmount(developerId: string): Promise<number>;
        markAsPaidOut(developerId: string, amount: number): Promise<void>;
        sum(field: string): Promise<number>;
        getTrendByApp(appId: string, days: number): Promise<any[]>;
        getMonthlyStats(months: number): Promise<any[]>;
        getBreakdownByDeveloper(developerId: string): Promise<any>;
    };
    payoutTransactions: {
        create(transaction: any): Promise<void>;
    };
    stripeCustomers: {
        findByOrganization(organizationId: string): Promise<any>;
        create(customer: any): Promise<void>;
    };
    organizations: {
        findById(id: string): Promise<any>;
    };
    appReviews: {
        create(review: any): Promise<void>;
    };
    sandboxes: {
        findByInstallation(installationId: string): Promise<any>;
    };
}

// Logger interface for RevenueManager dependencies
export interface Logger {
    info(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
}

export class RevenueManager {
    private stripe: Stripe;
    private platformFeePercentage = 30; // 30% platform fee, 70% to developer

    constructor(
        private database: MarketplaceDatabase,
        private logger: Logger,
        stripeSecretKey?: string
    ) {
        const apiKey = stripeSecretKey || process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_testing';
        this.stripe = new Stripe(apiKey, {
            apiVersion: '2025-02-24.acacia'
        });
    }

    /**
     * Process payment for app installation or usage
     */
    async processPayment(installationId: string, amount: number): Promise<RevenueTransaction> {
        this.logger.info('Processing payment', { installationId, amount });

        const installation = await this.database.appInstallations.findById(installationId);
        if (!installation) {
            throw new Error('Installation not found');
        }

        const app = await this.database.apps.findById(installation.appId);
        if (!app) {
            throw new Error('App not found');
        }

        const developer = await this.database.developers.findById(app.developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }

        // Calculate revenue split
        const { platformFee, developerShare } = await this.calculateRevenueSplit(amount, app.id);

        // Create transaction record
        const transaction: RevenueTransaction = {
            id: this.generateTransactionId(),
            appId: app.id,
            developerId: app.developerId,
            organizationId: installation.organizationId,
            installationId,
            type: this.getTransactionType(app.manifest.pricing.model),
            amount,
            currency: app.manifest.pricing.currency || 'USD',
            platformFee,
            developerShare,
            paymentMethod: 'stripe',
            paymentId: '', // Will be set after Stripe processing
            status: 'pending',
            createdAt: new Date()
        };

        try {
            // Process payment with Stripe
            const paymentIntent = await this.createStripePayment(
                amount,
                transaction.currency,
                installation.organizationId,
                app.manifest.name
            );

            // Update transaction with payment details
            transaction.paymentId = paymentIntent.id;
            transaction.status = paymentIntent.status === 'succeeded' ? 'completed' : 'pending';
            transaction.processedAt = new Date();

            // Save transaction
            await this.database.revenueTransactions.create(transaction);

            // Update app revenue metrics
            await this.updateAppRevenue(app.id, amount);

            // Update developer revenue metrics
            await this.updateDeveloperRevenue(app.developerId, developerShare);

            // Create subscription if applicable
            if (app.manifest.pricing.model === RevenueModel.SUBSCRIPTION) {
                await this.createSubscription(installation, app, paymentIntent.customer as string);
            }

            this.logger.info('Payment processed successfully', {
                transactionId: transaction.id,
                paymentIntentId: paymentIntent.id
            });

            return transaction;
        } catch (error: unknown) {
            // Update transaction status to failed
            transaction.status = 'failed';
            await this.database.revenueTransactions.create(transaction);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error('Payment processing failed', {
                transactionId: transaction.id,
                error: errorMessage
            });

            throw error;
        }
    }

    /**
     * Calculate revenue split between platform and developer
     */
    async calculateRevenueSplit(amount: number, appId: string): Promise<{ platformFee: number; developerShare: number }> {
        const app = await this.database.apps.findById(appId);
        if (!app) {
            throw new Error('App not found');
        }

        const developer = await this.database.developers.findById(app.developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }

        // Use developer's custom revenue share if available, otherwise use default
        const developerSharePercentage = developer.revenueShare || (100 - this.platformFeePercentage);

        const platformFee = Math.round(amount * (this.platformFeePercentage / 100));
        const developerShare = amount - platformFee;

        return { platformFee, developerShare };
    }

    /**
     * Create Stripe subscription for recurring payments
     */
    async createSubscription(installation: any, app: any, customerId: string): Promise<void> {
        // First create a product
        const product = await this.stripe.products.create({
            name: app.manifest.name,
            description: app.manifest.description
        });

        // Then create a price for the product
        const price = await this.stripe.prices.create({
            product: product.id,
            currency: app.manifest.pricing.currency || 'USD',
            unit_amount: Math.round((app.manifest.pricing.price || 0) * 100), // Convert to cents
            recurring: {
                interval: app.manifest.pricing.billingCycle === 'yearly' ? 'year' : 'month'
            }
        });

        const subscription = await this.stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: price.id }],
            metadata: {
                installationId: installation.id,
                appId: app.id,
                organizationId: installation.organizationId
            }
        });

        // Update installation with subscription ID
        await this.database.appInstallations.update(installation.id, {
            subscriptionId: subscription.id,
            billingStatus: 'active'
        });
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(subscriptionId: string): Promise<void> {
        try {
            await this.stripe.subscriptions.cancel(subscriptionId);

            // Update installation billing status
            const installation = await this.database.appInstallations.findBySubscription(subscriptionId);
            if (installation) {
                await this.database.appInstallations.update(installation.id, {
                    billingStatus: 'canceled'
                });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error('Failed to cancel subscription', { subscriptionId, error: errorMessage });
            throw error;
        }
    }

    /**
     * Process automated payouts to developers
     */
    async processPayouts(): Promise<void> {
        this.logger.info('Processing automated payouts');

        // Get developers with pending payouts
        const developers = await this.database.developers.findWithPendingPayouts();

        for (const developer of developers) {
            try {
                await this.processDeveloperPayout(developer);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                this.logger.error('Failed to process payout for developer', {
                    developerId: developer.id,
                    error: errorMessage
                });
            }
        }
    }

    /**
     * Process payout for a specific developer
     */
    async processDeveloperPayout(developer: any): Promise<void> {
        const pendingAmount = await this.database.revenueTransactions.getPendingDeveloperAmount(developer.id);

        if (pendingAmount < 100) { // Minimum payout threshold ($1.00)
            return; // Skip if below threshold
        }

        try {
            let transfer;

            switch (developer.payoutMethod) {
                case 'stripe':
                    transfer = await this.processStripeTransfer(developer, pendingAmount);
                    break;
                case 'paypal':
                    transfer = await this.processPayPalTransfer(developer, pendingAmount);
                    break;
                case 'bank_transfer':
                    transfer = await this.processBankTransfer(developer, pendingAmount);
                    break;
                default:
                    throw new Error(`Unsupported payout method: ${developer.payoutMethod}`);
            }

            // Record payout transaction
            await this.database.payoutTransactions.create({
                id: this.generateTransactionId(),
                developerId: developer.id,
                amount: pendingAmount,
                method: developer.payoutMethod,
                transferId: transfer.id,
                status: 'completed',
                createdAt: new Date()
            });

            // Mark revenue transactions as paid out
            await this.database.revenueTransactions.markAsPaidOut(developer.id, pendingAmount);

            this.logger.info('Payout processed successfully', {
                developerId: developer.id,
                amount: pendingAmount,
                transferId: transfer.id
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error('Payout processing failed', {
                developerId: developer.id,
                amount: pendingAmount,
                error: errorMessage
            });
            throw error;
        }
    }

    /**
     * Handle webhook events from payment providers
     */
    async handleWebhook(provider: string, event: any): Promise<void> {
        switch (provider) {
            case 'stripe':
                await this.handleStripeWebhook(event);
                break;
            case 'paypal':
                await this.handlePayPalWebhook(event);
                break;
            default:
                this.logger.warn('Unknown webhook provider', { provider });
        }
    }

    // Private methods

    private async createStripePayment(
        amount: number,
        currency: string,
        organizationId: string,
        description: string
    ): Promise<any> {
        // Get or create Stripe customer
        const customer = await this.getOrCreateStripeCustomer(organizationId);

        // Create payment intent
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            customer: customer.id,
            description,
            metadata: {
                organizationId
            }
        });

        return paymentIntent;
    }

    private async getOrCreateStripeCustomer(organizationId: string): Promise<any> {
        // Check if customer already exists
        const existingCustomer = await this.database.stripeCustomers.findByOrganization(organizationId);
        if (existingCustomer) {
            return this.stripe.customers.retrieve(existingCustomer.stripeCustomerId);
        }

        // Get organization details
        const organization = await this.database.organizations.findById(organizationId);
        if (!organization) {
            throw new Error('Organization not found');
        }

        // Create new Stripe customer
        const customer = await this.stripe.customers.create({
            name: organization.name,
            email: organization.billingEmail || organization.adminEmail,
            metadata: {
                organizationId
            }
        });

        // Save customer mapping
        await this.database.stripeCustomers.create({
            organizationId,
            stripeCustomerId: customer.id,
            createdAt: new Date()
        });

        return customer;
    }

    private async processStripeTransfer(developer: any, amount: number): Promise<any> {
        // Create Stripe transfer to developer's connected account
        const transfer = await this.stripe.transfers.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'USD',
            destination: developer.payoutDetails.stripeAccountId,
            metadata: {
                developerId: developer.id,
                type: 'marketplace_payout'
            }
        });

        return transfer;
    }

    private async processPayPalTransfer(developer: any, amount: number): Promise<any> {
        // Implement PayPal payout logic
        // This would integrate with PayPal's Payouts API
        throw new Error('PayPal payouts not implemented yet');
    }

    private async processBankTransfer(developer: any, amount: number): Promise<any> {
        // Implement bank transfer logic
        // This would integrate with banking APIs or manual processing
        throw new Error('Bank transfers not implemented yet');
    }

    private async handleStripeWebhook(event: any): Promise<void> {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentFailure(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await this.handleSubscriptionPayment(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionCancellation(event.data.object);
                break;
            default:
                this.logger.info('Unhandled Stripe webhook event', { type: event.type });
        }
    }

    private async handlePayPalWebhook(event: any): Promise<void> {
        // Implement PayPal webhook handling
        this.logger.info('PayPal webhook received', { event });
    }

    private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
        // Update transaction status
        await this.database.revenueTransactions.updateByPaymentId(paymentIntent.id, {
            status: 'completed',
            processedAt: new Date()
        });
    }

    private async handlePaymentFailure(paymentIntent: any): Promise<void> {
        // Update transaction status
        await this.database.revenueTransactions.updateByPaymentId(paymentIntent.id, {
            status: 'failed',
            processedAt: new Date()
        });
    }

    private async handleSubscriptionPayment(invoice: any): Promise<void> {
        // Process recurring subscription payment
        const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
        const installationId = subscription.metadata.installationId;

        if (installationId) {
            // Create revenue transaction for subscription payment
            await this.processPayment(installationId, invoice.amount_paid / 100);
        }
    }

    private async handleSubscriptionCancellation(subscription: any): Promise<void> {
        const installationId = subscription.metadata.installationId;

        if (installationId) {
            await this.database.appInstallations.update(installationId, {
                billingStatus: 'canceled'
            });
        }
    }

    private async updateAppRevenue(appId: string, amount: number): Promise<void> {
        const app = await this.database.apps.findById(appId);
        if (app) {
            await this.database.apps.update(appId, {
                totalRevenue: app.totalRevenue + amount,
                monthlyRevenue: app.monthlyRevenue + amount, // This would need proper monthly calculation
                updatedAt: new Date()
            });
        }
    }

    private async updateDeveloperRevenue(developerId: string, amount: number): Promise<void> {
        const developer = await this.database.developers.findById(developerId);
        if (developer) {
            await this.database.developers.update(developerId, {
                totalRevenue: developer.totalRevenue + amount,
                updatedAt: new Date()
            });
        }
    }

    private getTransactionType(revenueModel: RevenueModel): 'purchase' | 'subscription' | 'usage' | 'refund' {
        switch (revenueModel) {
            case RevenueModel.ONE_TIME:
                return 'purchase';
            case RevenueModel.SUBSCRIPTION:
                return 'subscription';
            case RevenueModel.USAGE_BASED:
                return 'usage';
            default:
                return 'purchase';
        }
    }

    private generateTransactionId(): string {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}