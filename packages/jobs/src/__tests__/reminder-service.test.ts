import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutomatedReminderService } from '../reminder-service';
import { InMemoryJobService } from '../service';
import { ReminderConfig, ReminderType, ReminderChannel, EscalationLevel } from '../reminder-types';

// Mock services
const mockDatabaseService = {
    getSigningRequest: vi.fn(),
    getRecipient: vi.fn(),
    getDocument: vi.fn(),
    getUser: vi.fn(),
    getOrganization: vi.fn(),
    createReminderSchedule: vi.fn(),
    createReminderDelivery: vi.fn(),
    updateReminderSchedule: vi.fn(),
    getReminderTemplate: vi.fn(),
    getRecipientHistoricalPatterns: vi.fn(),
    countActiveReminders: vi.fn(),
    hasEscalated: vi.fn(),
    createReminderAnalyticsEvent: vi.fn(),
};

const mockEmailService = {
    sendEmail: vi.fn(),
};

const mockAnalyticsService = {
    getRecipientPerformanceData: vi.fn(),
    getOrganizationPerformanceData: vi.fn(),
};

describe('AutomatedReminderService', () => {
    let jobService: InMemoryJobService;
    let reminderService: AutomatedReminderService;

    beforeEach(() => {
        vi.clearAllMocks();

        jobService = new InMemoryJobService();
        reminderService = new AutomatedReminderService(
            jobService,
            mockDatabaseService,
            mockEmailService,
            undefined, // SMS service
            undefined  // Push service
        );

        // Add analytics service to reminder service
        (reminderService as any).analyticsService = mockAnalyticsService;

        // Setup default mock responses
        mockDatabaseService.getSigningRequest.mockResolvedValue({
            id: 'signing-request-1',
            documentId: 'doc-1',
            organizationId: 'org-1',
            createdBy: 'user-1',
            title: 'Test Document',
            status: 'SENT',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        mockDatabaseService.getRecipient.mockResolvedValue({
            id: 'recipient-1',
            signingRequestId: 'signing-request-1',
            email: 'test@example.com',
            name: 'Test User',
            status: 'PENDING',
        });

        mockDatabaseService.getDocument.mockResolvedValue({
            id: 'doc-1',
            name: 'Test Document.pdf',
            fields: [],
            pageCount: 1,
        });

        mockDatabaseService.getUser.mockResolvedValue({
            id: 'user-1',
            name: 'Sender User',
            email: 'sender@example.com',
            timezone: 'UTC',
        });

        mockDatabaseService.getOrganization.mockResolvedValue({
            id: 'org-1',
            name: 'Test Organization',
            timezone: 'UTC',
            businessHours: { start: 9, end: 17 },
            workDays: [1, 2, 3, 4, 5],
            branding: {},
        });

        mockDatabaseService.getRecipientHistoricalPatterns.mockResolvedValue(null);
        mockDatabaseService.countActiveReminders.mockResolvedValue(0);
        mockDatabaseService.hasEscalated.mockResolvedValue(false);
        mockDatabaseService.createReminderSchedule.mockResolvedValue('reminder-1');
        mockDatabaseService.createReminderDelivery.mockResolvedValue('delivery-1');
        mockDatabaseService.getReminderTemplate.mockResolvedValue(null);

        mockEmailService.sendEmail.mockResolvedValue({
            success: true,
            messageId: 'email-123',
            trackingId: 'track-123',
            provider: 'test',
        });

        mockAnalyticsService.getRecipientPerformanceData.mockResolvedValue(null);
        mockAnalyticsService.getOrganizationPerformanceData.mockResolvedValue({
            averageResponseRate: 0.65,
            averageResponseTime: 48,
            bestHour: 10,
            bestDay: 2,
            channelEffectiveness: {
                EMAIL: 0.65,
                SMS: 0.45,
                PUSH: 0.35,
                IN_APP: 0.25,
            },
        });
    });

    describe('scheduleReminders', () => {
        it('should schedule reminders successfully', async () => {
            const config: ReminderConfig = {
                enabled: true,
                channels: [ReminderChannel.EMAIL],
                schedule: {
                    initialDelay: 24,
                    intervals: [72, 168],
                    maxReminders: 3,
                    businessHoursOnly: true,
                    timezone: 'UTC',
                    excludeWeekends: true,
                },
                escalation: {
                    enabled: true,
                    afterReminders: 2,
                    levels: [EscalationLevel.SUPERVISOR],
                    notifyManagement: true,
                },
                personalization: {
                    useRecipientName: true,
                    includeProgress: true,
                    urgencyIndicators: true,
                },
                optimization: {
                    adaptiveScheduling: true,
                    channelOptimization: true,
                    timeOptimization: true,
                    contentOptimization: true,
                },
            };

            await jobService.start();

            const jobIds = await reminderService.scheduleReminders(
                'signing-request-1',
                'recipient-1',
                config
            );

            expect(jobIds).toHaveLength(4); // 3 reminders + 1 escalation (default schedule generates 3 reminders)
            expect(jobIds.every(id => typeof id === 'string')).toBe(true);

            await jobService.stop();
        });

        it('should handle scheduling errors gracefully', async () => {
            mockDatabaseService.getSigningRequest.mockRejectedValue(new Error('Database error'));

            const config: ReminderConfig = {
                enabled: true,
                channels: [ReminderChannel.EMAIL],
                schedule: {
                    initialDelay: 24,
                    intervals: [72],
                    maxReminders: 2,
                    businessHoursOnly: true,
                    timezone: 'UTC',
                    excludeWeekends: true,
                },
                escalation: {
                    enabled: false,
                    afterReminders: 2,
                    levels: [],
                    notifyManagement: false,
                },
                personalization: {
                    useRecipientName: true,
                    includeProgress: true,
                    urgencyIndicators: true,
                },
                optimization: {
                    adaptiveScheduling: true,
                    channelOptimization: true,
                    timeOptimization: true,
                    contentOptimization: true,
                },
            };

            await expect(
                reminderService.scheduleReminders('signing-request-1', 'recipient-1', config)
            ).rejects.toThrow('Database error');
        });
    });

    describe('reminder job processing', () => {
        it('should process schedule reminder job successfully', async () => {
            await jobService.start();

            const config: ReminderConfig = {
                enabled: true,
                channels: [ReminderChannel.EMAIL],
                schedule: {
                    initialDelay: 1, // 1 hour for testing
                    intervals: [2],
                    maxReminders: 2,
                    businessHoursOnly: false,
                    timezone: 'UTC',
                    excludeWeekends: false,
                },
                escalation: {
                    enabled: false,
                    afterReminders: 2,
                    levels: [],
                    notifyManagement: false,
                },
                personalization: {
                    useRecipientName: true,
                    includeProgress: true,
                    urgencyIndicators: true,
                },
                optimization: {
                    adaptiveScheduling: false,
                    channelOptimization: false,
                    timeOptimization: false,
                    contentOptimization: false,
                },
            };

            // Schedule a reminder
            const jobIds = await reminderService.scheduleReminders(
                'signing-request-1',
                'recipient-1',
                config
            );

            // Wait for jobs to process
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify reminder was created
            expect(mockDatabaseService.createReminderSchedule).toHaveBeenCalled();
            expect(mockEmailService.sendEmail).toHaveBeenCalled();

            const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
            expect(emailCall.to).toBe('test@example.com');
            expect(emailCall.templateName).toBe('signing-reminder');
            expect(emailCall.templateData.recipientName).toBe('Test User');
            expect(emailCall.templateData.documentTitle).toBe('Test Document.pdf');

            await jobService.stop();
        });

        it('should skip reminders for completed signing requests', async () => {
            mockDatabaseService.getSigningRequest.mockResolvedValue({
                id: 'signing-request-1',
                status: 'COMPLETED',
            });

            await jobService.start();

            const config: ReminderConfig = {
                enabled: true,
                channels: [ReminderChannel.EMAIL],
                schedule: {
                    initialDelay: 1,
                    intervals: [],
                    maxReminders: 1,
                    businessHoursOnly: false,
                    timezone: 'UTC',
                    excludeWeekends: false,
                },
                escalation: {
                    enabled: false,
                    afterReminders: 1,
                    levels: [],
                    notifyManagement: false,
                },
                personalization: {
                    useRecipientName: true,
                    includeProgress: true,
                    urgencyIndicators: true,
                },
                optimization: {
                    adaptiveScheduling: false,
                    channelOptimization: false,
                    timeOptimization: false,
                    contentOptimization: false,
                },
            };

            await reminderService.scheduleReminders('signing-request-1', 'recipient-1', config);

            // Wait for jobs to process
            await new Promise(resolve => setTimeout(resolve, 200));

            // Should not send email for completed request
            expect(mockEmailService.sendEmail).not.toHaveBeenCalled();

            await jobService.stop();
        });
    });

    describe('multi-channel delivery', () => {
        it('should handle email delivery failure gracefully', async () => {
            mockEmailService.sendEmail.mockResolvedValue({
                success: false,
                error: 'Email delivery failed',
            });

            await jobService.start();

            const config: ReminderConfig = {
                enabled: true,
                channels: [ReminderChannel.EMAIL],
                schedule: {
                    initialDelay: 1,
                    intervals: [],
                    maxReminders: 1,
                    businessHoursOnly: false,
                    timezone: 'UTC',
                    excludeWeekends: false,
                },
                escalation: {
                    enabled: false,
                    afterReminders: 1,
                    levels: [],
                    notifyManagement: false,
                },
                personalization: {
                    useRecipientName: true,
                    includeProgress: true,
                    urgencyIndicators: true,
                },
                optimization: {
                    adaptiveScheduling: false,
                    channelOptimization: false,
                    timeOptimization: false,
                    contentOptimization: false,
                },
            };

            await reminderService.scheduleReminders('signing-request-1', 'recipient-1', config);

            // Wait for jobs to process
            await new Promise(resolve => setTimeout(resolve, 200));

            // Should record failed delivery
            expect(mockDatabaseService.createReminderDelivery).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    errorMessage: 'Email delivery failed',
                })
            );

            await jobService.stop();
        });
    });
});