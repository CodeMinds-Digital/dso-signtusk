import { Inngest } from 'inngest';
import { generateId } from '@signtusk/lib';
import {
    JobService,
    JobDefinition,
    JobPayload,
    JobConfig,
    JobStatus,
    JobConfigSchema,
    JobContext,
    JobResult,
} from './types';

export class InngestJobService implements JobService {
    private inngest: Inngest;
    private jobs: Map<string, JobDefinition<any>> = new Map();
    private jobStatuses: Map<string, JobStatus> = new Map();

    constructor(appId: string = 'docusign-alternative') {
        this.inngest = new Inngest({ id: appId });
    }

    defineJob<T extends JobPayload>(definition: JobDefinition<T>): void {
        const config = JobConfigSchema.parse(definition.config || {});

        // Store job definition
        this.jobs.set(definition.name, { ...definition, config });

        // Create Inngest function
        this.inngest.createFunction(
            {
                id: definition.name,
                name: definition.name,
                retries: Math.min(config.maxRetries, 20) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20,
                concurrency: {
                    limit: config.concurrency,
                },
            },
            { event: definition.name },
            async ({ event, step, attempt }) => {
                const jobId = event.data.jobId || generateId();

                // Update job status
                this.updateJobStatus(jobId, {
                    id: jobId,
                    name: definition.name,
                    status: 'running',
                    attempts: attempt,
                    maxRetries: config.maxRetries,
                    createdAt: new Date(event.ts || Date.now()),
                    startedAt: new Date(),
                });

                try {
                    // Validate payload if schema is provided
                    let payload = event.data.payload;
                    if (definition.schema) {
                        payload = definition.schema.parse(payload);
                    }

                    // Create job context
                    const context: JobContext = {
                        attempt,
                        maxRetries: config.maxRetries,
                        runId: generateId(),
                        event: {
                            id: event.id || generateId(),
                            name: event.name,
                            data: payload,
                            timestamp: new Date(event.ts || Date.now()),
                        },
                    };

                    // Execute job handler
                    const result = await definition.handler(payload, context);

                    if (result.success) {
                        this.updateJobStatus(jobId, {
                            status: 'completed',
                            completedAt: new Date(),
                            result: result.data,
                        });
                    } else {
                        if (attempt >= config.maxRetries) {
                            this.updateJobStatus(jobId, {
                                status: 'failed',
                                completedAt: new Date(),
                                error: result.error,
                            });
                        } else {
                            // Will be retried by Inngest
                            throw new Error(result.error || 'Job failed');
                        }
                    }

                    return result;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                    if (attempt >= config.maxRetries) {
                        this.updateJobStatus(jobId, {
                            status: 'failed',
                            completedAt: new Date(),
                            error: errorMessage,
                        });
                    }

                    throw error;
                }
            }
        );
    }

    async enqueue<T extends JobPayload>(
        jobName: string,
        payload: T,
        options: Partial<JobConfig> = {}
    ): Promise<string> {
        const jobDefinition = this.jobs.get(jobName);
        if (!jobDefinition) {
            throw new Error(`Job "${jobName}" not found`);
        }

        const jobId = generateId();
        const config = JobConfigSchema.parse({ ...jobDefinition.config, ...options });

        // Create job status
        this.updateJobStatus(jobId, {
            id: jobId,
            name: jobName,
            status: 'pending',
            attempts: 0,
            maxRetries: config.maxRetries,
            createdAt: new Date(),
        });

        // Send event to Inngest
        await this.inngest.send({
            name: jobName,
            data: {
                jobId,
                payload,
                config,
            },
        });

        return jobId;
    }

    async scheduleJob<T extends JobPayload>(
        jobName: string,
        payload: T,
        scheduleAt: Date,
        options: Partial<JobConfig> = {}
    ): Promise<string> {
        const jobDefinition = this.jobs.get(jobName);
        if (!jobDefinition) {
            throw new Error(`Job "${jobName}" not found`);
        }

        const jobId = generateId();
        const config = JobConfigSchema.parse({ ...jobDefinition.config, ...options });

        // Create job status
        this.updateJobStatus(jobId, {
            id: jobId,
            name: jobName,
            status: 'pending',
            attempts: 0,
            maxRetries: config.maxRetries,
            createdAt: new Date(),
        });

        // Send scheduled event to Inngest
        await this.inngest.send({
            name: jobName,
            data: {
                jobId,
                payload,
                config,
            },
            ts: scheduleAt.getTime(),
        });

        return jobId;
    }

    async cancelJob(jobId: string): Promise<boolean> {
        const status = this.jobStatuses.get(jobId);
        if (!status) {
            return false;
        }

        if (status.status === 'pending' || status.status === 'running') {
            this.updateJobStatus(jobId, {
                status: 'cancelled',
                completedAt: new Date(),
            });
            return true;
        }

        return false;
    }

    async getJobStatus(jobId: string): Promise<JobStatus | null> {
        return this.jobStatuses.get(jobId) || null;
    }

    async start(): Promise<void> {
        // Inngest functions are automatically started when defined
        console.log('Job service started');
    }

    async stop(): Promise<void> {
        // Graceful shutdown would be handled by the Inngest SDK
        console.log('Job service stopped');
    }

    private updateJobStatus(jobId: string, updates: Partial<JobStatus>): void {
        const current = this.jobStatuses.get(jobId);
        this.jobStatuses.set(jobId, { ...current, ...updates } as JobStatus);
    }

    // Helper method to get Inngest instance for framework integration
    getInngestInstance(): Inngest {
        return this.inngest;
    }

    // Helper method to get all defined functions for serving
    getFunctions() {
        // Return the jobs map since Inngest doesn't expose functions directly
        return Array.from(this.jobs.values());
    }
}

// In-memory job service for testing
export class InMemoryJobService implements JobService {
    private jobs: Map<string, JobDefinition<any>> = new Map();
    private jobStatuses: Map<string, JobStatus> = new Map();
    private jobQueue: Array<{ jobId: string; jobName: string; payload: any; config: JobConfig; scheduleAt?: Date }> = [];
    private isRunning = false;
    private processingInterval?: NodeJS.Timeout;

    defineJob<T extends JobPayload>(definition: JobDefinition<T>): void {
        const config = JobConfigSchema.parse(definition.config || {});
        this.jobs.set(definition.name, { ...definition, config });
    }

    async enqueue<T extends JobPayload>(
        jobName: string,
        payload: T,
        options: Partial<JobConfig> = {}
    ): Promise<string> {
        const jobDefinition = this.jobs.get(jobName);
        if (!jobDefinition) {
            throw new Error(`Job "${jobName}" not found`);
        }

        const jobId = generateId();
        const config = JobConfigSchema.parse({ ...jobDefinition.config, ...options });

        this.updateJobStatus(jobId, {
            id: jobId,
            name: jobName,
            status: 'pending',
            attempts: 0,
            maxRetries: config.maxRetries,
            createdAt: new Date(),
        });

        this.jobQueue.push({ jobId, jobName, payload, config });
        return jobId;
    }

    async scheduleJob<T extends JobPayload>(
        jobName: string,
        payload: T,
        scheduleAt: Date,
        options: Partial<JobConfig> = {}
    ): Promise<string> {
        const jobDefinition = this.jobs.get(jobName);
        if (!jobDefinition) {
            throw new Error(`Job "${jobName}" not found`);
        }

        const jobId = generateId();
        const config = JobConfigSchema.parse({ ...jobDefinition.config, ...options });

        this.updateJobStatus(jobId, {
            id: jobId,
            name: jobName,
            status: 'pending',
            attempts: 0,
            maxRetries: config.maxRetries,
            createdAt: new Date(),
        });

        this.jobQueue.push({ jobId, jobName, payload, config, scheduleAt });
        return jobId;
    }

    async cancelJob(jobId: string): Promise<boolean> {
        const status = this.jobStatuses.get(jobId);
        if (!status) {
            return false;
        }

        if (status.status === 'pending') {
            this.updateJobStatus(jobId, {
                status: 'cancelled',
                completedAt: new Date(),
            });

            // Remove from queue
            const index = this.jobQueue.findIndex(job => job.jobId === jobId);
            if (index !== -1) {
                this.jobQueue.splice(index, 1);
            }

            return true;
        }

        return false;
    }

    async getJobStatus(jobId: string): Promise<JobStatus | null> {
        return this.jobStatuses.get(jobId) || null;
    }

    async start(): Promise<void> {
        this.isRunning = true;
        this.processingInterval = setInterval(() => {
            this.processQueue();
        }, 100);
    }

    async stop(): Promise<void> {
        this.isRunning = false;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
    }

    private async processQueue(): Promise<void> {
        if (!this.isRunning || this.jobQueue.length === 0) {
            return;
        }

        const now = new Date();
        const readyJobs = this.jobQueue.filter(job =>
            !job.scheduleAt || job.scheduleAt <= now
        );

        for (const job of readyJobs.slice(0, 5)) { // Process up to 5 jobs at once
            const index = this.jobQueue.indexOf(job);
            this.jobQueue.splice(index, 1);

            // Process job asynchronously
            this.processJob(job).catch(console.error);
        }
    }

    private async processJob(job: { jobId: string; jobName: string; payload: any; config: JobConfig }): Promise<void> {
        const jobDefinition = this.jobs.get(job.jobName);
        if (!jobDefinition) {
            return;
        }

        const status = this.jobStatuses.get(job.jobId);
        if (!status || status.status === 'cancelled') {
            return;
        }

        this.updateJobStatus(job.jobId, {
            status: 'running',
            startedAt: new Date(),
            attempts: status.attempts + 1,
        });

        try {
            const context: JobContext = {
                attempt: status.attempts + 1,
                maxRetries: job.config.maxRetries,
                runId: generateId(),
                event: {
                    id: generateId(),
                    name: job.jobName,
                    data: job.payload,
                    timestamp: new Date(),
                },
            };

            const result = await jobDefinition.handler(job.payload, context);

            if (result.success) {
                this.updateJobStatus(job.jobId, {
                    status: 'completed',
                    completedAt: new Date(),
                    result: result.data,
                });
            } else {
                if (status.attempts + 1 >= job.config.maxRetries) {
                    this.updateJobStatus(job.jobId, {
                        status: 'failed',
                        completedAt: new Date(),
                        error: result.error,
                    });
                } else {
                    // Retry after delay
                    setTimeout(() => {
                        this.jobQueue.push(job);
                    }, job.config.retryDelay);

                    this.updateJobStatus(job.jobId, {
                        status: 'pending',
                    });
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (status.attempts + 1 >= job.config.maxRetries) {
                this.updateJobStatus(job.jobId, {
                    status: 'failed',
                    completedAt: new Date(),
                    error: errorMessage,
                });
            } else {
                // Retry after delay
                setTimeout(() => {
                    this.jobQueue.push(job);
                }, job.config.retryDelay);

                this.updateJobStatus(job.jobId, {
                    status: 'pending',
                });
            }
        }
    }

    private updateJobStatus(jobId: string, updates: Partial<JobStatus>): void {
        const current = this.jobStatuses.get(jobId);
        this.jobStatuses.set(jobId, { ...current, ...updates } as JobStatus);
    }
}