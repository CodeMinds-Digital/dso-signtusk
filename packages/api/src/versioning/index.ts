/**
 * API Versioning System
 * 
 * This module provides a comprehensive API versioning system with support for:
 * - URL-based versioning (/api/v1/...)
 * - Header-based versioning (Accept: application/vnd.api.v1+json)
 * - Query parameter versioning (?version=v1)
 * - Subdomain versioning (v1.api.example.com)
 * - Deprecation strategy with timeline management
 * - Automated migration tools and guides
 * 
 * Requirements: 9.1 - API versioning with clear paths, header-based versioning,
 * deprecation strategy, and migration guides with automated tools.
 */

// Core types and interfaces
export * from './types';

// Configuration and metadata
export * from './config';

// Version negotiation and middleware
export * from './negotiation';

// Migration tools and utilities
export * from './migration';

// Deprecation strategy and notifications
export * from './deprecation';

// Re-export key functions for convenience
export {
    negotiateVersion,
    createVersionNegotiationMiddleware,
    createVersionedResponse
} from './negotiation';

export {
    MigrationCompatibilityChecker,
    DataTransformer,
    MigrationPlanner,
    MigrationTracker
} from './migration';

export {
    DeprecationManager,
    DeprecationNotificationService
} from './deprecation';

export {
    versionConfig,
    getVersionMetadata,
    getMigrationGuide,
    isVersionSupported,
    isVersionDeprecated,
    isVersionSunset,
    getAvailableVersions,
    getDeprecationTimeline
} from './config';

/**
 * Quick setup function for basic versioning
 */
export function setupVersioning(options?: {
    defaultVersion?: string;
    requireVersionSpecification?: boolean;
    includeDeprecationWarnings?: boolean;
}) {
    if (options?.defaultVersion) {
        versionConfig.defaultVersion = options.defaultVersion as any;
    }

    if (options?.requireVersionSpecification !== undefined) {
        versionConfig.requireVersionSpecification = options.requireVersionSpecification;
    }

    if (options?.includeDeprecationWarnings !== undefined) {
        versionConfig.includeDeprecationWarnings = options.includeDeprecationWarnings;
    }

    return {
        middleware: createVersionNegotiationMiddleware(),
        config: versionConfig
    };
}