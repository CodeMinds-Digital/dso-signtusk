# @signtusk/notifications

Advanced notification system with SMS, push notifications, email template customization, intelligent scheduling, and comprehensive analytics.

## Features

### Multi-Channel Notifications
- **SMS**: Twilio, AWS SNS, Vonage support with delivery tracking
- **Push Notifications**: Firebase FCM, APNS, Web Push with topic subscriptions
- **Email**: Customizable templates with drag-and-drop builder
- **In-App**: Real-time in-app notifications
- **Webhooks**: Event-driven webhook notifications

### Email Template Customization
- **Multiple Template Engines**: Handlebars, React Email, Mustache
- **Drag-and-Drop Builder**: Visual template editor with components
- **Custom Styling**: Brand colors, fonts, and layouts
- **Variable Support**: Dynamic content with type validation
- **Preview & Testing**: Real-time template preview

### Intelligent Scheduling
- **Cron-Based Scheduling**: Flexible scheduling with cron expressions
- **One-Time & Recurring**: Support for both one-time and recurring notifications
- **Timezone Support**: Schedule notifications in any timezone
- **Max Runs & Expiration**: Automatic schedule management
- **Pause & Resume**: Control over active schedules

### Communication Analytics
- **Engagement Tracking**: Open rates, click rates, delivery rates
- **Template Performance**: Per-template analytics and optimization
- **Channel Analytics**: Compare performance across channels
- **User Engagement**: Track individual user engagement
- **Recommendations**: AI-powered optimization suggestions

## Installation

```bash
npm install @signtusk/notifications
```

## Quick Start

```typescript
import { createNotificationService, NotificationChannel, SMSProvider, PushProvider } from '@signtusk/notifications';
import pino from 'pino';

const logger = pino();

// Initialize notification service
const notificationService = createNotificationService({
    smsConfigs: [
        {
            provider: SMSProvider.TWILIO,
            config: {
                provider: SMSProvider.TWILIO,
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN,
                fromNumber: process.env.TWILIO_FROM_NUMBER
            }
        }
    ],
    pushConfigs: [
        {
            provider: PushProvider.FIREBASE,
            config: {
                provider: PushProvider.FIREBASE,
                serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
                projectId: process.env.FIREBASE_PROJECT_ID
            }
        }
    ],
    logger
});

// Send SMS notification
await notificationService.send({
    id: 'notification-1',
    userId: 'user-123',
    channel: NotificationChannel.SMS,
    priority: 'high',
    templateId: 'welcome-sms',
    templateData: {
        name: 'John Doe',
        message: 'Welcome to our platform!'
    },
    recipient: {
        phone: '+1234567890'
    }
});

// Send push notification
await notificationService.send({
    id: 'notification-2',
    userId: 'user-123',
    channel: NotificationChannel.PUSH,
    priority: 'normal',
    templateId: 'document-signed',
    templateData: {
        title: 'Document Signed',
        body: 'Your document has been signed successfully',
        data: {
            documentId: 'doc-456'
        }
    },
    recipient: {
        pushToken: 'user-push-token'
    }
});
```

## Email Template Customization

```typescript
import { EmailTemplateServiceImpl, TemplateEngine } from '@signtusk/notifications';

const templateService = new EmailTemplateServiceImpl(logger);

// Create custom email template
const templateId = await templateService.createTemplate({
    id: 'welcome-email',
    name: 'Welcome Email',
    description: 'Welcome email for new users',
    engine: TemplateEngine.HANDLEBARS,
    subject: 'Welcome to {{companyName}}!',
    htmlTemplate: `
        <div style="{{styles.css.font}}">
            <h1 style="{{styles.css.primary}}">Welcome {{userName}}!</h1>
            <p>Thank you for joining {{companyName}}.</p>
            <a href="{{actionUrl}}" style="{{styles.css.button}}">Get Started</a>
        </div>
    `,
    textTemplate: 'Welcome {{userName}}! Thank you for joining {{companyName}}.',
    variables: [
        { name: 'userName', type: 'string', required: true },
        { name: 'companyName', type: 'string', required: true },
        { name: 'actionUrl', type: 'string', required: true }
    ],
    styles: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Render template
const rendered = await templateService.renderTemplate(templateId, {
    userName: 'John Doe',
    companyName: 'Acme Corp',
    actionUrl: 'https://example.com/get-started'
});

console.log(rendered.html);
console.log(rendered.subject);
```

## Notification Scheduling

```typescript
import { NotificationSchedulerImpl } from '@signtusk/notifications';

const scheduler = new NotificationSchedulerImpl(notificationService, logger);

// Schedule daily reminder at 9 AM
const scheduleId = await scheduler.schedule({
    id: 'daily-reminder',
    name: 'Daily Reminder',
    description: 'Send daily reminder to users',
    cronExpression: '0 9 * * *', // Every day at 9 AM
    timezone: 'America/New_York',
    isActive: true,
    notificationTemplate: {
        userId: 'user-123',
        channel: NotificationChannel.EMAIL,
        priority: 'normal',
        templateId: 'daily-reminder',
        templateData: {
            title: 'Daily Reminder',
            message: 'Don\'t forget to check your pending documents!'
        },
        recipient: {
            email: 'user@example.com'
        }
    },
    runCount: 0,
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
});

// Pause schedule
await scheduler.pauseSchedule(scheduleId);

// Resume schedule
await scheduler.resumeSchedule(scheduleId);

// Get scheduler stats
const stats = scheduler.getSchedulerStats();
console.log(stats);
```

## Analytics & Reporting

```typescript
import { AnalyticsServiceImpl } from '@signtusk/notifications';

const analytics = new AnalyticsServiceImpl(logger);

// Track notification event
await analytics.trackEvent({
    id: 'event-1',
    organizationId: 'org-123',
    userId: 'user-123',
    channel: NotificationChannel.EMAIL,
    templateId: 'welcome-email',
    eventType: 'opened',
    timestamp: new Date(),
    metadata: {
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1'
    }
});

// Get engagement metrics
const metrics = await analytics.getEngagementMetrics({
    organizationId: 'org-123',
    timeRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
    }
});

console.log('Delivery Rate:', metrics.deliveryRate);
console.log('Open Rate:', metrics.openRate);
console.log('Click Rate:', metrics.clickRate);
console.log('Engagement Score:', metrics.engagementScore);

// Generate comprehensive report
const report = await analytics.generateReport({
    organizationId: 'org-123',
    timeRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
    },
    groupBy: 'day'
});

console.log('Summary:', report.summary);
console.log('Channel Breakdown:', report.channelBreakdown);
console.log('Top Templates:', report.topPerformingTemplates);
console.log('Recommendations:', report.recommendations);
```

## Advanced Features

### Bulk Notifications

```typescript
const configs = [
    {
        id: 'notification-1',
        userId: 'user-1',
        channel: NotificationChannel.EMAIL,
        // ... other config
    },
    {
        id: 'notification-2',
        userId: 'user-2',
        channel: NotificationChannel.SMS,
        // ... other config
    }
];

const results = await notificationService.bulkSend(configs);
console.log(`Sent ${results.length} notifications`);
```

### Health Monitoring

```typescript
const health = await notificationService.getHealthStatus();
console.log('Overall Health:', health.overall);
console.log('Service Status:', health.services);
```

### Service Statistics

```typescript
const stats = notificationService.getServiceStats();
console.log('SMS Stats:', stats.sms);
console.log('Push Stats:', stats.push);
console.log('Scheduler Stats:', stats.scheduler);
```

## Configuration

### Environment Variables

```env
# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Firebase Push
FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_key
FIREBASE_PROJECT_ID=your_project_id

# Web Push
WEB_PUSH_VAPID_PUBLIC_KEY=your_public_key
WEB_PUSH_VAPID_PRIVATE_KEY=your_private_key
WEB_PUSH_VAPID_SUBJECT=mailto:your@email.com

# APNS
APNS_KEY=your_apns_key
APNS_KEY_ID=your_key_id
APNS_TEAM_ID=your_team_id
APNS_BUNDLE_ID=your_bundle_id
```

## API Reference

See [API Documentation](./docs/API.md) for complete API reference.

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.