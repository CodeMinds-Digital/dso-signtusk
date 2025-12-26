import { PrismaClient, Subscription, UsageRecord, SubscriptionStatus } from '@signtusk/database';
import { StripeService } from './stripe-service';
import {
    BillingPlan,
    CreateSubscriptionRequest,
    UpdateSubscriptionRequest,
    RecordUsageRequest,
    CreateInvoiceRequest,
    PaymentMethod,
    WebhookEvent,
    BillingError,
    SubscriptionError,
    UsageError,
} from './types';

export interface BillingServiceConfig {
    stripe: StripeService;
    database: PrismaClient;
}

export class BillingService {
    private stripe: StripeService;
    private db: PrismaClient;

    constructor(config: BillingServiceConfig) {
        this.stripe = config.stripe;
        this.db = config.database;
    }

    // Subscription Management
    async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
        try {
            // Get organization
            const organization = await this.db.organization.findUnique({
                where: { id: request.organizationId },
            });

            if (!organization) {
                throw new SubscriptionError('Organization not found');
            }

            // Check if organization already has a subscription
            const existingSubscription = await this.db.subscription.findUnique({
                where: { organizationId: request.organizationId },
            });

            if (existingSubscription) {
                throw new SubscriptionError('Organization already has an active subscription');
            }

            // Get or create Stripe customer
            let customer = await this.stripe.getCustomerByOrganizationId(request.organizationId);

            if (!customer) {
                // Create new customer
                const primaryUser = await this.db.user.findFirst({
                    where: { organizationId: request.organizationId },
                    orderBy: { createdAt: 'asc' },
                });

                if (!primaryUser) {
                    throw new SubscriptionError('No users found for organization');
                }

                customer = await this.stripe.createCustomer(
                    request.organizationId,
                    primaryUser.email,
                    organization.name
                );
            }

            // Create Stripe subscription
            const stripeSubscription = await this.stripe.createSubscription(
                customer.id,
                request.planId,
                request
            );

            // Create database subscription record
            const subscription = await this.db.subscription.create({
                data: {
                    id: stripeSubscription.id,
                    organizationId: request.organizationId,
                    planId: request.planId,
                    status: this.mapStripeStatus(stripeSubscription.status),
                    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                    metadata: request.metadata || {},
                },
            });

            return subscription;
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new SubscriptionError(`Failed to create subscription: ${(error as Error).message}`);
        }
    }

    async getSubscription(subscriptionId: string): Promise<Subscription | null> {
        try {
            return await this.db.subscription.findUnique({
                where: { id: subscriptionId },
                include: {
                    organization: true,
                    usageRecords: {
                        orderBy: { timestamp: 'desc' },
                        take: 10,
                    },
                },
            });
        } catch (error) {
            throw new SubscriptionError(`Failed to get subscription: ${(error as Error).message}`);
        }
    }

    async getSubscriptionByOrganization(organizationId: string): Promise<Subscription | null> {
        try {
            return await this.db.subscription.findUnique({
                where: { organizationId },
                include: {
                    organization: true,
                    usageRecords: {
                        orderBy: { timestamp: 'desc' },
                        take: 10,
                    },
                },
            });
        } catch (error) {
            throw new SubscriptionError(`Failed to get subscription: ${(error as Error).message}`);
        }
    }

    async updateSubscription(subscriptionId: string, updates: UpdateSubscriptionRequest): Promise<Subscription> {
        try {
            // Get current subscription
            const subscription = await this.getSubscription(subscriptionId);
            if (!subscription) {
                throw new SubscriptionError('Subscription not found');
            }

            // Update Stripe subscription
            const stripeSubscription = await this.stripe.updateSubscription(subscriptionId, updates);

            // Update database record
            const updatedSubscription = await this.db.subscription.update({
                where: { id: subscriptionId },
                data: {
                    planId: updates.planId || subscription.planId,
                    status: this.mapStripeStatus(stripeSubscription.status),
                    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                    metadata: updates.metadata ?
                        JSON.parse(JSON.stringify({ ...(subscription.metadata as object), ...updates.metadata })) :
                        subscription.metadata,
                },
            });

            return updatedSubscription;
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new SubscriptionError(`Failed to update subscription: ${(error as Error).message}`);
        }
    }

    async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Subscription> {
        try {
            // Cancel Stripe subscription
            const stripeSubscription = await this.stripe.cancelSubscription(subscriptionId, immediately);

            // Update database record
            const updatedSubscription = await this.db.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: this.mapStripeStatus(stripeSubscription.status),
                    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                },
            });

            return updatedSubscription;
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new SubscriptionError(`Failed to cancel subscription: ${(error as Error).message}`);
        }
    }

    // Usage Tracking
    async recordUsage(request: RecordUsageRequest): Promise<UsageRecord> {
        try {
            // Get subscription
            const subscription = await this.getSubscription(request.subscriptionId);
            if (!subscription) {
                throw new UsageError('Subscription not found');
            }

            // Record usage in database
            const usageRecord = await this.db.usageRecord.create({
                data: {
                    subscriptionId: request.subscriptionId,
                    metric: request.metric,
                    quantity: request.quantity,
                    timestamp: request.timestamp || new Date(),
                    metadata: request.metadata || {},
                },
            });

            // If this is a metered billing plan, also record in Stripe
            // This would require additional logic to determine if the plan is metered
            // and get the subscription item ID for the metric

            return usageRecord;
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new UsageError(`Failed to record usage: ${(error as Error).message}`);
        }
    }

    async getUsageForPeriod(
        subscriptionId: string,
        metric: string,
        startDate: Date,
        endDate: Date
    ): Promise<UsageRecord[]> {
        try {
            return await this.db.usageRecord.findMany({
                where: {
                    subscriptionId,
                    metric,
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { timestamp: 'asc' },
            });
        } catch (error) {
            throw new UsageError(`Failed to get usage records: ${(error as Error).message}`);
        }
    }

    async getUsageSummary(subscriptionId: string, metric: string): Promise<{ total: number; current_period: number }> {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            if (!subscription) {
                throw new UsageError('Subscription not found');
            }

            // Get total usage
            const totalUsage = await this.db.usageRecord.aggregate({
                where: {
                    subscriptionId,
                    metric,
                },
                _sum: {
                    quantity: true,
                },
            });

            // Get current period usage
            const currentPeriodUsage = await this.db.usageRecord.aggregate({
                where: {
                    subscriptionId,
                    metric,
                    timestamp: {
                        gte: subscription.currentPeriodStart,
                        lte: subscription.currentPeriodEnd,
                    },
                },
                _sum: {
                    quantity: true,
                },
            });

            return {
                total: totalUsage._sum.quantity || 0,
                current_period: currentPeriodUsage._sum.quantity || 0,
            };
        } catch (error) {
            throw new UsageError(`Failed to get usage summary: ${(error as Error).message}`);
        }
    }

    // Payment Methods
    async getPaymentMethods(organizationId: string): Promise<PaymentMethod[]> {
        try {
            const customer = await this.stripe.getCustomerByOrganizationId(organizationId);
            if (!customer) {
                return [];
            }

            return await this.stripe.listPaymentMethods(customer.id);
        } catch (error) {
            throw new BillingError(`Failed to get payment methods: ${(error as Error).message}`, 'PAYMENT_METHOD_ERROR');
        }
    }

    async attachPaymentMethod(organizationId: string, paymentMethodId: string): Promise<PaymentMethod> {
        try {
            let customer = await this.stripe.getCustomerByOrganizationId(organizationId);

            if (!customer) {
                // Create customer if it doesn't exist
                const organization = await this.db.organization.findUnique({
                    where: { id: organizationId },
                });

                if (!organization) {
                    throw new BillingError('Organization not found', 'ORGANIZATION_NOT_FOUND');
                }

                const primaryUser = await this.db.user.findFirst({
                    where: { organizationId },
                    orderBy: { createdAt: 'asc' },
                });

                if (!primaryUser) {
                    throw new BillingError('No users found for organization', 'NO_USERS_FOUND');
                }

                customer = await this.stripe.createCustomer(
                    organizationId,
                    primaryUser.email,
                    organization.name
                );
            }

            const paymentMethod = await this.stripe.attachPaymentMethod(paymentMethodId, customer.id);

            return {
                id: paymentMethod.id,
                type: paymentMethod.type as any,
                card: paymentMethod.card ? {
                    brand: paymentMethod.card.brand,
                    last4: paymentMethod.card.last4,
                    expMonth: paymentMethod.card.exp_month,
                    expYear: paymentMethod.card.exp_year,
                } : undefined,
                isDefault: false,
            };
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new BillingError(`Failed to attach payment method: ${(error as Error).message}`, 'PAYMENT_METHOD_ERROR');
        }
    }

    async setDefaultPaymentMethod(organizationId: string, paymentMethodId: string): Promise<void> {
        try {
            const customer = await this.stripe.getCustomerByOrganizationId(organizationId);
            if (!customer) {
                throw new BillingError('Customer not found', 'CUSTOMER_NOT_FOUND');
            }

            await this.stripe.setDefaultPaymentMethod(customer.id, paymentMethodId);
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new BillingError(`Failed to set default payment method: ${(error as Error).message}`, 'PAYMENT_METHOD_ERROR');
        }
    }

    // Invoice Management
    async createInvoice(request: CreateInvoiceRequest): Promise<string> {
        try {
            const customer = await this.stripe.getCustomerByOrganizationId(request.organizationId);
            if (!customer) {
                throw new BillingError('Customer not found', 'CUSTOMER_NOT_FOUND');
            }

            const invoice = await this.stripe.createInvoice(customer.id, request);
            return invoice.id;
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new BillingError(`Failed to create invoice: ${(error as Error).message}`, 'INVOICE_ERROR');
        }
    }

    async getInvoices(organizationId: string, limit: number = 10): Promise<any[]> {
        try {
            const customer = await this.stripe.getCustomerByOrganizationId(organizationId);
            if (!customer) {
                return [];
            }

            const invoices = await this.stripe.listInvoices(customer.id, limit);

            return invoices.map(invoice => ({
                id: invoice.id,
                number: invoice.number,
                status: invoice.status,
                amount: invoice.total / 100, // Convert from cents
                currency: invoice.currency,
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
                paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
                hostedInvoiceUrl: invoice.hosted_invoice_url,
                invoicePdf: invoice.invoice_pdf,
            }));
        } catch (error) {
            throw new BillingError(`Failed to get invoices: ${(error as Error).message}`, 'INVOICE_ERROR');
        }
    }

    // Webhook Handling
    async handleWebhook(event: WebhookEvent): Promise<void> {
        try {
            switch (event.type) {
                case 'subscription.created':
                case 'subscription.updated':
                    await this.handleSubscriptionEvent(event);
                    break;
                case 'subscription.deleted':
                    await this.handleSubscriptionDeleted(event);
                    break;
                case 'invoice.paid':
                    await this.handleInvoicePaid(event);
                    break;
                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event);
                    break;
                default:
                    console.log(`Unhandled webhook event type: ${event.type}`);
            }
        } catch (error) {
            console.error(`Error handling webhook event ${event.id}:`, error);
            throw error;
        }
    }

    private async handleSubscriptionEvent(event: WebhookEvent): Promise<void> {
        const subscription = event.data.object as any;

        await this.db.subscription.upsert({
            where: { id: subscription.id },
            update: {
                status: this.mapStripeStatus(subscription.status),
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            create: {
                id: subscription.id,
                organizationId: subscription.metadata.organizationId,
                planId: subscription.items.data[0].price.id,
                status: this.mapStripeStatus(subscription.status),
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                metadata: subscription.metadata || {},
            },
        });
    }

    private async handleSubscriptionDeleted(event: WebhookEvent): Promise<void> {
        const subscription = event.data.object as any;

        await this.db.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELLED',
            },
        });
    }

    private async handleInvoicePaid(event: WebhookEvent): Promise<void> {
        // Handle successful invoice payment
        // Could trigger notifications, update subscription status, etc.
        console.log('Invoice paid:', event.data.object);
    }

    private async handleInvoicePaymentFailed(event: WebhookEvent): Promise<void> {
        // Handle failed invoice payment
        // Could trigger notifications, update subscription status, etc.
        console.log('Invoice payment failed:', event.data.object);
    }

    // Utility Methods
    private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
        const statusMap: Record<string, SubscriptionStatus> = {
            'active': 'ACTIVE',
            'past_due': 'PAST_DUE',
            'canceled': 'CANCELLED',
            'unpaid': 'UNPAID',
            'trialing': 'TRIALING',
            'incomplete': 'INCOMPLETE',
            'incomplete_expired': 'INCOMPLETE_EXPIRED',
        };

        return statusMap[stripeStatus] || 'ACTIVE';
    }

    async createSetupIntent(organizationId: string): Promise<{ clientSecret: string }> {
        try {
            let customer = await this.stripe.getCustomerByOrganizationId(organizationId);

            if (!customer) {
                const organization = await this.db.organization.findUnique({
                    where: { id: organizationId },
                });

                if (!organization) {
                    throw new BillingError('Organization not found', 'ORGANIZATION_NOT_FOUND');
                }

                const primaryUser = await this.db.user.findFirst({
                    where: { organizationId },
                    orderBy: { createdAt: 'asc' },
                });

                if (!primaryUser) {
                    throw new BillingError('No users found for organization', 'NO_USERS_FOUND');
                }

                customer = await this.stripe.createCustomer(
                    organizationId,
                    primaryUser.email,
                    organization.name
                );
            }

            const setupIntent = await this.stripe.createSetupIntent(customer.id);
            return { clientSecret: setupIntent.client_secret! };
        } catch (error) {
            if (error instanceof BillingError) {
                throw error;
            }
            throw new BillingError(`Failed to create setup intent: ${(error as Error).message}`, 'SETUP_INTENT_ERROR');
        }
    }
}