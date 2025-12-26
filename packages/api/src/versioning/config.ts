/**
 * API Versioning Configuration
 * 
 * This module contains the configuration for all API versions,
 * including metadata, deprecation timelines, and migration guides.
 */

import { VersionConfig, VersionMetadata, MigrationGuide, APIVersion } from './types';

/**
 * Version metadata for all supported API versions
 */
const versionMetadata: Record<APIVersion, VersionMetadata> = {
    v1: {
        version: 'v1',
        status: 'stable',
        path: '/api/v1',
        documentation: '/api/docs/v1',
        deprecated: false,
        sunset: null,
        releaseDate: '2024-01-01T00:00:00Z',
        endOfLife: null,
        breakingChanges: [],
        migrationGuide: null,
        features: [
            'authentication',
            'document-management',
            'signing-workflows',
            'templates',
            'organizations',
            'webhooks',
            'basic-analytics'
        ]
    },
    v2: {
        version: 'v2',
        status: 'development',
        path: '/api/v2',
        documentation: '/api/docs/v2',
        deprecated: false,
        sunset: null,
        releaseDate: '2024-06-01T00:00:00Z',
        endOfLife: null,
        breakingChanges: [
            'Authentication token format changed from JWT to opaque tokens',
            'Document status field renamed from "status" to "state"',
            'Pagination parameters changed from "page/limit" to "cursor/size"',
            'Error response format standardized across all endpoints'
        ],
        migrationGuide: '/api/docs/migration/v1-to-v2',
        features: [
            'authentication',
            'document-management',
            'signing-workflows',
            'templates',
            'organizations',
            'webhooks',
            'advanced-analytics',
            'real-time-notifications',
            'bulk-operations',
            'advanced-search'
        ]
    },
    v3: {
        version: 'v3',
        status: 'development',
        path: '/api/v3',
        documentation: '/api/docs/v3',
        deprecated: false,
        sunset: null,
        releaseDate: '2024-12-01T00:00:00Z',
        endOfLife: null,
        breakingChanges: [
            'GraphQL-style field selection for all endpoints',
            'Unified resource identifiers (URIs) for all entities',
            'Event-driven architecture with mandatory webhook subscriptions',
            'OAuth 2.1 compliance with PKCE required for all flows'
        ],
        migrationGuide: '/api/docs/migration/v2-to-v3',
        features: [
            'authentication',
            'document-management',
            'signing-workflows',
            'templates',
            'organizations',
            'webhooks',
            'advanced-analytics',
            'real-time-notifications',
            'bulk-operations',
            'advanced-search',
            'ai-powered-features',
            'compliance-automation',
            'white-label-apis',
            'marketplace-integrations'
        ]
    }
};

/**
 * Migration guides for version transitions
 */
export const migrationGuides: MigrationGuide[] = [
    {
        from: 'v1',
        to: 'v2',
        complexity: 'medium',
        estimatedTime: '2-4 weeks',
        steps: [
            {
                id: 'auth-tokens',
                description: 'Update authentication to use opaque tokens',
                from: 'v1',
                to: 'v2',
                breaking: true,
                manualSteps: [
                    'Replace JWT token parsing with opaque token validation',
                    'Update token refresh logic to use new refresh endpoint',
                    'Implement token introspection for user information'
                ]
            },
            {
                id: 'document-status',
                description: 'Update document status field references',
                from: 'v1',
                to: 'v2',
                breaking: true,
                transform: (data: any) => {
                    if (data.status !== undefined) {
                        data.state = data.status;
                        delete data.status;
                    }
                    return data;
                },
                manualSteps: [
                    'Update all references from "status" to "state" in client code',
                    'Update database queries to use new field name',
                    'Update UI components to display "state" instead of "status"'
                ]
            },
            {
                id: 'pagination',
                description: 'Migrate to cursor-based pagination',
                from: 'v1',
                to: 'v2',
                breaking: true,
                manualSteps: [
                    'Replace page/limit parameters with cursor/size',
                    'Update pagination UI to use cursor-based navigation',
                    'Implement cursor storage for navigation state'
                ]
            },
            {
                id: 'error-format',
                description: 'Update error handling for new response format',
                from: 'v1',
                to: 'v2',
                breaking: true,
                manualSteps: [
                    'Update error parsing to handle new standardized format',
                    'Update error display components',
                    'Implement new error code handling'
                ]
            }
        ],
        resources: {
            documentation: '/api/docs/migration/v1-to-v2',
            examples: '/api/docs/migration/v1-to-v2/examples',
            support: '/support/migration'
        }
    },
    {
        from: 'v2',
        to: 'v3',
        complexity: 'high',
        estimatedTime: '4-8 weeks',
        steps: [
            {
                id: 'field-selection',
                description: 'Implement GraphQL-style field selection',
                from: 'v2',
                to: 'v3',
                breaking: true,
                manualSteps: [
                    'Add field selection parameters to all API calls',
                    'Update response parsing to handle variable field sets',
                    'Optimize network usage with selective field requests'
                ]
            },
            {
                id: 'unified-uris',
                description: 'Migrate to unified resource identifiers',
                from: 'v2',
                to: 'v3',
                breaking: true,
                manualSteps: [
                    'Replace entity IDs with URIs in all API calls',
                    'Update local storage and caching to use URIs',
                    'Implement URI parsing and validation'
                ]
            },
            {
                id: 'webhook-subscriptions',
                description: 'Implement mandatory webhook subscriptions',
                from: 'v2',
                to: 'v3',
                breaking: true,
                manualSteps: [
                    'Set up webhook endpoints for all event types',
                    'Implement webhook signature verification',
                    'Update application architecture for event-driven updates'
                ]
            },
            {
                id: 'oauth-pkce',
                description: 'Upgrade to OAuth 2.1 with PKCE',
                from: 'v2',
                to: 'v3',
                breaking: true,
                manualSteps: [
                    'Implement PKCE flow for all OAuth authentication',
                    'Update client registration to support PKCE',
                    'Remove support for implicit grant flow'
                ]
            }
        ],
        resources: {
            documentation: '/api/docs/migration/v2-to-v3',
            examples: '/api/docs/migration/v2-to-v3/examples',
            support: '/support/migration'
        }
    }
];

/**
 * Main version configuration
 */
export const versionConfig: VersionConfig = {
    defaultVersion: 'v1',
    latestVersion: 'v1',
    supportedVersions: ['v1', 'v2', 'v3'],
    versions: versionMetadata,
    strategies: ['url', 'header', 'query'],
    includeDeprecationWarnings: true,
    requireVersionSpecification: false
};

/**
 * Get version metadata by version
 */
export function getVersionMetadata(version: APIVersion): VersionMetadata {
    return versionMetadata[version];
}

/**
 * Get migration guide for version transition
 */
export function getMigrationGuide(from: APIVersion, to: APIVersion): MigrationGuide | null {
    return migrationGuides.find(guide => guide.from === from && guide.to === to) || null;
}

/**
 * Check if version is supported
 */
export function isVersionSupported(version: string): version is APIVersion {
    return versionConfig.supportedVersions.includes(version as APIVersion);
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: APIVersion): boolean {
    return versionMetadata[version].deprecated;
}

/**
 * Check if version is sunset
 */
export function isVersionSunset(version: APIVersion): boolean {
    const metadata = versionMetadata[version];
    if (!metadata.sunset) return false;

    const sunsetDate = new Date(metadata.sunset);
    return new Date() > sunsetDate;
}

/**
 * Get all available versions with their status
 */
export function getAvailableVersions() {
    return versionConfig.supportedVersions.map(version => ({
        ...versionMetadata[version],
        isCurrent: version === versionConfig.latestVersion,
        isDefault: version === versionConfig.defaultVersion
    }));
}

/**
 * Get deprecation timeline for planning
 */
export function getDeprecationTimeline() {
    return Object.values(versionMetadata)
        .filter(metadata => metadata.deprecated || metadata.sunset)
        .map(metadata => ({
            version: metadata.version,
            status: metadata.status,
            sunset: metadata.sunset,
            endOfLife: metadata.endOfLife,
            migrationGuide: metadata.migrationGuide
        }))
        .sort((a, b) => {
            if (!a.sunset && !b.sunset) return 0;
            if (!a.sunset) return 1;
            if (!b.sunset) return -1;
            return new Date(a.sunset).getTime() - new Date(b.sunset).getTime();
        });
}