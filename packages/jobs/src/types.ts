import { z } from 'zod';

export const JobConfigSchema = z.object({
    maxRetries: z.number().default(3),
    retryDelay: z.number().default(1000), // milliseconds
    timeout: z.number().default(30000), // milliseconds
    priority: z.number().min(0).max(10).default(5),
    concurrency: z.number().default(1),
});

export type JobConfig = z.infer<typeof JobConfigSchema>;

export interface JobPayload {
    [key: string]: any;
}

export interface JobContext {
    attempt: number;
    maxRetries: number;
    runId: string;
    event: {
        id: string;
        name: string;
        data: JobPayload;
        timestamp: Date;
    };
}

export interface JobResult {
    success: boolean;
    data?: any;
    error?: string;
    retryAfter?: number; // milliseconds
}

export type JobHandler<T extends JobPayload = JobPayload> = (
    payload: T,
    context: JobContext
) => Promise<JobResult>;

export interface JobDefinition<T extends JobPayload = JobPayload> {
    name: string;
    handler: JobHandler<T>;
    config?: Partial<JobConfig>;
    schema?: z.ZodSchema<T>;
}

export interface JobService {
    defineJob<T extends JobPayload>(definition: JobDefinition<T>): void;
    enqueue<T extends JobPayload>(jobName: string, payload: T, options?: Partial<JobConfig>): Promise<string>;
    scheduleJob<T extends JobPayload>(
        jobName: string,
        payload: T,
        scheduleAt: Date,
        options?: Partial<JobConfig>
    ): Promise<string>;
    cancelJob(jobId: string): Promise<boolean>;
    getJobStatus(jobId: string): Promise<JobStatus | null>;
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface JobStatus {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    attempts: number;
    maxRetries: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    result?: any;
}

// Common job types for the e-signature platform
export interface DocumentProcessingJob {
    documentId: string;
    operation: 'convert' | 'optimize' | 'extract-text' | 'generate-thumbnail';
    options?: Record<string, any>;
}

export interface EmailNotificationJob {
    recipientEmail: string;
    templateName: string;
    templateData: Record<string, any>;
    priority?: number;
}

export interface SigningReminderJob {
    signingRequestId: string;
    recipientId: string;
    reminderType: 'first' | 'second' | 'final';
}

export interface AuditLogJob {
    entityType: string;
    entityId: string;
    action: string;
    userId?: string;
    organizationId: string;
    metadata: Record<string, any>;
}