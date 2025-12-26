// Types and interfaces
export type * from './types';

// Base integration class
export { BaseIntegration } from './base-integration';

// Integration implementations
export { ZapierIntegration } from './zapier/zapier-integration';
export { Microsoft365Integration } from './microsoft365/microsoft365-integration';
export { GoogleWorkspaceIntegration } from './google/google-workspace-integration';
export { SalesforceIntegration } from './salesforce/salesforce-integration';

// Integration manager
export { IntegrationManager } from './integration-manager';

// Repository - separate type and value exports
export type { IntegrationRepository } from './integration-repository';
export {
    InMemoryIntegrationRepository,
    createIntegrationRepository
} from './integration-repository';

// Advanced Integration Platform
export { AdvancedIntegrationPlatform } from './advanced/integration-platform';

// Connector Framework
export {
    ConnectorFactory,
    BaseConnector,
    RestApiConnector,
    ConnectorType,
    DataType,
    AuthenticationType,
} from './advanced/connector-framework';
export type {
    IConnector,
    ConnectorConfig,
    FieldMapping,
    VisualBuilderWorkflow,
    VisualBuilderNode,
    VisualBuilderConnection,
} from './advanced/connector-framework';

// Data Synchronization Engine
export {
    DataSyncEngine,
    SyncStrategy,
    ConflictResolutionStrategy,
    SyncStatus,
} from './advanced/data-sync-engine';
export type {
    SyncConfig,
    SyncResult,
    ConflictRecord,
    SyncError as DataSyncError,
    SyncMetrics,
} from './advanced/data-sync-engine';

// Event Streaming
export {
    EventStreamingEngine,
    EventType,
    EventPriority,
    DeliveryMode,
    LoggingEventHandler,
    MetricsEventHandler,
    OrganizationEventFilter,
    PriorityEventFilter,
    EventEnrichmentTransformer,
    EventRedactionTransformer,
} from './advanced/event-streaming';
export type {
    StreamEvent,
    KafkaConfig,
    TopicConfig,
    ConsumerConfig,
    ProducerConfig,
    EventHandler,
    EventFilter,
    EventTransformer,
} from './advanced/event-streaming';

// Enterprise Service Bus
export {
    EnterpriseServiceBus,
    MessageType,
    RoutingStrategy,
    DeliveryGuarantee,
    MessagePriority,
    LoggingMessageHandler,
    EchoMessageHandler,
    LoggingInterceptor,
    SecurityInterceptor,
    MetricsInterceptor,
} from './advanced/enterprise-service-bus';
export type {
    ESBMessage,
    ExchangeConfig,
    QueueConfig,
    BindingConfig,
    ServiceRegistration,
    MessageHandler,
    MessageInterceptor,
    ServiceDiscovery,
    MessageRouter,
} from './advanced/enterprise-service-bus';

// Export enums and classes from types (these are values, not just types)
export {
    IntegrationType,
    IntegrationStatus,
    SyncDirection,
    SyncEventType,
    IntegrationError,
    AuthenticationError,
    SyncError,
} from './types';