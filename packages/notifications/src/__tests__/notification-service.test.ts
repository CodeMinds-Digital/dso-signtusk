import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationServiceImpl } from '../notification-service';
import { SMSServiceImpl } from '../sms/sms-service';
import { PushNotificationServiceImpl } from '../push/push-service';
import { NotificationChannel, NotificationStatus, SMSProvider, PushProvider } from '../types';

describe('NotificationServiceImpl', () => {
    let notificationService: NotificationServiceImpl;
    let mockLogger: any;
    let mockSMSService: SMSServiceImpl;
    let mockPushService: PushNotificationServiceImpl;

    beforeEach(() => {
        mockLogger = global.testUtils.createMockLogger();

        // Create mock SMS service
        mockSMSService = new SMSServiceImpl([
            {
                provider: SMSProvider.TWILIO,
                config: {
                    provider: SMSProvider.TWILIO,
                    accountSid: 'test-sid',
                    authToken: 'test-token',
                    fromNumber: '+1234567890'
                }
            }
        ], mockLogger);

        // Create mock push service
        mockPushService = new PushNotificationServiceImpl([
            {
                provider: PushProvider.FIREBASE,
                config: {
                    provider: PushProvider.FIREBASE,
                    serviceAccountKey: 'test-key',
                    projectId: 'test-project'
                }
            }
        ], mockLogger);

        notificationService = new NotificationServiceImpl({
            smsService: mockSMSService,
            pushService: mockPushService
        }, mockLogger);
    });

    describe('send', () => {
        it('should send SMS notification successfully', async () => {
            const config = global.testUtils.createMockNotificationConfig({
                channel: NotificationChannel.SMS,
                recipient: {
                    phone: '+1234567890'
                },
                templateData: {
                    message: 'Test SMS message'
                }
            });

            const result = await notificationService.send(config);

            expect(result).toBeDefined();
            expect(result.channel).toBe(NotificationChannel.SMS);
            expect(result.status).toBe(NotificationStatus.SENT);
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    notificationId: config.id,
                    channel: config.channel
                }),
                'Sending notification'
            );
        });

        it('should send push notification successfully', async () => {
            const config = global.testUtils.createMockNotificationConfig({
                channel: NotificationChannel.PUSH,
                recipient: {
                    pushToken: 'test-push-token'
                },
                templateData: {
                    title: 'Test Push',
                    body: 'Test push message'
                }
            });

            const result = await notificationService.send(config);

            expect(result).toBeDefined();
            expect(result.channel).toBe(NotificationChannel.PUSH);
            expect(result.status).toBe(NotificationStatus.SENT);
        });

        it('should send email notification successfully', async () => {
            const config = global.testUtils.createMockNotificationConfig({
                channel: NotificationChannel.EMAIL,
                recipient: {
                    email: 'test@example.com'
                },
                templateData: {
                    subject: 'Test Email',
                    html: '<p>Test email content</p>'
                }
            });

            const result = await notificationService.send(config);

            expect(result).toBeDefined();
            expect(result.channel).toBe(NotificationChannel.EMAIL);
            expect(result.status).toBe(NotificationStatus.SENT);
        });

        it('should throw error for invalid channel', async () => {
            const config = global.testUtils.createMockNotificationConfig({
                channel: 'invalid-channel' as any
            });

            await expect(notificationService.send(config)).rejects.toThrow('Unsupported notification channel');
        });

        it('should throw error for missing recipient information', async () => {
            const config = global.testUtils.createMockNotificationConfig({
                channel: NotificationChannel.SMS,
                recipient: {} // Missing phone number
            });

            await expect(notificationService.send(config)).rejects.toThrow('Phone number is required');
        });
    });

    describe('schedule', () => {
        it('should schedule notification successfully', async () => {
            const schedule = {
                id: 'test-schedule-id',
                name: 'Test Schedule',
                cronExpression: '0 9 * * *',
                timezone: 'UTC',
                isActive: true,
                notificationTemplate: global.testUtils.createMockNotificationConfig(),
                runCount: 0,
                createdBy: 'test-user',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const scheduleId = await notificationService.schedule(schedule);

            expect(scheduleId).toBe(schedule.id);
        });
    });

    describe('getHealthStatus', () => {
        it('should return health status for all services', async () => {
            const health = await notificationService.getHealthStatus();

            expect(health).toBeDefined();
            expect(health.overall).toMatch(/healthy|degraded|unhealthy/);
            expect(health.services).toBeDefined();
            expect(health.lastCheck).toBeInstanceOf(Date);
        });
    });

    describe('bulkSend', () => {
        it('should send multiple notifications', async () => {
            const configs = [
                global.testUtils.createMockNotificationConfig({
                    id: 'notification-1',
                    channel: NotificationChannel.EMAIL
                }),
                global.testUtils.createMockNotificationConfig({
                    id: 'notification-2',
                    channel: NotificationChannel.SMS,
                    recipient: { phone: '+1234567890' }
                })
            ];

            const results = await notificationService.bulkSend(configs);

            expect(results).toHaveLength(2);
            expect(results[0].notificationId).toBe('notification-1');
            expect(results[1].notificationId).toBe('notification-2');
        });
    });

    describe('validation', () => {
        it('should validate notification config', async () => {
            const invalidConfig = {
                // Missing required fields
                channel: NotificationChannel.EMAIL,
                recipient: {}
            } as any;

            await expect(notificationService.send(invalidConfig)).rejects.toThrow('Notification ID is required');
        });
    });
});