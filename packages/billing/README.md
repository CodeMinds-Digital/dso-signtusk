# @signtusk/billing

Comprehensive billing and subscription management package for the Signtusk platform.

## Features

- **Stripe Integration**: Complete Stripe API integration for payment processing
- **Subscription Management**: Create, update, and cancel subscriptions with plan upgrades/downgrades
- **Usage Tracking**: Accurate metered billing and usage recording
- **Payment Methods**: Manage customer payment methods and default settings
- **Invoice Generation**: Automated billing processes and invoice generation
- **Webhook Handling**: Process Stripe webhooks for real-time updates
- **Error Handling**: Comprehensive error handling with custom error types

## Installation

```bash
npm install @signtusk/billing
```

## Usage

### Basic Setup

```typescript
import { BillingService, StripeService } from '@signtusk/billing';
import { PrismaClient } from '@signtusk/database';

// Initialize Stripe service
const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
});

// Initialize billing service
const billingService = new BillingService({
  stripe: stripeService,
  database: new PrismaClient(),
});
```

### Subscription Management

```typescript
// Create a subscription
const subscription = await billingService.createSubscription({
  organizationId: 'org_123',
  planId: 'price_1234567890',
  paymentMethodId: 'pm_1234567890',
  trialDays: 14,
});

// Update a subscription
const updatedSubscription = await billingService.updateSubscription('sub_123', {
  planId: 'price_0987654321',
  cancelAtPeriodEnd: false,
});

// Cancel a subscription
const canceledSubscription = await billingService.cancelSubscription('sub_123');
```

### Usage Tracking

```typescript
// Record usage
const usageRecord = await billingService.recordUsage({
  subscriptionId: 'sub_123',
  metric: 'documents_signed',
  quantity: 5,
  timestamp: new Date(),
});

// Get usage summary
const summary = await billingService.getUsageSummary('sub_123', 'documents_signed');
console.log(`Total usage: ${summary.total}, Current period: ${summary.current_period}`);
```

### Payment Methods

```typescript
// Attach a payment method
const paymentMethod = await billingService.attachPaymentMethod('org_123', 'pm_1234567890');

// Set default payment method
await billingService.setDefaultPaymentMethod('org_123', 'pm_1234567890');

// Get payment methods
const paymentMethods = await billingService.getPaymentMethods('org_123');
```

### Invoice Management

```typescript
// Create an invoice
const invoiceId = await billingService.createInvoice({
  organizationId: 'org_123',
  lineItems: [
    {
      description: 'Additional document processing',
      amount: 29.99,
      quantity: 1,
    },
  ],
});

// Get invoices
const invoices = await billingService.getInvoices('org_123');
```

### Webhook Handling

```typescript
// Handle Stripe webhooks
app.post('/webhooks/stripe', async (req, res) => {
  try {
    const event = stripeService.constructWebhookEvent(
      req.body,
      req.headers['stripe-signature']
    );
    
    await billingService.handleWebhook(event);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});
```

## Error Handling

The package provides custom error types for better error handling:

```typescript
import { BillingError, StripeError, SubscriptionError, UsageError } from '@signtusk/billing';

try {
  await billingService.createSubscription(request);
} catch (error) {
  if (error instanceof SubscriptionError) {
    console.error('Subscription error:', error.message);
  } else if (error instanceof StripeError) {
    console.error('Stripe error:', error.message, error.stripeCode);
  } else if (error instanceof BillingError) {
    console.error('Billing error:', error.message, error.code);
  }
}
```

## Types

The package exports comprehensive TypeScript types:

- `BillingPlan` - Billing plan configuration
- `CreateSubscriptionRequest` - Subscription creation parameters
- `UpdateSubscriptionRequest` - Subscription update parameters
- `RecordUsageRequest` - Usage recording parameters
- `CreateInvoiceRequest` - Invoice creation parameters
- `PaymentMethod` - Payment method information
- `WebhookEvent` - Stripe webhook event data

## Configuration

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Configuration

```typescript
const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  apiVersion: '2023-10-16', // Optional, defaults to latest
});
```

## Testing

The package includes comprehensive property-based tests to ensure billing integration accuracy:

```bash
npm test
```

## License

MIT