import {
    NotificationScheduler,
    NotificationSchedule,
    NotificationService,
    SchedulingError
} from '../types';
import { Logger } from 'pino';
import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

/**
 * Notification Scheduler Implementation
 * Provides intelligent notification scheduling and automation with cron-based timing
 */
export class NotificationSchedulerImpl implements NotificationScheduler {
    private schedules: Map<string, NotificationSchedule> = new Map();
    private cronJobs: Map<string, cron.ScheduledTask> = new Map();
    private notificationService: NotificationService;
    private logger: Logger;

    constructor(notificationService: NotificationService, logger: Logger) {
        this.notificationService = notificationService;
        this.logger = logger.child({ service: 'notification-scheduler' });

        this.logger.info('Notification scheduler initialized');
    }

    async schedule(schedule: NotificationSchedule): Promise<string> {
        try {
            // Validate schedule
            this.validateSchedule(schedule);

            // Generate ID if not provided
            const scheduleId = schedule.id || uuidv4();
            const scheduleWithId = { ...schedule, id: scheduleId };

            // Calculate next run time
            if (schedule.cronExpression) {
                scheduleWithId.nextRun = this.calculateNextRun(schedule.cronExpression, schedule.timezone);
            } else if (schedule.startDate) {
                scheduleWithId.nextRun = schedule.startDate;
            }

            // Store schedule
            this.schedules.set(scheduleId, scheduleWithId);

            // Create cron job if active
            if (schedule.isActive) {
                await this.createCronJob(scheduleWithId);
            }

            this.logger.info({
                scheduleId,
                name: schedule.name,
                cronExpression: schedule.cronExpression,
                nextRun: scheduleWithId.nextRun
            }, 'Notification schedule created');

            return scheduleId;

        } catch (error) {
            this.logger.error({ error, scheduleName: schedule.name }, 'Failed to create notification schedule');
            throw new SchedulingError(`Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateSchedule(id: string, schedule: Partial<NotificationSchedule>): Promise<boolean> {
        try {
            const existingSchedule = this.schedules.get(id);
            if (!existingSchedule) {
                throw new SchedulingError(`Schedule with ID ${id} not found`);
            }

            const updatedSchedule = {
                ...existingSchedule,
                ...schedule,
                id,
                updatedAt: new Date()
            };

            // Validate updated schedule
            this.validateSchedule(updatedSchedule);

            // Recalculate next run time if cron expression changed
            if (schedule.cronExpression || schedule.timezone) {
                updatedSchedule.nextRun = this.calculateNextRun(
                    updatedSchedule.cronExpression!,
                    updatedSchedule.timezone
                );
            }

            // Update schedule
            this.schedules.set(id, updatedSchedule);

            // Recreate cron job
            await this.deleteCronJob(id);
            if (updatedSchedule.isActive) {
                await this.createCronJob(updatedSchedule);
            }

            this.logger.info({
                scheduleId: id,
                name: updatedSchedule.name
            }, 'Notification schedule updated');

            return true;

        } catch (error) {
            this.logger.error({ error, scheduleId: id }, 'Failed to update notification schedule');
            throw new SchedulingError(`Failed to update schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async deleteSchedule(id: string): Promise<boolean> {
        try {
            const schedule = this.schedules.get(id);
            if (!schedule) {
                return false;
            }

            // Delete cron job
            await this.deleteCronJob(id);

            // Remove schedule
            this.schedules.delete(id);

            this.logger.info({
                scheduleId: id,
                name: schedule.name
            }, 'Notification schedule deleted');

            return true;

        } catch (error) {
            this.logger.error({ error, scheduleId: id }, 'Failed to delete notification schedule');
            throw new SchedulingError(`Failed to delete schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getSchedule(id: string): Promise<NotificationSchedule | null> {
        try {
            const schedule = this.schedules.get(id);
            return schedule || null;
        } catch (error) {
            this.logger.error({ error, scheduleId: id }, 'Failed to get notification schedule');
            return null;
        }
    }

    async listSchedules(organizationId?: string): Promise<NotificationSchedule[]> {
        try {
            const schedules = Array.from(this.schedules.values());

            if (organizationId) {
                return schedules.filter(s => s.organizationId === organizationId);
            }

            return schedules;
        } catch (error) {
            this.logger.error({ error, organizationId }, 'Failed to list notification schedules');
            throw new SchedulingError(`Failed to list schedules: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async pauseSchedule(id: string): Promise<boolean> {
        try {
            const schedule = this.schedules.get(id);
            if (!schedule) {
                throw new SchedulingError(`Schedule with ID ${id} not found`);
            }

            // Update schedule to inactive
            schedule.isActive = false;
            schedule.updatedAt = new Date();

            // Stop cron job
            await this.deleteCronJob(id);

            this.logger.info({ scheduleId: id, name: schedule.name }, 'Notification schedule paused');
            return true;

        } catch (error) {
            this.logger.error({ error, scheduleId: id }, 'Failed to pause notification schedule');
            throw new SchedulingError(`Failed to pause schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async resumeSchedule(id: string): Promise<boolean> {
        try {
            const schedule = this.schedules.get(id);
            if (!schedule) {
                throw new SchedulingError(`Schedule with ID ${id} not found`);
            }

            // Update schedule to active
            schedule.isActive = true;
            schedule.updatedAt = new Date();

            // Recalculate next run time
            if (schedule.cronExpression) {
                schedule.nextRun = this.calculateNextRun(schedule.cronExpression, schedule.timezone);
            }

            // Create cron job
            await this.createCronJob(schedule);

            this.logger.info({ scheduleId: id, name: schedule.name }, 'Notification schedule resumed');
            return true;

        } catch (error) {
            this.logger.error({ error, scheduleId: id }, 'Failed to resume notification schedule');
            throw new SchedulingError(`Failed to resume schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private validateSchedule(schedule: NotificationSchedule): void {
        if (!schedule.name || schedule.name.trim().length === 0) {
            throw new SchedulingError('Schedule name is required');
        }

        if (!schedule.cronExpression && !schedule.startDate) {
            throw new SchedulingError('Either cron expression or start date is required');
        }

        if (schedule.cronExpression && !cron.validate(schedule.cronExpression)) {
            throw new SchedulingError(`Invalid cron expression: ${schedule.cronExpression}`);
        }

        if (schedule.startDate && schedule.endDate && schedule.startDate >= schedule.endDate) {
            throw new SchedulingError('Start date must be before end date');
        }

        if (schedule.maxRuns && schedule.maxRuns <= 0) {
            throw new SchedulingError('Max runs must be greater than 0');
        }

        if (!schedule.notificationTemplate) {
            throw new SchedulingError('Notification template is required');
        }
    }

    private async createCronJob(schedule: NotificationSchedule): Promise<void> {
        if (!schedule.cronExpression) {
            // For one-time schedules, use setTimeout
            if (schedule.startDate) {
                const delay = schedule.startDate.getTime() - Date.now();
                if (delay > 0) {
                    setTimeout(() => {
                        this.executeSchedule(schedule.id);
                    }, delay);
                }
            }
            return;
        }

        try {
            const task = cron.schedule(
                schedule.cronExpression,
                () => {
                    this.executeSchedule(schedule.id);
                },
                {
                    scheduled: true,
                    timezone: schedule.timezone || 'UTC'
                }
            );

            this.cronJobs.set(schedule.id, task);

            this.logger.debug({
                scheduleId: schedule.id,
                cronExpression: schedule.cronExpression,
                timezone: schedule.timezone
            }, 'Cron job created');

        } catch (error) {
            this.logger.error({ error, scheduleId: schedule.id }, 'Failed to create cron job');
            throw new SchedulingError(`Failed to create cron job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async deleteCronJob(scheduleId: string): Promise<void> {
        const task = this.cronJobs.get(scheduleId);
        if (task) {
            task.stop();
            this.cronJobs.delete(scheduleId);

            this.logger.debug({ scheduleId }, 'Cron job deleted');
        }
    }

    private async executeSchedule(scheduleId: string): Promise<void> {
        try {
            const schedule = this.schedules.get(scheduleId);
            if (!schedule || !schedule.isActive) {
                return;
            }

            this.logger.info({
                scheduleId,
                name: schedule.name
            }, 'Executing scheduled notification');

            // Check if schedule has expired
            if (schedule.endDate && new Date() > schedule.endDate) {
                this.logger.info({ scheduleId }, 'Schedule expired, deactivating');
                schedule.isActive = false;
                await this.deleteCronJob(scheduleId);
                return;
            }

            // Check if max runs reached
            if (schedule.maxRuns && schedule.runCount >= schedule.maxRuns) {
                this.logger.info({ scheduleId }, 'Max runs reached, deactivating');
                schedule.isActive = false;
                await this.deleteCronJob(scheduleId);
                return;
            }

            // Execute notification
            const notificationConfig = {
                ...schedule.notificationTemplate,
                id: uuidv4(),
                scheduledAt: new Date()
            };

            await this.notificationService.send(notificationConfig);

            // Update schedule stats
            schedule.runCount++;
            schedule.lastRun = new Date();
            if (schedule.cronExpression) {
                schedule.nextRun = this.calculateNextRun(schedule.cronExpression, schedule.timezone);
            }
            schedule.updatedAt = new Date();

            this.logger.info({
                scheduleId,
                runCount: schedule.runCount,
                nextRun: schedule.nextRun
            }, 'Scheduled notification executed successfully');

        } catch (error) {
            this.logger.error({ error, scheduleId }, 'Failed to execute scheduled notification');

            // Update schedule with error info
            const schedule = this.schedules.get(scheduleId);
            if (schedule) {
                schedule.updatedAt = new Date();
                // Could add error tracking here
            }
        }
    }

    private calculateNextRun(cronExpression: string, timezone: string = 'UTC'): Date {
        try {
            // This is a simplified implementation
            // In production, use a proper cron parser library like 'cron-parser'
            const now = new Date();
            const nextRun = new Date(now.getTime() + 60000); // Add 1 minute as stub
            return nextRun;
        } catch (error) {
            throw new SchedulingError(`Failed to calculate next run: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get scheduler statistics
     */
    getSchedulerStats(): {
        totalSchedules: number;
        activeSchedules: number;
        pausedSchedules: number;
        totalExecutions: number;
        upcomingExecutions: Array<{ scheduleId: string; name: string; nextRun: Date }>;
    } {
        const schedules = Array.from(this.schedules.values());
        const activeSchedules = schedules.filter(s => s.isActive);
        const pausedSchedules = schedules.filter(s => !s.isActive);
        const totalExecutions = schedules.reduce((sum, s) => sum + s.runCount, 0);

        const upcomingExecutions = activeSchedules
            .filter(s => s.nextRun)
            .map(s => ({
                scheduleId: s.id,
                name: s.name,
                nextRun: s.nextRun!
            }))
            .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
            .slice(0, 10); // Top 10 upcoming

        return {
            totalSchedules: schedules.length,
            activeSchedules: activeSchedules.length,
            pausedSchedules: pausedSchedules.length,
            totalExecutions,
            upcomingExecutions
        };
    }

    /**
     * Cleanup expired schedules
     */
    async cleanupExpiredSchedules(): Promise<number> {
        let cleanedCount = 0;
        const now = new Date();

        for (const [id, schedule] of this.schedules) {
            if (schedule.endDate && now > schedule.endDate) {
                await this.deleteSchedule(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.info({ cleanedCount }, 'Cleaned up expired schedules');
        }

        return cleanedCount;
    }

    /**
     * Bulk schedule operations
     */
    async bulkSchedule(schedules: NotificationSchedule[]): Promise<string[]> {
        const results: string[] = [];

        for (const schedule of schedules) {
            try {
                const id = await this.schedule(schedule);
                results.push(id);
            } catch (error) {
                this.logger.error({ error, scheduleName: schedule.name }, 'Failed to create schedule in bulk operation');
                // Continue with other schedules
            }
        }

        this.logger.info({
            total: schedules.length,
            successful: results.length,
            failed: schedules.length - results.length
        }, 'Bulk schedule operation completed');

        return results;
    }
}