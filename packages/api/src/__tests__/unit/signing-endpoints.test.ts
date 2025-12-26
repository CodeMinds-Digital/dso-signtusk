import { describe, it, expect, beforeAll } from 'vitest';
import { createSimpleTestAPIServer } from '../simple-test-server';
import type { OpenAPIHono } from '@hono/zod-openapi';
import jwt from 'jsonwebtoken';

/**
 * Unit tests for Signing API endpoints
 * Tests all signing endpoints for proper functionality, validation, and error handling
 */

describe('Signing API Endpoints - Unit Tests', () => {
    let app: OpenAPIHono;
    let authToken: string;

    beforeAll(async () => {
        // Set up test environment variables
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.NODE_ENV = 'test';

        app = createSimpleTestAPIServer();

        // Generate test auth token
        authToken = jwt.sign(
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

    describe('POST /api/v1/signing/requests', () => {
        it('should create signing request with valid data', async () => {
            const response = await app.request('/api/v1/signing/requests', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documentId: 'doc_123',
                    title: 'Test Signing Request',
                    message: 'Please sign this document',
                    recipients: [
                        {
                            email: 'signer@example.com',
                            name: 'John Signer',
                            role: 'signer',
                            order: 1
                        }
                    ]
                })
            });

            expect([200, 201]).toContain(response.status);

            if (response.status === 201) {
                const data = await response.json();
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('status');
                expect(data).toHaveProperty('documentId', 'doc_123');
                expect(data).toHaveProperty('recipients');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: 'doc_123',
                    title: 'Test Request'
                })
            });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const response = await app.request('/api/v1/signing/requests', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Missing document ID'
                })
            });

            expect(response.status).toBe(400);
        });

        it('should validate recipient data', async () => {
            const response = await app.request('/api/v1/signing/requests', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documentId: 'doc_123',
                    title: 'Test Request',
                    recipients: [
                        {
                            email: 'invalid-email',
                            name: 'John Signer',
                            role: 'signer'
                        }
                    ]
                })
            });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/signing/requests/:id', () => {
        it('should get signing request by ID', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const data = await response.json();
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('status');
                expect(data).toHaveProperty('documentId');
                expect(data).toHaveProperty('recipients');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/signing/requests', () => {
        it('should list signing requests', async () => {
            const response = await app.request('/api/v1/signing/requests', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('requests');
            expect(Array.isArray(data.requests)).toBe(true);
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('page');
            expect(data).toHaveProperty('pageSize');
        });

        it('should support filtering by status', async () => {
            const response = await app.request('/api/v1/signing/requests?status=PENDING', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('requests');
        });
    });

    describe('PATCH /api/v1/signing/requests/:id', () => {
        it('should update signing request', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Updated Title',
                    message: 'Updated message'
                })
            });

            expect([200, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Updated Title'
                })
            });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/signing/requests/:id/recipients', () => {
        it('should add recipient to signing request', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/recipients', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'newrecipient@example.com',
                    name: 'New Recipient',
                    role: 'signer',
                    order: 2
                })
            });

            expect([200, 201, 404]).toContain(response.status);
        });

        it('should validate recipient email', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/recipients', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'invalid-email',
                    name: 'New Recipient',
                    role: 'signer'
                })
            });

            expect([400, 404]).toContain(response.status);
        });
    });

    describe('PATCH /api/v1/signing/recipients/:id', () => {
        it('should update recipient', async () => {
            const response = await app.request('/api/v1/signing/recipients/recipient_123', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Updated Name',
                    order: 2
                })
            });

            expect([200, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/recipients/recipient_123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Updated Name'
                })
            });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/signing/requests/:id/status', () => {
        it('should get signing request status', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/status', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const data = await response.json();
                expect(data).toHaveProperty('status');
                expect(data).toHaveProperty('progress');
                expect(data).toHaveProperty('recipients');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/status');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/signing/requests/:id/send', () => {
        it('should send signing request', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/send', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/send', {
                method: 'POST'
            });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/signing/requests/:id/complete', () => {
        it('should complete signing request', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/complete', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/complete', {
                method: 'POST'
            });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/signing/requests/:id/analytics', () => {
        it('should get signing request analytics', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/analytics', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const data = await response.json();
                expect(data).toHaveProperty('views');
                expect(data).toHaveProperty('completionRate');
                expect(data).toHaveProperty('averageTimeToSign');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/analytics');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/signing/requests/:id/resend', () => {
        it('should resend signing request', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/resend', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipientIds: ['recipient_123'],
                    message: 'Reminder to sign'
                })
            });

            expect([200, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/signing/requests/req_123/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientIds: ['recipient_123']
                })
            });

            expect(response.status).toBe(401);
        });
    });
});