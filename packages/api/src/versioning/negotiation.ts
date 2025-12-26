/**
 * API Version Negotiation
 * 
 * This module handles version negotiation from HTTP requests,
 * supporting multiple strategies for version specification.
 */

import { Context } from 'hono';
import {
    APIVersion,
    VersioningStrategy,
    VersionNegotiationResult,
    UnsupportedVersionError,
    DeprecatedVersionError,
    SunsetVersionError
} from './types';
import {
    versionConfig,
    isVersionSupported,
    isVersionDeprecated,
    isVersionSunset,
    getVersionMetadata
} from './config';

/**
 * Extract version from URL path
 * Supports patterns like /api/v1/users, /v2/documents, etc.
 */
function extractVersionFromURL(path: string): APIVersion | null {
    const urlVersionMatch = path.match(/\/v(\d+)(?:\/|$)/);
    if (urlVersionMatch) {
        const version = `v${urlVersionMatch[1]}` as APIVersion;
        return isVersionSupported(version) ? version : null;
    }
    return null;
}

/**
 * Extract version from Accept header
 * Supports formats like:
 * - application/vnd.docusign-alternative.v1+json
 * - application/json; version=v1
 * - application/vnd.api+json; version=1
 */
function extractVersionFromHeader(acceptHeader: string): APIVersion | null {
    // Vendor-specific media type with version
    const vendorMatch = acceptHeader.match(/application\/vnd\.docusign-alternative\.v(\d+)\+json/);
    if (vendorMatch) {
        const version = `v${vendorMatch[1]}` as APIVersion;
        return isVersionSupported(version) ? version : null;
    }

    // Version parameter in media type
    const parameterMatch = acceptHeader.match(/version=v?(\d+)/);
    if (parameterMatch) {
        const version = `v${parameterMatch[1]}` as APIVersion;
        return isVersionSupported(version) ? version : null;
    }

    return null;
}

/**
 * Extract version from query parameter
 * Supports ?version=v1, ?v=1, ?api_version=v1
 */
function extractVersionFromQuery(url: URL): APIVersion | null {
    const versionParams = ['version', 'v', 'api_version'];

    for (const param of versionParams) {
        const value = url.searchParams.get(param);
        if (value) {
            const version = value.startsWith('v') ? value as APIVersion : `v${value}` as APIVersion;
            return isVersionSupported(version) ? version : null;
        }
    }

    return null;
}

/**
 * Extract version from subdomain
 * Supports patterns like v1.api.example.com, api-v2.example.com
 */
function extractVersionFromSubdomain(hostname: string): APIVersion | null {
    // Direct version subdomain (v1.api.example.com)
    const directMatch = hostname.match(/^v(\d+)\./);
    if (directMatch) {
        const version = `v${directMatch[1]}` as APIVersion;
        return isVersionSupported(version) ? version : null;
    }

    // Version in subdomain (api-v1.example.com)
    const embeddedMatch = hostname.match(/v(\d+)/);
    if (embeddedMatch) {
        const version = `v${embeddedMatch[1]}` as APIVersion;
        return isVersionSupported(version) ? version : null;
    }

    return null;
}

/**
 * Negotiate API version from HTTP request
 */
export function negotiateVersion(c: Context): VersionNegotiationResult {
    const url = new URL(c.req.url);
    const acceptHeader = c.req.header('Accept') || '';
    const hostname = url.hostname;
    const path = url.pathname;

    let version: APIVersion | null = null;
    let strategy: VersioningStrategy | null = null;
    let explicit = false;

    // Try each enabled strategy in order of preference
    for (const enabledStrategy of versionConfig.strategies) {
        switch (enabledStrategy) {
            case 'url':
                version = extractVersionFromURL(path);
                if (version) {
                    strategy = 'url';
                    explicit = true;
                }
                break;

            case 'header':
                if (!version) {
                    version = extractVersionFromHeader(acceptHeader);
                    if (version) {
                        strategy = 'header';
                        explicit = true;
                    }
                }
                break;

            case 'query':
                if (!version) {
                    version = extractVersionFromQuery(url);
                    if (version) {
                        strategy = 'query';
                        explicit = true;
                    }
                }
                break;

            case 'subdomain':
                if (!version) {
                    version = extractVersionFromSubdomain(hostname);
                    if (version) {
                        strategy = 'subdomain';
                        explicit = true;
                    }
                }
                break;
        }

        if (version) break;
    }

    // Fall back to default version if none specified
    if (!version) {
        version = versionConfig.defaultVersion;
        strategy = 'url'; // Default strategy
        explicit = false;
    }

    // Validate version support and status
    if (!isVersionSupported(version)) {
        throw new UnsupportedVersionError(version, versionConfig.supportedVersions);
    }

    // Check for sunset versions
    if (isVersionSunset(version)) {
        throw new SunsetVersionError(version);
    }

    // Collect warnings for deprecated versions
    const warnings: string[] = [];
    if (isVersionDeprecated(version)) {
        const metadata = getVersionMetadata(version);
        const sunsetMessage = metadata.sunset
            ? ` It will be sunset on ${metadata.sunset}.`
            : '';
        warnings.push(
            `API version ${version} is deprecated.${sunsetMessage} Please migrate to version ${versionConfig.latestVersion}.`
        );

        if (metadata.migrationGuide) {
            warnings.push(`Migration guide available at: ${metadata.migrationGuide}`);
        }
    }

    return {
        version,
        strategy: strategy!,
        explicit,
        warnings
    };
}

/**
 * Validate version specification requirements
 */
export function validateVersionRequirement(result: VersionNegotiationResult): void {
    if (versionConfig.requireVersionSpecification && !result.explicit) {
        throw new Error(
            'API version must be explicitly specified. ' +
            `Supported methods: ${versionConfig.strategies.join(', ')}`
        );
    }
}

/**
 * Get version-specific response headers
 */
export function getVersionHeaders(result: VersionNegotiationResult): Record<string, string> {
    const headers: Record<string, string> = {
        'API-Version': result.version,
        'API-Version-Strategy': result.strategy,
        'API-Supported-Versions': versionConfig.supportedVersions.join(', '),
        'API-Latest-Version': versionConfig.latestVersion
    };

    // Add deprecation warnings
    if (result.warnings.length > 0 && versionConfig.includeDeprecationWarnings) {
        headers['API-Deprecation-Warning'] = result.warnings.join('; ');

        // Add standard Deprecation header if version is deprecated
        if (isVersionDeprecated(result.version)) {
            const metadata = getVersionMetadata(result.version);
            headers['Deprecation'] = 'true';
            if (metadata.sunset) {
                headers['Sunset'] = metadata.sunset;
            }
        }
    }

    return headers;
}

/**
 * Create version-aware response with appropriate headers
 */
export function createVersionedResponse(
    c: Context,
    result: VersionNegotiationResult,
    data: any,
    status: number = 200
) {
    const headers = getVersionHeaders(result);

    // Add headers to response
    Object.entries(headers).forEach(([key, value]) => {
        c.header(key, value);
    });

    // Include version info in response body for debugging
    const responseData = {
        ...data,
        _meta: {
            version: result.version,
            strategy: result.strategy,
            explicit: result.explicit,
            ...(result.warnings.length > 0 && { warnings: result.warnings })
        }
    };

    return c.json(responseData, status);
}

/**
 * Middleware factory for automatic version negotiation
 */
export function createVersionNegotiationMiddleware() {
    return async (c: Context, next: () => Promise<void>) => {
        try {
            // Negotiate version
            const versionResult = negotiateVersion(c);

            // Validate requirements
            validateVersionRequirement(versionResult);

            // Store version info in context for use by handlers
            c.set('apiVersion', versionResult.version);
            c.set('versionResult', versionResult);

            // Add version headers
            const headers = getVersionHeaders(versionResult);
            Object.entries(headers).forEach(([key, value]) => {
                c.header(key, value);
            });

            await next();
        } catch (error) {
            if (error instanceof UnsupportedVersionError ||
                error instanceof DeprecatedVersionError ||
                error instanceof SunsetVersionError) {
                return c.json({
                    error: {
                        code: error.code,
                        message: error.message,
                        version: error.version,
                        supportedVersions: versionConfig.supportedVersions,
                        latestVersion: versionConfig.latestVersion
                    }
                }, 400);
            }
            throw error;
        }
    };
}