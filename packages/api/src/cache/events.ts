import { EventEmitter } from 'events';
import { CacheInvalidationService } from '../middleware/cache';

/**
 * Cache event types
 */
export enum CacheEventType {
    DOCUMENT_CREATED = 'document:created',
    DOCUMENT_UPDATED = 'document:updated',
    DOCUMENT_DELETED = 'document:deleted',
    TEMPLATE_CREATED = 'template:created',
    TEMPLATE_UPDATED = 'template:updated',
    TEMPLATE_DELETED = 'template:deleted',
    USER_UPDATED = 'user:updated',
    USER_DELETED = 'user:deleted',
    ORGANIZATION_UPDATED = 'organization:updated',
    ORGANIZATION_DELETED = 'organization:deleted',
    SIGNING_COMPLETED = 'signing:completed',
    SIGNING_CANCELLED = 'signing:cancelled',
    FOLDER_UPDATED = 'folder:updated',
    FOLDER_DELETED = 'folder:deleted',
}

/**
 * Cache event data interface
 */
export interface CacheEventData {
    type: CacheEventType;
    entityId: string;
    userId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
    timestamp: number;
}

/**
 * Cache event handler interface
 */
export interface CacheEventHandler {
    (eventData: CacheEventData): Promise<void>;
}

/**
 * Cache event manager for handling cache invalidation events
 */
export class CacheEventManager extends EventEmitter {
    private invalidationService: CacheInvalidationService;
    private handlers: Map<CacheEventType, CacheEventHandler[]> = new Map();

    constructor(invalidationService: CacheInvalidationService) {
        super();
        this.invalidationService = invalidationService;
        this.setupDefaultHandlers();
    }

    /**
     * Register event handler
     */
    registerHandler(eventType: CacheEventType, handler: CacheEventHandler): void {
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);
    }

    /**
     * Emit cache event
     */
    async emitCacheEvent(eventData: CacheEventData): Promise<void> {
        try {
            // Execute registered handlers
            const handlers = this.handlers.get(eventData.type) || [];
            await Promise.all(handlers.map(handler => handler(eventData)));

            // Emit event for external listeners
            this.emit(eventData.type, eventData);
        } catch (error) {
            console.error('Cache event handling error:', error);
        }
    }

    /**
     * Setup default cache invalidation handlers
     */
    private setupDefaultHandlers(): void {
        // Document events
        this.registerHandler(CacheEventType.DOCUMENT_CREATED, async (data) => {
            await this.invalidationService.invalidateTags(['documents', 'user-data']);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        this.registerHandler(CacheEventType.DOCUMENT_UPDATED, async (data) => {
            await this.invalidationService.invalidateTags(['documents', 'user-data']);
            await this.invalidationService.invalidateKey(`document:${data.entityId}`);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        this.registerHandler(CacheEventType.DOCUMENT_DELETED, async (data) => {
            await this.invalidationService.invalidateTags(['documents', 'user-data']);
            await this.invalidationService.invalidateKey(`document:${data.entityId}`);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        // Template events
        this.registerHandler(CacheEventType.TEMPLATE_CREATED, async (data) => {
            await this.invalidationService.invalidateTags(['templates', 'org-data']);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        this.registerHandler(CacheEventType.TEMPLATE_UPDATED, async (data) => {
            await this.invalidationService.invalidateTags(['templates', 'org-data']);
            await this.invalidationService.invalidateKey(`template:${data.entityId}`);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        this.registerHandler(CacheEventType.TEMPLATE_DELETED, async (data) => {
            await this.invalidationService.invalidateTags(['templates', 'org-data']);
            await this.invalidationService.invalidateKey(`template:${data.entityId}`);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        // User events
        this.registerHandler(CacheEventType.USER_UPDATED, async (data) => {
            await this.invalidationService.invalidateTags(['user-data']);
            await this.invalidationService.invalidateUser(data.entityId);
            await this.invalidationService.invalidateKey(`user:${data.entityId}`);
        });

        this.registerHandler(CacheEventType.USER_DELETED, async (data) => {
            await this.invalidationService.invalidateTags(['user-data']);
            await this.invalidationService.invalidateUser(data.entityId);
            await this.invalidationService.invalidateKey(`user:${data.entityId}`);
        });

        // Organization events
        this.registerHandler(CacheEventType.ORGANIZATION_UPDATED, async (data) => {
            await this.invalidationService.invalidateTags(['org-data']);
            await this.invalidationService.invalidateOrganization(data.entityId);
            await this.invalidationService.invalidateKey(`organization:${data.entityId}`);
        });

        this.registerHandler(CacheEventType.ORGANIZATION_DELETED, async (data) => {
            await this.invalidationService.invalidateTags(['org-data']);
            await this.invalidationService.invalidateOrganization(data.entityId);
            await this.invalidationService.invalidateKey(`organization:${data.entityId}`);
        });

        // Signing events
        this.registerHandler(CacheEventType.SIGNING_COMPLETED, async (data) => {
            await this.invalidationService.invalidateTags(['documents', 'user-data']);
            if (data.metadata?.documentId) {
                await this.invalidationService.invalidateKey(`document:${data.metadata.documentId}`);
            }
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        this.registerHandler(CacheEventType.SIGNING_CANCELLED, async (data) => {
            await this.invalidationService.invalidateTags(['documents', 'user-data']);
            if (data.metadata?.documentId) {
                await this.invalidationService.invalidateKey(`document:${data.metadata.documentId}`);
            }
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        // Folder events
        this.registerHandler(CacheEventType.FOLDER_UPDATED, async (data) => {
            await this.invalidationService.invalidateTags(['documents', 'user-data']);
            await this.invalidationService.invalidateKey(`folder:${data.entityId}`);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });

        this.registerHandler(CacheEventType.FOLDER_DELETED, async (data) => {
            await this.invalidationService.invalidateTags(['documents', 'user-data']);
            await this.invalidationService.invalidateKey(`folder:${data.entityId}`);
            if (data.organizationId) {
                await this.invalidationService.invalidateOrganization(data.organizationId);
            }
        });
    }
}

/**
 * Cache event utilities
 */
export class CacheEventUtils {
    /**
     * Create document event
     */
    static createDocumentEvent(
        type: CacheEventType.DOCUMENT_CREATED | CacheEventType.DOCUMENT_UPDATED | CacheEventType.DOCUMENT_DELETED,
        documentId: string,
        userId?: string,
        organizationId?: string,
        metadata?: Record<string, any>
    ): CacheEventData {
        return {
            type,
            entityId: documentId,
            userId,
            organizationId,
            metadata,
            timestamp: Date.now(),
        };
    }

    /**
     * Create template event
     */
    static createTemplateEvent(
        type: CacheEventType.TEMPLATE_CREATED | CacheEventType.TEMPLATE_UPDATED | CacheEventType.TEMPLATE_DELETED,
        templateId: string,
        userId?: string,
        organizationId?: string,
        metadata?: Record<string, any>
    ): CacheEventData {
        return {
            type,
            entityId: templateId,
            userId,
            organizationId,
            metadata,
            timestamp: Date.now(),
        };
    }

    /**
     * Create user event
     */
    static createUserEvent(
        type: CacheEventType.USER_UPDATED | CacheEventType.USER_DELETED,
        userId: string,
        organizationId?: string,
        metadata?: Record<string, any>
    ): CacheEventData {
        return {
            type,
            entityId: userId,
            userId,
            organizationId,
            metadata,
            timestamp: Date.now(),
        };
    }

    /**
     * Create organization event
     */
    static createOrganizationEvent(
        type: CacheEventType.ORGANIZATION_UPDATED | CacheEventType.ORGANIZATION_DELETED,
        organizationId: string,
        metadata?: Record<string, any>
    ): CacheEventData {
        return {
            type,
            entityId: organizationId,
            organizationId,
            metadata,
            timestamp: Date.now(),
        };
    }

    /**
     * Create signing event
     */
    static createSigningEvent(
        type: CacheEventType.SIGNING_COMPLETED | CacheEventType.SIGNING_CANCELLED,
        signingRequestId: string,
        userId?: string,
        organizationId?: string,
        metadata?: Record<string, any>
    ): CacheEventData {
        return {
            type,
            entityId: signingRequestId,
            userId,
            organizationId,
            metadata,
            timestamp: Date.now(),
        };
    }

    /**
     * Create folder event
     */
    static createFolderEvent(
        type: CacheEventType.FOLDER_UPDATED | CacheEventType.FOLDER_DELETED,
        folderId: string,
        userId?: string,
        organizationId?: string,
        metadata?: Record<string, any>
    ): CacheEventData {
        return {
            type,
            entityId: folderId,
            userId,
            organizationId,
            metadata,
            timestamp: Date.now(),
        };
    }
}

/**
 * Global cache event manager instance
 */
let globalCacheEventManager: CacheEventManager | null = null;

/**
 * Initialize global cache event manager
 */
export function initializeCacheEventManager(invalidationService: CacheInvalidationService): CacheEventManager {
    globalCacheEventManager = new CacheEventManager(invalidationService);
    return globalCacheEventManager;
}

/**
 * Get global cache event manager
 */
export function getCacheEventManager(): CacheEventManager {
    if (!globalCacheEventManager) {
        throw new Error('Cache event manager not initialized. Call initializeCacheEventManager first.');
    }
    return globalCacheEventManager;
}

/**
 * Emit cache event using global manager
 */
export async function emitCacheEvent(eventData: CacheEventData): Promise<void> {
    const manager = getCacheEventManager();
    await manager.emitCacheEvent(eventData);
}