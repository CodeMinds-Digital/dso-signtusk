import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdvancedIntegrationPlatform } from '../advanced/integration-platform';
import {
    ConnectorFactory,
    ConnectorType,
    AuthenticationType,
} from '../advanced/connector-framework';
import { MockConnector } from '../advanced/mock-connector';

/**
 * **Feature: docusign-alternative-comprehensive, Property 56: Enterprise Integration Capability**
 * **Validates: Requirements 12.1**
 */
describe('Advanced Integration Platform - Basic Tests', () => {
    let platform: AdvancedIntegrationPlatform | undefined;

    beforeEach(async () => {
        // Register the Mock connector for testing
        ConnectorFactory.register(ConnectorType.REST_API, MockConnector);

        const config = {
            id: 'test-platform',
            name: 'Test Integration Platform',
            description: 'Test platform for basic testing',
            kafka: {
                enabled: false, // Disable Kafka for testing
                config: {},
            },
            serviceBus: {
                enabled: true,
                config: {},
            },
            dataSync: {
                enabled: true,
                config: {},
            },
            connectors: {
                enabled: true,
                config: {},
            },
            settings: {
                maxConcurrentSyncs: 5,
                defaultRetryAttempts: 2,
                healthCheckInterval: 5000,
                metricsRetentionDays: 7,
                enableAuditLog: true,
                enableMetrics: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        platform = new AdvancedIntegrationPlatform(config);
        await platform.start();
    });

    afterEach(async () => {
        if (platform) {
            await platform.stop();
            platform = undefined;
        }
    });

    describe('Platform Lifecycle', () => {
        it('should start and stop correctly', async () => {
            expect(platform).toBeDefined();
            expect(platform!.getStatus()).toBe('running');

            const config = platform!.getConfig();
            expect(config.id).toBe('test-platform');
            expect(config.name).toBe('Test Integration Platform');
        });

        it('should handle configuration updates', async () => {
            const originalConfig = platform!.getConfig();

            // Update configuration
            platform!.updateConfig({
                settings: {
                    ...originalConfig.settings,
                    maxConcurrentSyncs: 10,
                    enableAuditLog: false,
                },
            });

            // Verify configuration was updated
            const updatedConfig = platform!.getConfig();
            expect(updatedConfig.settings.maxConcurrentSyncs).toBe(10);
            expect(updatedConfig.settings.enableAuditLog).toBe(false);

            // Verify updatedAt timestamp was changed
            expect(updatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(originalConfig.updatedAt.getTime());

            // Verify other configuration properties remain unchanged
            expect(updatedConfig.id).toBe(originalConfig.id);
            expect(updatedConfig.name).toBe(originalConfig.name);
        });
    });

    describe('Health and Monitoring', () => {
        it('should provide health status', async () => {
            const health = await platform!.getHealth();
            expect(health).toBeDefined();
            expect(health.status).toMatch(/^(healthy|degraded|unhealthy)$/);
            expect(health.components).toBeDefined();
            expect(health.components.connectorFramework).toBeDefined();
            expect(health.components.dataSyncEngine).toBeDefined();
            expect(health.components.eventStreaming).toBeDefined();
            expect(health.components.serviceBus).toBeDefined();
            expect(health.timestamp).toBeInstanceOf(Date);
        });

        it('should provide metrics', async () => {
            const metrics = platform!.getMetrics();
            expect(metrics).toBeDefined();
            expect(metrics.connectors).toBeDefined();
            expect(metrics.syncs).toBeDefined();
            expect(metrics.events).toBeDefined();
            expect(metrics.messages).toBeDefined();
            expect(metrics.performance).toBeDefined();
            expect(metrics.resources).toBeDefined();

            expect(typeof metrics.performance.throughputPerSecond).toBe('number');
            expect(typeof metrics.resources.memoryUsage).toBe('number');
        });
    });

    describe('Connector Management', () => {
        it('should create and manage connectors', async () => {
            const connectorConfig = {
                id: `test-connector-${Date.now()}`,
                name: 'Test REST API Connector',
                type: ConnectorType.REST_API,
                version: '1.0.0',
                endpoint: 'https://api.example.com',
                authentication: {
                    type: AuthenticationType.API_KEY,
                    credentials: { apiKey: 'test-api-key' },
                },
                fieldMappings: [],
                settings: {
                    timeout: 30000,
                    retryAttempts: 3,
                    batchSize: 100,
                    rateLimitPerSecond: 10,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Create connector
            const connector = await platform!.createConnector(connectorConfig);

            // Verify connector was created
            expect(connector).toBeDefined();
            expect(connector.id).toBe(connectorConfig.id);
            expect(connector.config.name).toBe(connectorConfig.name);

            // Verify connector is in platform registry
            const retrievedConnector = platform!.getConnector(connectorConfig.id);
            expect(retrievedConnector).toBeDefined();
            expect(retrievedConnector?.id).toBe(connectorConfig.id);

            // Verify connector appears in list
            const connectors = platform!.listConnectors();
            expect(connectors.some(c => c.id === connectorConfig.id)).toBe(true);

            // Remove connector
            await platform!.removeConnector(connectorConfig.id);

            // Verify connector was removed
            const removedConnector = platform!.getConnector(connectorConfig.id);
            expect(removedConnector).toBeUndefined();

            const connectorsAfterRemoval = platform!.listConnectors();
            expect(connectorsAfterRemoval.some(c => c.id === connectorConfig.id)).toBe(false);
        });

        it('should handle multiple connectors', async () => {
            const connectorIds: string[] = [];

            // Create multiple connectors
            for (let i = 0; i < 3; i++) {
                const connectorConfig = {
                    id: `test-connector-${i}-${Date.now()}`,
                    name: `Test Connector ${i}`,
                    type: ConnectorType.REST_API,
                    version: '1.0.0',
                    endpoint: `https://api${i}.example.com`,
                    authentication: {
                        type: AuthenticationType.API_KEY,
                        credentials: { apiKey: `test-key-${i}` },
                    },
                    fieldMappings: [],
                    settings: {
                        timeout: 30000,
                        retryAttempts: 3,
                        batchSize: 100,
                        rateLimitPerSecond: 10,
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const connector = await platform!.createConnector(connectorConfig);
                connectorIds.push(connector.id);
            }

            // Verify all connectors exist
            const connectors = platform!.listConnectors();
            expect(connectors.length).toBe(3);

            for (const connectorId of connectorIds) {
                expect(connectors.some(c => c.id === connectorId)).toBe(true);
            }

            // Verify metrics reflect the connectors
            const metrics = platform!.getMetrics();
            expect(metrics.connectors.total).toBe(3);

            // Cleanup
            for (const connectorId of connectorIds) {
                await platform!.removeConnector(connectorId);
            }

            // Verify all connectors were removed
            const connectorsAfterCleanup = platform!.listConnectors();
            expect(connectorsAfterCleanup.length).toBe(0);
        });
    });

    describe('Enterprise Integration Capability', () => {
        it('should demonstrate comprehensive integration platform capabilities', async () => {
            // Test that the platform provides all required enterprise integration capabilities
            expect(platform).toBeDefined();

            // Verify platform has all required components
            const health = await platform!.getHealth();
            expect(health.components.connectorFramework).toBeDefined();
            expect(health.components.dataSyncEngine).toBeDefined();
            expect(health.components.eventStreaming).toBeDefined();
            expect(health.components.serviceBus).toBeDefined();

            // Verify platform provides metrics and monitoring
            const metrics = platform!.getMetrics();
            expect(metrics.connectors).toBeDefined();
            expect(metrics.syncs).toBeDefined();
            expect(metrics.events).toBeDefined();
            expect(metrics.messages).toBeDefined();
            expect(metrics.performance).toBeDefined();
            expect(metrics.resources).toBeDefined();

            // Verify platform supports configuration management
            const config = platform!.getConfig();
            expect(config.kafka).toBeDefined();
            expect(config.serviceBus).toBeDefined();
            expect(config.dataSync).toBeDefined();
            expect(config.connectors).toBeDefined();
            expect(config.settings).toBeDefined();

            // Test configuration updates work
            const originalSettings = config.settings;
            platform!.updateConfig({
                settings: {
                    ...originalSettings,
                    maxConcurrentSyncs: originalSettings.maxConcurrentSyncs + 1,
                }
            });

            const updatedConfig = platform!.getConfig();
            expect(updatedConfig.settings.maxConcurrentSyncs).toBe(originalSettings.maxConcurrentSyncs + 1);
        });

        it('should support custom connector framework with visual builder capabilities', async () => {
            // Test connector factory registration
            expect(ConnectorFactory.getSupportedTypes()).toContain(ConnectorType.REST_API);

            // Test connector creation with field mappings
            const connectorConfig = {
                id: `visual-connector-${Date.now()}`,
                name: 'Visual Builder Test Connector',
                type: ConnectorType.REST_API,
                version: '1.0.0',
                endpoint: 'https://visual.example.com',
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    credentials: { token: 'bearer-token-123' },
                },
                fieldMappings: [
                    {
                        sourceField: 'user.name',
                        targetField: 'fullName',
                        dataType: 'string' as const,
                        required: true,
                        defaultValue: 'Unknown User',
                    },
                    {
                        sourceField: 'user.age',
                        targetField: 'userAge',
                        dataType: 'number' as const,
                        required: false,
                        defaultValue: 0,
                    }
                ],
                visualConfig: {
                    position: { x: 100, y: 200 },
                    size: { width: 150, height: 100 },
                    color: '#4CAF50',
                    icon: 'api',
                },
                settings: {
                    timeout: 30000,
                    retryAttempts: 3,
                    batchSize: 100,
                    rateLimitPerSecond: 10,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const connector = await platform!.createConnector(connectorConfig);

            // Verify field mappings are preserved
            expect(connector.config.fieldMappings).toHaveLength(2);
            expect(connector.config.fieldMappings[0].sourceField).toBe('user.name');
            expect(connector.config.fieldMappings[0].targetField).toBe('fullName');
            expect(connector.config.fieldMappings[1].dataType).toBe('number');

            // Verify visual configuration is preserved
            expect(connector.config.visualConfig?.position.x).toBe(100);
            expect(connector.config.visualConfig?.position.y).toBe(200);
            expect(connector.config.visualConfig?.color).toBe('#4CAF50');

            await platform!.removeConnector(connector.id);
        });

        it('should support data synchronization engine with conflict resolution', async () => {
            // Test sync configuration creation
            const syncConfig = {
                id: `test-sync-${Date.now()}`,
                name: 'Test Data Sync',
                sourceConnectorId: 'source-connector',
                targetConnectorId: 'target-connector',
                strategy: 'full_sync' as const,
                direction: 'unidirectional' as const,
                conflictResolution: 'source_wins' as const,
                schedule: { enabled: false },
                transformationRules: [
                    {
                        field: 'email',
                        rule: 'return value.toLowerCase()',
                    }
                ],
                conflictResolutionRules: [
                    {
                        field: 'updatedAt',
                        strategy: 'timestamp_wins' as const,
                    }
                ],
                batchSize: 1000,
                maxConcurrency: 5,
                retryAttempts: 3,
                enableMetrics: true,
                enableAuditLog: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await platform!.createSyncConfig(syncConfig);

            // Verify sync status is initially idle
            const initialStatus = platform!.getSyncStatus(syncConfig.id);
            expect(['idle', 'not_started']).toContain(initialStatus);

            // Verify sync appears in all statuses
            const allStatuses = platform!.getAllSyncStatuses();
            expect(allStatuses.has(syncConfig.id)).toBe(true);

            await platform!.deleteSyncConfig(syncConfig.id);
        });

        it('should support enterprise service bus with message routing', async () => {
            // Test service registration
            const service = {
                serviceId: `test-service-${Date.now()}`,
                serviceName: 'TestIntegrationService',
                version: '1.0.0',
                endpoints: [
                    {
                        name: 'processDocument',
                        routingKey: 'document.process',
                        messageType: 'command' as const,
                    },
                    {
                        name: 'documentProcessed',
                        routingKey: 'document.processed',
                        messageType: 'event' as const,
                    }
                ],
                metadata: {
                    description: 'Test integration service',
                    owner: 'integration-team',
                },
                registrationTime: new Date(),
                lastHeartbeat: new Date(),
            };

            await platform!.registerService(service);

            // Verify service discovery
            const discoveredServices = await platform!.discoverServices('TestIntegrationService');
            expect(discoveredServices.length).toBe(1);
            expect(discoveredServices[0].serviceId).toBe(service.serviceId);
            expect(discoveredServices[0].endpoints).toHaveLength(2);

            await platform!.unregisterService(service.serviceId);

            // Verify service was unregistered
            const servicesAfterUnregister = await platform!.discoverServices('TestIntegrationService');
            expect(servicesAfterUnregister.length).toBe(0);
        });
    });
});