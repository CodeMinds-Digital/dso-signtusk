import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InfrastructureManagerImpl, infrastructureManager } from '../manager';
import { InfrastructureConfig, InfrastructureConfigSchema } from '../types';

describe('Infrastructure Core', () => {
    afterEach(async () => {
        try {
            await infrastructureManager.shutdown();
        } catch {
            // Ignore shutdown errors in tests
        }
    });

    it('should validate configuration schemas correctly', () => {
        const validConfig: InfrastructureConfig = {
            auth: {
                jwtSecret: 'test-secret-that-is-long-enough-for-jwt-validation-requirements',
                sessionTimeout: 24 * 60 * 60 * 1000,
            },
            cache: {
                host: 'localhost',
                port: 6379,
                db: 0,
                keyPrefix: 'test:',
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
            },
            storage: {
                provider: 'local' as const,
                local: {
                    basePath: `/tmp/test-storage-${Date.now()}`,
                    createDirectories: true,
                },
            },
            jobs: {
                appId: 'test-app',
            },
        };

        // Should not throw with valid config
        expect(() => InfrastructureConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should initialize infrastructure services', async () => {
        const config: InfrastructureConfig = {
            auth: {
                jwtSecret: 'test-secret-that-is-long-enough-for-jwt-validation-requirements',
                sessionTimeout: 24 * 60 * 60 * 1000,
            },
            cache: {
                host: 'localhost',
                port: 6379,
                db: 0,
                keyPrefix: 'test:',
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
            },
            storage: {
                provider: 'local' as const,
                local: {
                    basePath: `/tmp/test-storage-${Date.now()}`,
                    createDirectories: true,
                },
            },
            jobs: {
                appId: 'test-app',
            },
        };

        await infrastructureManager.initialize(config);
        const services = infrastructureManager.getServices();

        expect(services.auth).toBeDefined();
        expect(services.cache).toBeDefined();
        expect(services.storage).toBeDefined();
        expect(services.jobs).toBeDefined();
    }, 10000);

    it('should perform health checks', async () => {
        const config: InfrastructureConfig = {
            auth: {
                jwtSecret: 'test-secret-that-is-long-enough-for-jwt-validation-requirements',
                sessionTimeout: 24 * 60 * 60 * 1000,
            },
            cache: {
                host: 'localhost',
                port: 6379,
                db: 0,
                keyPrefix: 'test:',
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
            },
            storage: {
                provider: 'local' as const,
                local: {
                    basePath: `/tmp/test-storage-${Date.now()}`,
                    createDirectories: true,
                },
            },
            jobs: {
                appId: 'test-app',
            },
        };

        await infrastructureManager.initialize(config);
        const healthCheck = await infrastructureManager.healthCheck();

        expect(healthCheck.status).toMatch(/^(healthy|degraded|unhealthy)$/);
        expect(healthCheck.services).toBeDefined();
        expect(healthCheck.timestamp).toBeInstanceOf(Date);
    }, 10000);
});