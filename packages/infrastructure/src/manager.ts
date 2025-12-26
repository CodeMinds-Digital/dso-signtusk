import { RedisCacheService, InMemoryCacheService } from '@signtusk/cache';
import { StorageServiceFactory } from '@signtusk/storage';
import { InngestJobService, InMemoryJobService } from '@signtusk/jobs';
import { createDisasterRecoveryService } from './disaster-recovery';
import { SimpleAuthService } from './auth-service';
import {
    InfrastructureManager,
    InfrastructureServices,
    InfrastructureConfig,
    InfrastructureConfigSchema,
    HealthCheckResult,
    ServiceHealth,
} from './types';

export class InfrastructureManagerImpl implements InfrastructureManager {
    private services?: InfrastructureServices;
    private config?: InfrastructureConfig;

    async initialize(config: InfrastructureConfig): Promise<void> {
        // Validate configuration
        this.config = InfrastructureConfigSchema.parse(config);

        try {
            // Initialize authentication service
            const authService = new SimpleAuthService((this.config.auth as any).jwtSecret);

            // Initialize cache service
            let cacheService;
            try {
                cacheService = new RedisCacheService(this.config.cache);
            } catch (error) {
                console.warn('Failed to initialize Redis cache, falling back to in-memory cache:', error);
                cacheService = new InMemoryCacheService();
            }

            // Initialize storage service
            const storageService = StorageServiceFactory.create(this.config.storage);

            // Initialize job service
            let jobService;
            try {
                jobService = new InngestJobService((this.config.jobs as any).appId);
            } catch (error) {
                console.warn('Failed to initialize Inngest job service, falling back to in-memory service:', error);
                jobService = new InMemoryJobService();
            }

            this.services = {
                auth: authService,
                cache: cacheService,
                storage: storageService,
                jobs: jobService,
            };

            // Initialize disaster recovery service if configured
            if (this.config.disasterRecovery) {
                try {
                    const disasterRecoveryService = createDisasterRecoveryService(
                        (this.config.disasterRecovery as any),
                        storageService,
                        cacheService,
                        jobService
                    );
                    this.services.disasterRecovery = disasterRecoveryService;
                } catch (error) {
                    console.warn('Failed to initialize disaster recovery service:', error);
                }
            }

            // Start job service
            await this.services.jobs.start();

            console.log('Infrastructure services initialized successfully');
        } catch (error) {
            console.error('Failed to initialize infrastructure services:', error);
            throw error;
        }
    }

    getServices(): InfrastructureServices {
        if (!this.services) {
            throw new Error('Infrastructure services not initialized. Call initialize() first.');
        }
        return this.services;
    }

    async shutdown(): Promise<void> {
        if (!this.services) {
            return;
        }

        try {
            // Stop job service
            await this.services.jobs.stop();

            // Shutdown disaster recovery service if initialized
            if (this.services.disasterRecovery) {
                // Note: DisasterRecoveryService doesn't have shutdown method in current interface
                // This would need to be added to the interface if needed
                console.log('Disaster recovery service shutdown not implemented');
            }

            // Disconnect cache service
            await this.services.cache.disconnect();

            console.log('Infrastructure services shut down successfully');
        } catch (error) {
            console.error('Error during infrastructure shutdown:', error);
            throw error;
        }
    }

    async healthCheck(): Promise<HealthCheckResult> {
        if (!this.services) {
            return {
                status: 'unhealthy',
                services: {
                    auth: { status: 'unhealthy', error: 'Not initialized' },
                    cache: { status: 'unhealthy', error: 'Not initialized' },
                    storage: { status: 'unhealthy', error: 'Not initialized' },
                    jobs: { status: 'unhealthy', error: 'Not initialized' },
                },
                timestamp: new Date(),
            };
        }

        const results = await Promise.allSettled([
            this.checkAuthHealth(),
            this.checkCacheHealth(),
            this.checkStorageHealth(),
            this.checkJobsHealth(),
            this.services.disasterRecovery ? this.checkDisasterRecoveryHealth() : Promise.resolve({ status: 'healthy' as const }),
        ]);

        const services = {
            auth: results[0].status === 'fulfilled' ? results[0].value : { status: 'unhealthy' as const, error: 'Health check failed' },
            cache: results[1].status === 'fulfilled' ? results[1].value : { status: 'unhealthy' as const, error: 'Health check failed' },
            storage: results[2].status === 'fulfilled' ? results[2].value : { status: 'unhealthy' as const, error: 'Health check failed' },
            jobs: results[3].status === 'fulfilled' ? results[3].value : { status: 'unhealthy' as const, error: 'Health check failed' },
            ...(this.services.disasterRecovery && {
                disasterRecovery: results[4].status === 'fulfilled' ? results[4].value : { status: 'unhealthy' as const, error: 'Health check failed' }
            }),
        };

        const healthyCount = Object.values(services).filter(s => s.status === 'healthy').length;
        const totalCount = Object.keys(services).length;

        let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
        if (healthyCount === totalCount) {
            overallStatus = 'healthy';
        } else if (healthyCount === 0) {
            overallStatus = 'unhealthy';
        } else {
            overallStatus = 'degraded';
        }

        return {
            status: overallStatus,
            services,
            timestamp: new Date(),
        };
    }

    private async checkAuthHealth(): Promise<ServiceHealth> {
        try {
            const startTime = Date.now();

            // Test authentication service by creating a test user
            const testUser = await this.services!.auth.register({
                email: `health-check-${Date.now()}@test.com`,
                password: 'test-password',
                name: 'Health Check User',
            });

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async checkCacheHealth(): Promise<ServiceHealth> {
        try {
            const startTime = Date.now();
            const testKey = `health-check-${Date.now()}`;
            const testValue = 'test-value';

            // Test cache operations
            await this.services!.cache.set(testKey, testValue, { ttl: 60 });
            const retrievedValue = await this.services!.cache.get(testKey);
            await this.services!.cache.del(testKey);

            if (retrievedValue !== testValue) {
                throw new Error('Cache value mismatch');
            }

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async checkStorageHealth(): Promise<ServiceHealth> {
        try {
            const startTime = Date.now();
            const testKey = `health-check-${Date.now()}.txt`;
            const testData = Buffer.from('health check data');

            // Test storage operations
            await this.services!.storage.upload(testKey, testData);
            const exists = await this.services!.storage.exists(testKey);
            await this.services!.storage.delete(testKey);

            if (!exists) {
                throw new Error('Storage file not found after upload');
            }

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async checkJobsHealth(): Promise<ServiceHealth> {
        try {
            const startTime = Date.now();

            // Define a simple test job
            this.services!.jobs.defineJob({
                name: 'health-check-job',
                handler: async (payload: any) => {
                    return { success: true, data: payload };
                },
            });

            // Enqueue and check job status
            const jobId = await this.services!.jobs.enqueue('health-check-job', { test: true });

            // Wait a bit for job to process (in real implementation, this would be more sophisticated)
            await new Promise(resolve => setTimeout(resolve, 100));

            const status = await this.services!.jobs.getJobStatus(jobId);

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async checkDisasterRecoveryHealth(): Promise<ServiceHealth> {
        try {
            const startTime = Date.now();

            // Get disaster recovery health status
            const health = await this.services!.disasterRecovery!.getHealthStatus();

            const responseTime = Date.now() - startTime;

            // Convert disaster recovery health status to service health
            const status = health.overall === 'healthy' ? 'healthy' : 'unhealthy';

            return {
                status,
                responseTime,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

// Singleton instance for global access
export const infrastructureManager = new InfrastructureManagerImpl();