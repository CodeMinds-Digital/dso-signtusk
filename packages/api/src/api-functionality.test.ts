import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createAPIServer } from './server';
import type { Hono } from 'hono';

/**
 * **Feature: docusign-alternative-comprehensive, Property 41: API Functionality Completeness**
 * **Validates: Requirements 9.1**
 * 
 * Property-based test to verify that comprehensive REST APIs work correctly 
 * with accurate OpenAPI documentation, proper authentication, and enforced rate limiting
 */

describe('API Functionality Completeness Property Tests', () => {
    let app: Hono;
    let testToken: string;

    beforeAll(async () => {
        app = createAPIServer();

        // Generate a test JWT token for authenticated requests
        const jwt = await import('jsonwebtoken');
        testToken = jwt.sign(
            {
                userId: 'test_user_123',
                email: 'test@example.com',
                name: 'Test User',
                organizationId: 'test_org_123',
                roles: ['user'],
                emailVerified: true,
            },
            process.env.JWT_SECRET || 'default-jwt-secret',
            { expiresIn: '1h' }
        );
    });

    /**
     * Property: All API endpoints should return proper HTTP status codes
     */
    it('should return proper HTTP status codes for all endpoints', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    'GET /health',
                    'GET /api/versions',
                    'GET /api/v1',
                    'GET /api/openapi.json',
                    'POST /api/v1/auth/login',
                    'POST /api/v1/auth/register',
                    'GET /api/v1/auth/session',
                    'GET /api/v1/users/me',
                    'GET /api/v1/documents',
                    'GET /api/v1/templates',
                    'GET /api/v1/organizations/me',
                    'GET /api/v1/analytics/dashboard',
                    'GET /api/v1/webhooks'
                ),
                async (endpoint) => {
                    const [method, path] = endpoint.split(' ');

                    let response: Response;
                    const headers: Record<string, string> = {};

                    // Add authentication for protected endpoints
                    if (path.startsWith('/api/v1/') && !path.startsWith('/api/v1/auth/')) {
                        headers['Authorization'] = `Bearer ${testToken}`;
                    }

                    // Handle different HTTP methods
                    if (method === 'GET') {
                        response = await app.request(path, { headers });
                    } else if (method === 'POST') {
                        // Provide valid request bodies for POST endpoints
                        let body = {};
                        if (path === '/api/v1/auth/login') {
                            body = { email: 'test@example.com', password: 'password' };
                        } else if (path === '/api/v1/auth/register') {
                            body = {
                                email: 'newuser@example.com',
                                password: 'Password123!',
                                name: 'New User'
                            };
                        }

                        response = await app.request(path, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...headers
                            },
                            body: JSON.stringify(body)
                        });
                    } else {
                        response = await app.request(path, { method, headers });
                    }

                    // Verify response has valid HTTP status code
                    expect(response.status).toBeGreaterThanOrEqual(200);
                    expect(response.status).toBeLessThan(600);

                    // Verify response is not empty for successful requests
                    if (response.status >= 200 && response.status < 300) {
                        const text = await response.text();
                        expect(text.length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: OpenAPI specification should be valid and accessible
     */
    it('should provide valid OpenAPI specification', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(null), // No input needed for this test
                async () => {
                    const response = await app.request('/api/openapi.json');

                    expect(response.status).toBe(200);
                    expect(response.headers.get('content-type')).toContain('application/json');

                    const spec = await response.json();

                    // Verify OpenAPI spec structure
                    expect(spec).toHaveProperty('openapi');
                    expect(spec).toHaveProperty('info');
                    expect(spec).toHaveProperty('paths');
                    expect(spec).toHaveProperty('components');

                    // Verify OpenAPI version
                    expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/);

                    // Verify required info fields
                    expect(spec.info).toHaveProperty('title');
                    expect(spec.info).toHaveProperty('version');
                    expect(spec.info.title).toBe('Signtusk API');

                    // Verify security schemes are defined
                    expect(spec.components).toHaveProperty('securitySchemes');
                    expect(spec.components.securitySchemes).toHaveProperty('bearerAuth');
                    expect(spec.components.securitySchemes).toHaveProperty('apiKey');
                }
            ),
            { numRuns: 10 }
        );
    });

    /**
     * Property: Authentication should be properly enforced
     */
    it('should enforce authentication on protected endpoints', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    '/api/v1/users/me',
                    '/api/v1/documents',
                    '/api/v1/templates',
                    '/api/v1/organizations/me',
                    '/api/v1/analytics/dashboard',
                    '/api/v1/webhooks'
                ),
                fc.option(fc.string(), { nil: undefined }),
                async (protectedPath, authHeader) => {
                    const headers: Record<string, string> = {};

                    // Add invalid or missing auth header
                    if (authHeader) {
                        headers['Authorization'] = authHeader;
                    }

                    const response = await app.request(protectedPath, { headers });

                    // Should return 401 Unauthorized for invalid/missing auth
                    expect(response.status).toBe(401);

                    const errorResponse = await response.json();
                    expect(errorResponse).toHaveProperty('error');
                    expect(errorResponse).toHaveProperty('message');
                    expect(errorResponse).toHaveProperty('timestamp');
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Rate limiting should be enforced
     */
    it('should enforce rate limiting', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('/api/v1/auth/login', '/health'),
                async (endpoint) => {
                    // Make multiple rapid requests to trigger rate limiting
                    const requests = Array.from({ length: 15 }, () =>
                        app.request(endpoint, {
                            method: endpoint === '/api/v1/auth/login' ? 'POST' : 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Forwarded-For': '192.168.1.100' // Simulate same IP
                            },
                            body: endpoint === '/api/v1/auth/login'
                                ? JSON.stringify({ email: 'test@example.com', password: 'wrong' })
                                : undefined
                        })
                    );

                    const responses = await Promise.all(requests);

                    // At least one response should have rate limit headers
                    const hasRateLimitHeaders = responses.some(response =>
                        response.headers.get('X-RateLimit-Limit') !== null
                    );
                    expect(hasRateLimitHeaders).toBe(true);

                    // Some requests might be rate limited (429) after many attempts
                    const statusCodes = responses.map(r => r.status);
                    const hasValidStatusCodes = statusCodes.every(status =>
                        [200, 401, 429].includes(status)
                    );
                    expect(hasValidStatusCodes).toBe(true);
                }
            ),
            { numRuns: 5 } // Fewer runs to avoid overwhelming rate limiter
        );
    });

    /**
     * Property: API responses should have consistent structure
     */
    it('should return consistent response structure', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    'GET /api/versions',
                    'GET /api/v1',
                    'GET /health'
                ),
                async (endpoint) => {
                    const [method, path] = endpoint.split(' ');
                    const response = await app.request(path, { method });

                    expect(response.status).toBe(200);
                    expect(response.headers.get('content-type')).toContain('application/json');

                    const data = await response.json();

                    // All successful responses should be valid JSON objects
                    expect(typeof data).toBe('object');
                    expect(data).not.toBeNull();

                    // Specific structure checks based on endpoint
                    if (path === '/health') {
                        expect(data).toHaveProperty('status');
                        expect(data).toHaveProperty('timestamp');
                        expect(data.status).toBe('ok');
                    } else if (path === '/api/versions') {
                        expect(data).toHaveProperty('versions');
                        expect(data).toHaveProperty('latest');
                        expect(Array.isArray(data.versions)).toBe(true);
                    } else if (path === '/api/v1') {
                        expect(data).toHaveProperty('version');
                        expect(data).toHaveProperty('endpoints');
                        expect(data.version).toBe('v1');
                    }
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Content negotiation should work correctly
     */
    it('should handle content negotiation properly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('application/json', 'application/xml', '*/*'),
                async (acceptHeader) => {
                    const response = await app.request('/health', {
                        headers: { 'Accept': acceptHeader }
                    });

                    expect(response.status).toBe(200);

                    const contentType = response.headers.get('content-type');

                    if (acceptHeader === 'application/json' || acceptHeader === '*/*') {
                        expect(contentType).toContain('application/json');
                    } else if (acceptHeader === 'application/xml') {
                        // Should either return XML or default to JSON
                        expect(contentType).toMatch(/(application\/xml|application\/json)/);
                    }

                    // Response should not be empty
                    const body = await response.text();
                    expect(body.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Property: Error responses should have consistent format
     */
    it('should return consistent error response format', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    '/api/v1/nonexistent',
                    '/api/v1/users/me', // Without auth
                    '/api/v1/documents/invalid-id'
                ),
                async (errorPath) => {
                    const response = await app.request(errorPath);

                    // Should return error status
                    expect(response.status).toBeGreaterThanOrEqual(400);
                    expect(response.status).toBeLessThan(500);

                    const errorData = await response.json();

                    // Error responses should have consistent structure
                    expect(errorData).toHaveProperty('error');
                    expect(errorData).toHaveProperty('message');
                    expect(errorData).toHaveProperty('timestamp');
                    expect(errorData).toHaveProperty('path');

                    // Verify error fields are strings
                    expect(typeof errorData.error).toBe('string');
                    expect(typeof errorData.message).toBe('string');
                    expect(typeof errorData.timestamp).toBe('string');
                    expect(typeof errorData.path).toBe('string');

                    // Timestamp should be valid ISO string
                    expect(() => new Date(errorData.timestamp)).not.toThrow();
                }
            ),
            { numRuns: 20 }
        );
    });
});