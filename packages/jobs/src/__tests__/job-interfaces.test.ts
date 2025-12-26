import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryJobService } from '../service';
import { JobHandler, JobContext, JobResult, JobPayload } from '../types';

describe('Job Interface Compatibility', () => {
    let jobService: InMemoryJobService;

    beforeEach(() => {
        jobService = new InMemoryJobService();
    });

    it('should handle job handlers with correct JobResult return types', async () => {
        // Define a simple job handler that returns JobResult
        const testHandler: JobHandler<{ message: string }> = async (
            payload: { message: string },
            context: JobContext
        ): Promise<JobResult> => {
            if (payload.message === 'success') {
                return {
                    success: true,
                    data: { processed: payload.message }
                };
            } else {
                return {
                    success: false,
                    error: 'Invalid message'
                };
            }
        };

        // Define the job
        jobService.defineJob({
            name: 'test-job',
            handler: testHandler,
            config: {
                maxRetries: 1,
                retryDelay: 100
            }
        });

        await jobService.start();

        // Test successful job
        const successJobId = await jobService.enqueue('test-job', { message: 'success' });
        expect(successJobId).toBeDefined();

        // Wait for job processing
        await new Promise(resolve => setTimeout(resolve, 150));

        const successStatus = await jobService.getJobStatus(successJobId);
        expect(successStatus?.status).toBe('completed');
        expect(successStatus?.result).toEqual({ processed: 'success' });

        // Test failing job
        const failJobId = await jobService.enqueue('test-job', { message: 'fail' });
        expect(failJobId).toBeDefined();

        // Wait for job processing
        await new Promise(resolve => setTimeout(resolve, 150));

        const failStatus = await jobService.getJobStatus(failJobId);
        expect(failStatus?.status).toBe('failed');
        expect(failStatus?.error).toBe('Invalid message');

        await jobService.stop();
    });

    it('should handle job queue service types correctly', async () => {
        const mockHandler = vi.fn().mockResolvedValue({ success: true, data: 'test' });

        jobService.defineJob({
            name: 'queue-test',
            handler: mockHandler,
            config: {
                maxRetries: 2,
                retryDelay: 50
            }
        });

        await jobService.start();

        // Test enqueue method
        const jobId = await jobService.enqueue('queue-test', { test: 'data' });
        expect(typeof jobId).toBe('string');

        // Test scheduleJob method
        const scheduledJobId = await jobService.scheduleJob(
            'queue-test',
            { test: 'scheduled' },
            new Date(Date.now() + 1000)
        );
        expect(typeof scheduledJobId).toBe('string');

        // Test getJobStatus method
        const status = await jobService.getJobStatus(jobId);
        expect(status).toBeDefined();
        expect(status?.id).toBe(jobId);

        // Test cancelJob method
        const cancelled = await jobService.cancelJob(scheduledJobId);
        expect(typeof cancelled).toBe('boolean');

        await jobService.stop();
    });

    it('should handle background job processing correctly', async () => {
        let processedCount = 0;

        const backgroundHandler: JobHandler = async (payload: JobPayload, context: JobContext): Promise<JobResult> => {
            processedCount++;
            return {
                success: true,
                data: {
                    attempt: context.attempt,
                    runId: context.runId,
                    processed: processedCount
                }
            };
        };

        jobService.defineJob({
            name: 'background-job',
            handler: backgroundHandler,
            config: {
                maxRetries: 1,
                retryDelay: 50
            }
        });

        await jobService.start();

        // Enqueue multiple jobs
        const jobIds = await Promise.all([
            jobService.enqueue('background-job', { id: 1 }),
            jobService.enqueue('background-job', { id: 2 }),
            jobService.enqueue('background-job', { id: 3 })
        ]);

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check all jobs were processed
        const statuses = await Promise.all(
            jobIds.map(id => jobService.getJobStatus(id))
        );

        statuses.forEach(status => {
            expect(status?.status).toBe('completed');
            expect(status?.result).toBeDefined();
            expect(status?.result.attempt).toBe(1);
            expect(status?.result.runId).toBeDefined();
        });

        expect(processedCount).toBe(3);

        await jobService.stop();
    });
});