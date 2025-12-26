import Stripe from 'stripe';
import {
    BillingPlan,
    CreateSubscriptionRequest,
    UpdateSubscriptionRequest,
    PaymentMethod,
    CreateInvoiceRequest,
    RecordUsageRequest,
    WebhookEvent,
    StripeError,
    SubscriptionError,
} from './types';

export interface StripeConfig {
    secretKey: string;
    webhookSecret: string;
    apiVersion?: Stripe.LatestApiVersion;
}

export class StripeService {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(config: StripeConfig) {
        this.stripe = new Stripe(config.secretKey, {
            apiVersion: config.apiVersion || '2023-10-16',
        });
        this.webhookSecret = config.webhookSecret;
    }

    // Customer Management
    async createCustomer(organizationId: string, email: string, name: string): Promise<Stripe.Customer> {
        try {
            return await this.stripe.customers.create({
                email,
                name,
                metadata: {
                    organizationId,
                },
            });
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async getCustomer(customerId: string): Promise<Stripe.Customer> {
        try {
            const customer = await this.stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                throw new StripeError('Customer has been deleted');
            }
            return customer as Stripe.Customer;
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async updateCustomer(customerId: string, updates: Partial<Stripe.CustomerUpdateParams>): Promise<Stripe.Customer> {
        try {
            return await this.stripe.customers.update(customerId, updates);
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    // Product and Price Management
    async createProduct(plan: BillingPlan): Promise<Stripe.Product> {
        try {
            return await this.stripe.products.create({
                id: plan.id,
                name: plan.name,
                description: plan.description,
                metadata: {
                    features: JSON.stringify(plan.features),
                    limits: JSON.stringify(plan.limits),
                },
            });
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async createPrice(productId: string, plan: BillingPlan): Promise<Stripe.Price> {
        try {
            return await this.stripe.prices.create({
                product: productId,
                unit_amount: Math.round(plan.price * 100), // Convert to cents
                currency: plan.currency,
                recurring: {
                    interval: plan.interval,
                },
                metadata: {
                    planId: plan.id,
                },
            });
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    // Subscription Management
    async createSubscription(
        customerId: string,
        priceId: string,
        request: CreateSubscriptionRequest
    ): Promise<Stripe.Subscription> {
        try {
            const subscriptionParams: Stripe.SubscriptionCreateParams = {
                customer: customerId,
                items: [{ price: priceId }],
                metadata: {
                    organizationId: request.organizationId,
                    ...request.metadata,
                },
            };

            if (request.paymentMethodId) {
                subscriptionParams.default_payment_method = request.paymentMethodId;
            }

            if (request.trialDays) {
                subscriptionParams.trial_period_days = request.trialDays;
            }

            return await this.stripe.subscriptions.create(subscriptionParams);
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
        try {
            return await this.stripe.subscriptions.retrieve(subscriptionId);
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async updateSubscription(
        subscriptionId: string,
        updates: UpdateSubscriptionRequest
    ): Promise<Stripe.Subscription> {
        try {
            const updateParams: Stripe.SubscriptionUpdateParams = {};

            if (updates.planId) {
                // Get the subscription to find the current item
                const subscription = await this.getSubscription(subscriptionId);
                const currentItem = subscription.items.data[0];

                updateParams.items = [{
                    id: currentItem.id,
                    price: updates.planId,
                }];
            }

            if (updates.cancelAtPeriodEnd !== undefined) {
                updateParams.cancel_at_period_end = updates.cancelAtPeriodEnd;
            }

            if (updates.metadata) {
                updateParams.metadata = updates.metadata;
            }

            return await this.stripe.subscriptions.update(subscriptionId, updateParams);
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
        try {
            if (immediately) {
                return await this.stripe.subscriptions.cancel(subscriptionId);
            } else {
                return await this.stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                });
            }
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    // Usage Recording
    async recordUsage(subscriptionItemId: string, usage: RecordUsageRequest): Promise<Stripe.UsageRecord> {
        try {
            return await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
                quantity: usage.quantity,
                timestamp: usage.timestamp ? Math.floor(usage.timestamp.getTime() / 1000) : 'now',
                action: 'set', // or 'increment'
            });
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async getUsageSummary(subscriptionItemId: string): Promise<Stripe.UsageRecordSummary[]> {
        try {
            const response = await this.stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItemId);
            return response.data;
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    // Payment Methods
    async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
        try {
            return await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
        try {
            return await this.stripe.paymentMethods.detach(paymentMethodId);
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
        try {
            const response = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });

            return response.data.map(pm => ({
                id: pm.id,
                type: pm.type as any,
                card: pm.card ? {
                    brand: pm.card.brand,
                    last4: pm.card.last4,
                    expMonth: pm.card.exp_month,
                    expYear: pm.card.exp_year,
                } : undefined,
                isDefault: false, // This would need to be determined from customer's default payment method
            }));
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
        try {
            return await this.stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    // Invoice Management
    async createInvoice(customerId: string, request: CreateInvoiceRequest): Promise<Stripe.Invoice> {
        try {
            const invoice = await this.stripe.invoices.create({
                customer: customerId,
                subscription: request.subscriptionId,
                due_date: request.dueDate ? Math.floor(request.dueDate.getTime() / 1000) : undefined,
                metadata: request.metadata,
            });

            // Add line items
            for (const item of request.lineItems) {
                await this.stripe.invoiceItems.create({
                    customer: customerId,
                    invoice: invoice.id,
                    amount: Math.round(item.amount * 100), // Convert to cents
                    quantity: item.quantity,
                    description: item.description,
                    metadata: item.metadata,
                });
            }

            return invoice;
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async finalizeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
        try {
            return await this.stripe.invoices.finalizeInvoice(invoiceId);
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async payInvoice(invoiceId: string): Promise<Stripe.Invoice> {
        try {
            return await this.stripe.invoices.pay(invoiceId);
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async listInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
        try {
            const response = await this.stripe.invoices.list({
                customer: customerId,
                limit,
            });
            return response.data;
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    // Webhook Handling
    constructWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent {
        try {
            const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

            return {
                id: event.id,
                type: event.type as any,
                data: event.data,
                created: event.created,
            };
        } catch (error) {
            throw new StripeError(`Webhook signature verification failed: ${(error as Error).message}`);
        }
    }

    // Setup Intents for Payment Method Collection
    async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
        try {
            return await this.stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
                usage: 'off_session',
            });
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    // Error Handling
    private handleStripeError(error: any): StripeError {
        if (error instanceof Stripe.errors.StripeError) {
            return new StripeError((error as Error).message, error.code);
        }
        return new StripeError((error as Error).message || 'Unknown Stripe error');
    }

    // Utility Methods
    async getCustomerByOrganizationId(organizationId: string): Promise<Stripe.Customer | null> {
        try {
            const customers = await this.stripe.customers.search({
                query: `metadata['organizationId']:'${organizationId}'`,
            });

            return customers.data.length > 0 ? customers.data[0] : null;
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }

    async getSubscriptionsByCustomer(customerId: string): Promise<Stripe.Subscription[]> {
        try {
            const response = await this.stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
            });
            return response.data;
        } catch (error) {
            throw this.handleStripeError(error);
        }
    }
}