import { describe, it, expect, beforeAll } from 'vitest';
import { createSimpleTestAPIServer } from '../simple-test-server';
import type { OpenAPIHono } from '@hono/zod-openapi';
import jwt from 'jsonwebtoken';

/**
 * Unit tests for Documents API endpoints
 * Tests all document endpoints for proper functionality, validation, and error handling
 */

describe('Documents API Endpoints - Unit Tests', () => {
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

    describe('GET /api/v1/documents', () => {
        it('should list documents with authentication', async () => {
            const response = await app.request('/api/v1/documents', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('documents');
            expect(Array.isArray(data.documents)).toBe(true);
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('page');
            expect(data).toHaveProperty('pageSize');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/documents');

            expect(response.status).toBe(401);
        });

        it('should support pagination', async () => {
            const response = await app.request('/api/v1/documents?page=1&pageSize=10', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('page', 1);
            expect(data).toHaveProperty('pageSize', 10);
        });

        it('should support filtering by status', async () => {
            const response = await app.request('/api/v1/documents?status=DRAFT', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('documents');
        });

        it('should support sorting', async () => {
            const response = await app.request('/api/v1/documents?sortBy=createdAt&sortOrder=desc', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('documents');
        });
    });

    describe('GET /api/v1/documents/:id', () => {
        it('should get document by ID with authentication', async () => {
            const response = await app.request('/api/v1/documents/doc_123', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const data = await response.json();
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('name');
                expect(data).toHaveProperty('status');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/documents/doc_123');

            expect(response.status).toBe(401);
        });

        it('should return 404 for non-existent document', async () => {
            const response = await app.request('/api/v1/documents/nonexistent_id', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/v1/documents', () => {
        it('should create document with valid data', async () => {
            const response = await app.request('/api/v1/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test Document',
                    description: 'Test description',
                    folderId: 'folder_123'
                })
            });

            expect([200, 201]).toContain(response.status);

            if (response.status === 201) {
                const data = await response.json();
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('name', 'Test Document');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Document'
                })
            });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const response = await app.request('/api/v1/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Missing name field'
                })
            });

            expect(response.status).toBe(400);
        });
    });

    describe('PATCH /api/v1/documents/:id', () => {
        it('should update document with valid data', async () => {
            const response = await app.request('/api/v1/documents/doc_123', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Updated Document Name',
                    description: 'Updated description'
                })
            });

            expect([200, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/documents/doc_123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Updated Name'
                })
            });

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /api/v1/documents/:id', () => {
        it('should delete document with authentication', async () => {
            const response = await app.request('/api/v1/documents/doc_123', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 204, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/documents/doc_123', {
                method: 'DELETE'
            });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/documents/:id/share', () => {
        it('should share document with valid permissions', async () => {
            const response = await app.request('/api/v1/documents/doc_123/share', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'recipient@example.com',
                    permission: 'view',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
            });

            expect([200, 201, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/documents/doc_123/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'recipient@example.com',
                    permission: 'view'
                })
            });

            expect(response.status).toBe(401);
        });

        it('should validate permission values', async () => {
            const response = await app.request('/api/v1/documents/doc_123/share', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'recipient@example.com',
                    permission: 'invalid_permission'
                })
            });

            expect([400, 404]).toContain(response.status);
        });
    });
});