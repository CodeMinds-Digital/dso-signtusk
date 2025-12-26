import { vi } from 'vitest';

// Mock external dependencies
vi.mock('twilio', () => ({
    Twilio: vi.fn().mockImplementation(() => ({
        messages: {
            create: vi.fn().mockResolvedValue({
                sid: 'test-message-id',
                status: 'sent',
                direction: 'outbound-api',
                dateCreated: new Date(),
                price: '0.0075',
                priceUnit: 'USD'
            })
        }
    }))
}));

vi.mock('firebase-admin', () => ({
    initializeApp: vi.fn(),
    credential: {
        cert: vi.fn()
    },
    messaging: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({
            name: 'projects/test-project/messages/test-message-id'
        }),
        subscribeToTopic: vi.fn().mockResolvedValue({}),
        unsubscribeFromTopic: vi.fn().mockResolvedValue({})
    })
}));

vi.mock('web-push', () => ({
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({
        statusCode: 201,
        headers: {}
    })
}));

vi.mock('node-cron', () => ({
    schedule: vi.fn().mockReturnValue({
        stop: vi.fn(),
        destroy: vi.fn()
    }),
    validate: vi.fn().mockReturnValue(true)
}));

vi.mock('handlebars', () => ({
    create: vi.fn().mockReturnValue({
        compile: vi.fn().mockReturnValue((data: any) => `Rendered: ${JSON.stringify(data)}`),
        registerHelper: vi.fn(),
        registerPartial: vi.fn(),
        escapeExpression: vi.fn().mockImplementation((str: string) => str)
    })
}));

// Global test utilities
global.testUtils = {
    createMockLogger: () => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnThis()
    }),

    createMockNotificationConfig: (overrides = {}) => ({
        id: 'test-notification-id',
        userId: 'test-user-id',
        organizationId: 'test-org-id',
        channel: 'email',
        priority: 'normal',
        templateId: 'test-template-id',
        templateData: {
            title: 'Test Notification',
            message: 'This is a test notification'
        },
        recipient: {
            email: 'test@example.com',
            phone: '+1234567890',
            pushToken: 'test-push-token',
            userId: 'test-user-id',
            name: 'Test User'
        },
        metadata: {},
        ...overrides
    }),

    createMockEmailTemplate: (overrides = {}) => ({
        id: 'test-template-id',
        name: 'Test Template',
        description: 'A test email template',
        engine: 'handlebars',
        subject: 'Test Subject: {{title}}',
        htmlTemplate: '<h1>{{title}}</h1><p>{{message}}</p>',
        textTemplate: '{{title}}\n\n{{message}}',
        variables: [
            { name: 'title', type: 'string', required: true },
            { name: 'message', type: 'string', required: true }
        ],
        styles: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    })
};

declare global {
    var testUtils: {
        createMockLogger: () => any;
        createMockNotificationConfig: (overrides?: any) => any;
        createMockEmailTemplate: (overrides?: any) => any;
    };
}