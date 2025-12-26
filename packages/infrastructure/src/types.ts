import { z } from 'zod';
import { CacheConfigSchema } from '@signtusk/cache';
import { StorageConfigSchema } from '@signtusk/storage';
import { PerformanceConfigSchema } from '@signtusk/performance';
import { DisasterRecoveryConfigSchema } from './disaster-recovery/types';

export const InfrastructureConfigSchema = z.object({
    auth: z.object({
        jwtSecret: z.string(),
        sessionTimeout: z.number().default(24 * 60 * 60 * 1000), // 24 hours in ms
    }),
    cache: CacheConfigSchema,
    storage: StorageConfigSchema,
    jobs: z.object({
        appId: z.string().default('docusign-alternative'),
    }),
    performance: PerformanceConfigSchema.optional(),
    disasterRecovery: DisasterRecoveryConfigSchema.optional(),
});

export type InfrastructureConfig = z.infer<typeof InfrastructureConfigSchema>;

export interface InfrastructureServices {
    auth: AuthService;
    cache: import('@signtusk/cache').CacheService;
    storage: import('@signtusk/storage').StorageService;
    jobs: import('@signtusk/jobs').JobService;
    performance?: import('@signtusk/performance').PerformanceMonitoringService;
    disasterRecovery?: import('./disaster-recovery/types').DisasterRecoveryService;
}

// Simple auth service interface for infrastructure
export interface AuthService {
    register(data: { email: string; password: string; name: string }): Promise<User>;
    authenticate(email: string, password: string): Promise<AuthResult>;
    validateToken(token: string): Promise<User | null>;
    generateToken(user: User): Promise<string>;
}

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

export interface AuthResult {
    user: User;
    token: string;
    expiresAt: Date;
}

export interface InfrastructureManager {
    initialize(config: InfrastructureConfig): Promise<void>;
    getServices(): InfrastructureServices;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthCheckResult>;
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    services: {
        auth: ServiceHealth;
        cache: ServiceHealth;
        storage: ServiceHealth;
        jobs: ServiceHealth;
        performance?: ServiceHealth;
        disasterRecovery?: ServiceHealth;
    };
    timestamp: Date;
}

export interface ServiceHealth {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
}