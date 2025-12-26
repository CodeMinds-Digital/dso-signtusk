import {
    IntegrationConfig,
    IntegrationType,
    IntegrationStatus,
    SyncEvent,
    BaseIntegrationConfig
} from './types';

// This would typically use the database package, but for now we'll define the interface
export interface IntegrationRepository {
    // Integration Configuration Management
    create(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig>;
    findById(id: string): Promise<IntegrationConfig | null>;
    findByOrganizationId(organizationId: string): Promise<IntegrationConfig[]>;
    findByType(organizationId: string, type: IntegrationType): Promise<IntegrationConfig[]>;
    update(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig>;
    delete(id: string): Promise<void>;

    // Status Management
    updateStatus(id: string, status: IntegrationStatus, errorMessage?: string): Promise<void>;
    updateLastSync(id: string, timestamp: Date): Promise<void>;

    // Sync Event Management
    createSyncEvent(event: Omit<SyncEvent, 'id'>): Promise<SyncEvent>;
    findSyncEvents(integrationId: string, limit?: number): Promise<SyncEvent[]>;
    findUnprocessedSyncEvents(integrationId: string): Promise<SyncEvent[]>;
    markSyncEventProcessed(eventId: string, error?: string): Promise<void>;

    // Bulk Operations
    findActiveIntegrations(organizationId?: string): Promise<IntegrationConfig[]>;
    bulkUpdateStatus(integrationIds: string[], status: IntegrationStatus): Promise<void>;
}

// In-memory implementation for development/testing
export class InMemoryIntegrationRepository implements IntegrationRepository {
    private integrations: Map<string, IntegrationConfig> = new Map();
    private syncEvents: Map<string, SyncEvent> = new Map();
    private idCounter = 1;

    async create(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
        const id = `integration_${this.idCounter++}`;
        const now = new Date();

        const integration: IntegrationConfig = {
            ...config,
            id,
            createdAt: now,
            updatedAt: now,
        } as IntegrationConfig;

        this.integrations.set(id, integration);
        return integration;
    }

    async findById(id: string): Promise<IntegrationConfig | null> {
        return this.integrations.get(id) || null;
    }

    async findByOrganizationId(organizationId: string): Promise<IntegrationConfig[]> {
        return Array.from(this.integrations.values())
            .filter(integration => integration.organizationId === organizationId);
    }

    async findByType(organizationId: string, type: IntegrationType): Promise<IntegrationConfig[]> {
        return Array.from(this.integrations.values())
            .filter(integration =>
                integration.organizationId === organizationId &&
                integration.type === type
            );
    }

    async update(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
        const existing = this.integrations.get(id);
        if (!existing) {
            throw new Error(`Integration ${id} not found`);
        }

        const updated = {
            ...existing,
            ...updates,
            id, // Ensure ID doesn't change
            updatedAt: new Date(),
        } as IntegrationConfig;

        this.integrations.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<void> {
        this.integrations.delete(id);

        // Also delete related sync events
        const eventsToDelete = Array.from(this.syncEvents.entries())
            .filter(([, event]) => event.integrationId === id)
            .map(([eventId]) => eventId);

        eventsToDelete.forEach(eventId => this.syncEvents.delete(eventId));
    }

    async updateStatus(id: string, status: IntegrationStatus, errorMessage?: string): Promise<void> {
        const integration = this.integrations.get(id);
        if (!integration) {
            throw new Error(`Integration ${id} not found`);
        }

        const updated: IntegrationConfig = {
            ...integration,
            status,
            errorMessage,
            updatedAt: new Date(),
        };

        this.integrations.set(id, updated);
    }

    async updateLastSync(id: string, timestamp: Date): Promise<void> {
        const integration = this.integrations.get(id);
        if (!integration) {
            throw new Error(`Integration ${id} not found`);
        }

        const updated: IntegrationConfig = {
            ...integration,
            lastSyncAt: timestamp,
            updatedAt: new Date(),
        };

        this.integrations.set(id, updated);
    }

    async createSyncEvent(event: Omit<SyncEvent, 'id'>): Promise<SyncEvent> {
        const id = `event_${this.idCounter++}`;

        const syncEvent: SyncEvent = {
            ...event,
            id,
        };

        this.syncEvents.set(id, syncEvent);
        return syncEvent;
    }

    async findSyncEvents(integrationId: string, limit = 100): Promise<SyncEvent[]> {
        return Array.from(this.syncEvents.values())
            .filter(event => event.integrationId === integrationId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    async findUnprocessedSyncEvents(integrationId: string): Promise<SyncEvent[]> {
        return Array.from(this.syncEvents.values())
            .filter(event =>
                event.integrationId === integrationId &&
                !event.processed
            )
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    async markSyncEventProcessed(eventId: string, error?: string): Promise<void> {
        const event = this.syncEvents.get(eventId);
        if (!event) {
            throw new Error(`Sync event ${eventId} not found`);
        }

        const updated: SyncEvent = {
            ...event,
            processed: true,
            error,
        };

        this.syncEvents.set(eventId, updated);
    }

    async findActiveIntegrations(organizationId?: string): Promise<IntegrationConfig[]> {
        return Array.from(this.integrations.values())
            .filter(integration => {
                const isActive = integration.status === IntegrationStatus.ACTIVE;
                const matchesOrg = !organizationId || integration.organizationId === organizationId;
                return isActive && matchesOrg;
            });
    }

    async bulkUpdateStatus(integrationIds: string[], status: IntegrationStatus): Promise<void> {
        const now = new Date();

        for (const id of integrationIds) {
            const integration = this.integrations.get(id);
            if (integration) {
                const updated: IntegrationConfig = {
                    ...integration,
                    status,
                    updatedAt: now,
                };
                this.integrations.set(id, updated);
            }
        }
    }

    // Helper methods for testing
    clear(): void {
        this.integrations.clear();
        this.syncEvents.clear();
        this.idCounter = 1;
    }

    getAll(): IntegrationConfig[] {
        return Array.from(this.integrations.values());
    }

    getAllSyncEvents(): SyncEvent[] {
        return Array.from(this.syncEvents.values());
    }
}

// Factory function to create repository instance
export function createIntegrationRepository(): IntegrationRepository {
    // In a real implementation, this would return a database-backed repository
    // For now, return the in-memory implementation
    return new InMemoryIntegrationRepository();
}