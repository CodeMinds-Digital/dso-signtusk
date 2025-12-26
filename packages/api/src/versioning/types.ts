/**
 * API Versioning Types and Interfaces
 * 
 * This module defines the core types and interfaces for the API versioning system,
 * supporting both URL-based and header-based versioning strategies.
 */

import { z } from 'zod';

/**
 * Supported API version formats
 */
export type APIVersion = 'v1' | 'v2' | 'v3';

/**
 * Version status indicates the lifecycle stage of an API version
 */
export type VersionStatus =
    | 'development'    // Version is in active development
    | 'beta'          // Version is in beta testing
    | 'stable'        // Version is stable and recommended
    | 'deprecated'    // Version is deprecated but still supported
    | 'sunset';       // Version is no longer supported

/**
 * Versioning strategy determines how version is extracted from requests
 */
export type VersioningStrategy =
    | 'url'           // Version specified in URL path (/api/v1/...)
    | 'header'        // Version specified in Accept header
    | 'query'         // Version specified as query parameter
    | 'subdomain';    // Version specified as subdomain (v1.api.example.com)

/**
 * Version metadata contains information about a specific API version
 */
export interface VersionMetadata {
    /** Version identifier */
    version: APIVersion;

    /** Current status of this version */
    status: VersionStatus;

    /** URL path for this version */
    path: string;

    /** Documentation URL for this version */
    documentation: string;

    /** Whether this version is deprecated */
    deprecated: boolean;

    /** Sunset date for deprecated versions (ISO 8601) */
    sunset: string | null;

    /** Release date (ISO 8601) */
    releaseDate: string;

    /** End of life date (ISO 8601) */
    endOfLife: string | null;

    /** Breaking changes from previous version */
    breakingChanges: string[];

    /** Migration guide URL */
    migrationGuide: string | null;

    /** Supported features in this version */
    features: string[];
}

/**
 * Version negotiation result
 */
export interface VersionNegotiationResult {
    /** Resolved version */
    version: APIVersion;

    /** Strategy used to determine version */
    strategy: VersioningStrategy;

    /** Whether version was explicitly requested */
    explicit: boolean;

    /** Warning messages for deprecated versions */
    warnings: string[];
}

/**
 * Version configuration for the API
 */
export interface VersionConfig {
    /** Default version when none specified */
    defaultVersion: APIVersion;

    /** Latest stable version */
    latestVersion: APIVersion;

    /** All supported versions */
    supportedVersions: APIVersion[];

    /** Version metadata for each supported version */
    versions: Record<APIVersion, VersionMetadata>;

    /** Enabled versioning strategies */
    strategies: VersioningStrategy[];

    /** Whether to include deprecation warnings in responses */
    includeDeprecationWarnings: boolean;

    /** Whether to enforce version specification */
    requireVersionSpecification: boolean;
}

/**
 * Migration step for automated migration tools
 */
export interface MigrationStep {
    /** Step identifier */
    id: string;

    /** Human-readable description */
    description: string;

    /** Source version */
    from: APIVersion;

    /** Target version */
    to: APIVersion;

    /** Whether this step is breaking */
    breaking: boolean;

    /** Automated transformation function */
    transform?: (data: any) => any;

    /** Manual steps required */
    manualSteps: string[];
}

/**
 * Migration guide for version transitions
 */
export interface MigrationGuide {
    /** Source version */
    from: APIVersion;

    /** Target version */
    to: APIVersion;

    /** Migration steps */
    steps: MigrationStep[];

    /** Estimated migration time */
    estimatedTime: string;

    /** Migration complexity level */
    complexity: 'low' | 'medium' | 'high';

    /** Additional resources */
    resources: {
        documentation: string;
        examples: string;
        support: string;
    };
}

/**
 * Zod schemas for validation
 */
export const APIVersionSchema = z.enum(['v1', 'v2', 'v3']);

export const VersionStatusSchema = z.enum([
    'development',
    'beta',
    'stable',
    'deprecated',
    'sunset'
]);

export const VersioningStrategySchema = z.enum([
    'url',
    'header',
    'query',
    'subdomain'
]);

export const VersionMetadataSchema = z.object({
    version: APIVersionSchema,
    status: VersionStatusSchema,
    path: z.string(),
    documentation: z.string().url(),
    deprecated: z.boolean(),
    sunset: z.string().datetime().nullable(),
    releaseDate: z.string().datetime(),
    endOfLife: z.string().datetime().nullable(),
    breakingChanges: z.array(z.string()),
    migrationGuide: z.string().url().nullable(),
    features: z.array(z.string())
});

export const VersionConfigSchema = z.object({
    defaultVersion: APIVersionSchema,
    latestVersion: APIVersionSchema,
    supportedVersions: z.array(APIVersionSchema),
    versions: z.record(APIVersionSchema, VersionMetadataSchema),
    strategies: z.array(VersioningStrategySchema),
    includeDeprecationWarnings: z.boolean(),
    requireVersionSpecification: z.boolean()
});

/**
 * Error types for versioning
 */
export class VersioningError extends Error {
    constructor(
        message: string,
        public code: string,
        public version?: string
    ) {
        super(message);
        this.name = 'VersioningError';
    }
}

export class UnsupportedVersionError extends VersioningError {
    constructor(version: string, supportedVersions: APIVersion[]) {
        super(
            `API version '${version}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
            'UNSUPPORTED_VERSION',
            version
        );
    }
}

export class DeprecatedVersionError extends VersioningError {
    constructor(version: APIVersion, sunset: string | null) {
        const sunsetMessage = sunset
            ? ` and will be sunset on ${sunset}`
            : '';
        super(
            `API version '${version}' is deprecated${sunsetMessage}. Please migrate to a newer version.`,
            'DEPRECATED_VERSION',
            version
        );
    }
}

export class SunsetVersionError extends VersioningError {
    constructor(version: APIVersion) {
        super(
            `API version '${version}' has been sunset and is no longer supported.`,
            'SUNSET_VERSION',
            version
        );
    }
}