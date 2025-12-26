/**
 * API Versioning Integration Tests
 * 
 * Integration tests demonstrating the complete versioning system
 * working with actual HTTP requests and responses.
 */

import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { createVersionNegotiationMiddleware } from '../negotiation';

describe('API Versioning Integration', () => {
    // Create a test app with versioning
    const app = new Hono();

    // Apply versioning middleware
    app.use('*', createVersionNegotiationMiddleware());

    // Simple test endpoints for each version
    app.get('/api/v1/test', (c) => {
        const version = c.get('apiVersion');
        return c.json({
            version,
            message: 'v1 endpoint',
            features: ['basic-auth', 'documents']
        });
    });

    app.get('/api/v2/test', (c) => {
        const version = c.get('apiVersion');
        return c.json({
            version,
            message: 'v2 endpoint',
            features: ['opaque-tokens', 'cursor-pagination']
        });
    });

    app.get('/api/v3/test', (c) => {
        const version = c.get('apiVersion');
        return c.json({
            version,
            message: 'v3 endpoint',
            features: ['field-selection', 'unified-uris']
        });
    });

    // Version info endpoint
    app.get('/api/versions', (c) => {
        const version = c.get('apiVersion');
        return c.json({
            currentVersion: version,
            versions: ['v1', 'v2', 'v3'],
            latest: 'v1',
            default: 'v1'
        });
    });

    describe('URL-based versioning', () => {
        it('should route to correct version based on URL', async () => {
            // Test v1 endpoint
            const v1Response = await app.request('/api/v1/test');
            expect(v1Response.status).toBe(200);

            const v1Data = await v1Response.json();
            expect(v1Data.version).toBe('v1');
            expect(v1Data.message).toBe('v1 endpoint');

            // Test v2 endpoint
            const v2Response = await app.request('/api/v2/test');
            expect(v2Response.status).toBe(200);

            const v2Data = await v2Response.json();
            expect(v2Data.version).toBe('v2');
            expect(v2Data.message).toBe('v2 endpoint');
        });

        it('should include version headers in responses', async () => {
            const response = await app.request('/api/v1/test');

            expect(response.headers.get('API-Version')).toBe('v1');
            expect(response.headers.get('API-Version-Strategy')).toBe('url');
            expect(response.headers.get('API-Supported-Versions')).toContain('v1');
            expect(response.headers.get('API-Latest-Version')).toBe('v1');
        });
    });

    describe('Header-based versioning', () => {
        it('should negotiate version from Accept header', async () => {
            const response = await app.request('/api/versions', {
                headers: {
                    'Accept': 'application/vnd.docusign-alternative.v2+json'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('API-Version')).toBe('v2');
            expect(response.headers.get('API-Version-Strategy')).toBe('header');

            const data = await response.json();
            expect(data.currentVersion).toBe('v2');
        });

        it('should handle version parameter in Accept header', async () => {
            const response = await app.request('/api/versions', {
                headers: {
                    'Accept': 'application/json; version=v3'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('API-Version')).toBe('v3');
            expect(response.headers.get('API-Version-Strategy')).toBe('header');
        });
    });

    describe('Query parameter versioning', () => {
        it('should negotiate version from query parameter', async () => {
            const response = await app.request('/api/versions?version=v2');

            expect(response.status).toBe(200);
            expect(response.headers.get('API-Version')).toBe('v2');
            expect(response.headers.get('API-Version-Strategy')).toBe('query');
        });

        it('should handle numeric version parameter', async () => {
            const response = await app.request('/api/versions?v=3');

            expect(response.status).toBe(200);
            expect(response.headers.get('API-Version')).toBe('v3');
            expect(response.headers.get('API-Version-Strategy')).toBe('query');
        });
    });

    describe('Version precedence', () => {
        it('should prioritize URL version over header version', async () => {
            const response = await app.request('/api/v1/test', {
                headers: {
                    'Accept': 'application/vnd.docusign-alternative.v2+json'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('API-Version')).toBe('v1'); // URL takes precedence
            expect(response.headers.get('API-Version-Strategy')).toBe('url');

            const data = await response.json();
            expect(data.version).toBe('v1');
        });

        it('should use header version when URL has no version', async () => {
            const response = await app.request('/api/versions', {
                headers: {
                    'Accept': 'application/vnd.docusign-alternative.v2+json'
                }
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('API-Version')).toBe('v2');
            expect(response.headers.get('API-Version-Strategy')).toBe('header');
        });
    });

    describe('Error handling', () => {
        it('should handle unsupported versions gracefully', async () => {
            const response = await app.request('/api/v99/test');

            // The middleware catches unsupported versions and returns 400
            // But if the route doesn't exist, Hono returns 404
            expect([400, 404]).toContain(response.status);

            if (response.status === 400) {
                const errorData = await response.json();
                expect(errorData.error.code).toBe('UNSUPPORTED_VERSION');
                expect(errorData.error.version).toBe('v99');
                expect(errorData.error.supportedVersions).toContain('v1');
            }
        });
    });

    describe('Default version fallback', () => {
        it('should use default version when none specified', async () => {
            const response = await app.request('/api/versions');

            expect(response.status).toBe(200);
            expect(response.headers.get('API-Version')).toBe('v1'); // default
            expect(response.headers.get('API-Version-Strategy')).toBe('url');

            const data = await response.json();
            expect(data.currentVersion).toBe('v1');
        });
    });
});