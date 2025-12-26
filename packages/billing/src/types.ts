import { z } from 'zod';

// Billing Plan Types
export const BillingPlanSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    currency: z.string().default('usd'),
    interval: z.enum(['month', 'year']),
    features: z.array(z.string()),
    limits: z.record(z.number()),
    isActive: z.boolean().default(true),
});

export type BillingPlan = z.infer<typeof BillingPlanSchema>;

// Subscription Types
export const SubscriptionStatusSchema = z.enum([
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'UNPAID',
    'TRIALING',
    'INCOMPLETE',
    'INCOMPLETE_EXPIRED',
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const CreateSubscriptionSchema = z.object({
    organizationId: z.string(),
    planId: z.string(),
    paymentMethodId: z.string().optional(),
    trialDays: z.number().optional(),
    metadata: z.record(z.any()).optional(),
});

export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionSchema>;

export const UpdateSubscriptionSchema = z.object({
    planId: z.string().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});

export type UpdateSubscriptionRequest = z.infer<typeof UpdateSubscriptionSchema>;

// Usage Tracking Types
export const UsageMetricSchema = z.object({
    name: z.string(),
    description: z.string(),
    unit: z.string(),
    aggregation: z.enum(['sum', 'max', 'last_during_period']),
});

export type UsageMetric = z.infer<typeof UsageMetricSchema>;

export const RecordUsageSchema = z.object({
    subscriptionId: z.string(),
    metric: z.string(),
    quantity: z.number(),
    timestamp: z.date().optional(),
    metadata: z.record(z.any()).optional(),
});

export type RecordUsageRequest = z.infer<typeof RecordUsageSchema>;

// Invoice Types
export const InvoiceStatusSchema = z.enum([
    'DRAFT',
    'OPEN',
    'PAID',
    'VOID',
    'UNCOLLECTIBLE',
]);

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceLineItemSchema = z.object({
    description: z.string(),
    amount: z.number(),
    quantity: z.number().default(1),
    metadata: z.record(z.any()).optional(),
});

export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const CreateInvoiceSchema = z.object({
    organizationId: z.string(),
    subscriptionId: z.string().optional(),
    lineItems: z.array(InvoiceLineItemSchema),
    dueDate: z.date().optional(),
    metadata: z.record(z.any()).optional(),
});

export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceSchema>;

// Payment Method Types
export const PaymentMethodTypeSchema = z.enum([
    'card',
    'bank_account',
    'sepa_debit',
    'ideal',
    'sofort',
]);

export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>;

export const PaymentMethodSchema = z.object({
    id: z.string(),
    type: PaymentMethodTypeSchema,
    card: z.object({
        brand: z.string(),
        last4: z.string(),
        expMonth: z.number(),
        expYear: z.number(),
    }).optional(),
    isDefault: z.boolean().default(false),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Webhook Types
export const WebhookEventTypeSchema = z.enum([
    'subscription.created',
    'subscription.updated',
    'subscription.deleted',
    'invoice.created',
    'invoice.paid',
    'invoice.payment_failed',
    'payment_method.attached',
    'payment_method.detached',
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

export const WebhookEventSchema = z.object({
    id: z.string(),
    type: WebhookEventTypeSchema,
    data: z.record(z.any()),
    created: z.number(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Error Types
export class BillingError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'BillingError';
    }
}

export class StripeError extends BillingError {
    constructor(message: string, public stripeCode?: string) {
        super(message, 'STRIPE_ERROR', 402);
        this.name = 'StripeError';
    }
}

export class SubscriptionError extends BillingError {
    constructor(message: string) {
        super(message, 'SUBSCRIPTION_ERROR', 400);
        this.name = 'SubscriptionError';
    }
}

export class UsageError extends BillingError {
    constructor(message: string) {
        super(message, 'USAGE_ERROR', 400);
        this.name = 'UsageError';
    }
}