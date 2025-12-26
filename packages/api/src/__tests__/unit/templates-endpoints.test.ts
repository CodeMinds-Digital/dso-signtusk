import { describe, it, expect, beforeAll } from 'vitest';
import { createSimpleTestAPIServer } from '../simple-test-server';
import type { OpenAPIHono } from '@hono/zod-openapi';
import jwt from 'jsonwebtoken';

/**
 * Unit tests for Templates API endpoints
 * Tests all template endpoints for proper functionality, validation, and error handling
 */

describe('Templates API Endpoints - Unit Tests', () => {
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

    describe('GET /api/v1/templates', () => {
        it('should list templates with authentication', async () => {
            const response = await app.request('/api/v1/templates', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('templates');
            expect(Array.isArray(data.templates)).toBe(true);
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('page');
            expect(data).toHaveProperty('pageSize');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates');
            expect(response.status).toBe(401);
        });

        it('should support filtering by category', async () => {
            const response = await app.request('/api/v1/templates?category=contract', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('templates');
        });

        it('should support search functionality', async () => {
            const response = await app.request('/api/v1/templates?search=employment', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('templates');
        });
    });

    describe('GET /api/v1/templates/:id', () => {
        it('should get template by ID', async () => {
            const response = await app.request('/api/v1/templates/template_123', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const data = await response.json();
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('name');
                expect(data).toHaveProperty('fields');
                expect(data).toHaveProperty('recipients');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123');
            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/templates', () => {
        it('should create template with valid data', async () => {
            const response = await app.request('/api/v1/templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Employment Contract Template',
                    description: 'Standard employment contract template',
                    category: 'employment',
                    documentId: 'doc_123',
                    fields: [
                        {
                            type: 'signature',
                            name: 'employee_signature',
                            x: 100,
                            y: 200,
                            width: 200,
                            height: 50,
                            required: true
                        }
                    ],
                    recipients: [
                        {
                            role: 'employee',
                            name: 'Employee',
                            order: 1
                        }
                    ]
                })
            });

            expect([200, 201]).toContain(response.status);

            if (response.status === 201) {
                const data = await response.json();
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('name', 'Employment Contract Template');
                expect(data).toHaveProperty('fields');
                expect(data.fields).toHaveLength(1);
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Template'
                })
            });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const response = await app.request('/api/v1/templates', {
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

        it('should validate field definitions', async () => {
            const response = await app.request('/api/v1/templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test Template',
                    documentId: 'doc_123',
                    fields: [
                        {
                            type: 'invalid_type',
                            name: 'test_field'
                        }
                    ]
                })
            });

            expect(response.status).toBe(400);
        });
    });

    describe('PATCH /api/v1/templates/:id', () => {
        it('should update template with valid data', async () => {
            const response = await app.request('/api/v1/templates/template_123', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Updated Template Name',
                    description: 'Updated description'
                })
            });

            expect([200, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Updated Name'
                })
            });

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /api/v1/templates/:id', () => {
        it('should delete template with authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 204, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123', {
                method: 'DELETE'
            });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/templates/:id/instantiate', () => {
        it('should create document from template', async () => {
            const response = await app.request('/api/v1/templates/template_123/instantiate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Contract for John Doe',
                    recipients: [
                        {
                            role: 'employee',
                            email: 'john.doe@example.com',
                            name: 'John Doe'
                        }
                    ],
                    fieldValues: {
                        employee_name: 'John Doe',
                        start_date: '2024-01-01'
                    }
                })
            });

            expect([200, 201, 404]).toContain(response.status);

            if (response.status === 201) {
                const data = await response.json();
                expect(data).toHaveProperty('documentId');
                expect(data).toHaveProperty('signingRequestId');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123/instantiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Document'
                })
            });

            expect(response.status).toBe(401);
        });

        it('should validate recipient mapping', async () => {
            const response = await app.request('/api/v1/templates/template_123/instantiate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test Document',
                    recipients: [
                        {
                            role: 'nonexistent_role',
                            email: 'test@example.com',
                            name: 'Test User'
                        }
                    ]
                })
            });

            expect([400, 404]).toContain(response.status);
        });
    });

    describe('POST /api/v1/templates/:id/share', () => {
        it('should share template with valid permissions', async () => {
            const response = await app.request('/api/v1/templates/template_123/share', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'colleague@example.com',
                    permission: 'view',
                    message: 'Please review this template'
                })
            });

            expect([200, 201, 404]).toContain(response.status);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'colleague@example.com',
                    permission: 'view'
                })
            });

            expect(response.status).toBe(401);
        });

        it('should validate permission values', async () => {
            const response = await app.request('/api/v1/templates/template_123/share', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'colleague@example.com',
                    permission: 'invalid_permission'
                })
            });

            expect([400, 404]).toContain(response.status);
        });
    });

    describe('GET /api/v1/templates/:id/analytics', () => {
        it('should get template usage analytics', async () => {
            const response = await app.request('/api/v1/templates/template_123/analytics', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                const data = await response.json();
                expect(data).toHaveProperty('usageCount');
                expect(data).toHaveProperty('completionRate');
                expect(data).toHaveProperty('averageTimeToComplete');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123/analytics');
            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/templates/:id/duplicate', () => {
        it('should duplicate template', async () => {
            const response = await app.request('/api/v1/templates/template_123/duplicate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Copy of Original Template',
                    description: 'Duplicated template'
                })
            });

            expect([200, 201, 404]).toContain(response.status);

            if (response.status === 201) {
                const data = await response.json();
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('name', 'Copy of Original Template');
            }
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/templates/template_123/duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Duplicate Template'
                })
            });

            expect(response.status).toBe(401);
        });
    });
});