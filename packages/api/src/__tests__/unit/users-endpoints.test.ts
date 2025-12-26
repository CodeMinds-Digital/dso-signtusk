import { describe, it, expect, beforeAll } from 'vitest';
import { createSimpleTestAPIServer } from '../simple-test-server';
import type { Hono } from 'hono';
import jwt from 'jsonwebtoken';

/**
 * Unit tests for Users API endpoints
 * Tests all user endpoints for proper functionality, validation, and error handling
 */

describe('Users API Endpoints - Unit Tests', () => {
    let app: Hono;
    let authToken: string;

    beforeAll(async () => {
        // Set up test environment variables
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.NODE_ENV = 'test';

        app = createSimpleTestAPIServer();

        // Generate test auth token with proper payload structure
        authToken = jwt.sign(
            {
                userId: 'test_user_123',
                email: 'test@example.com',
                name: 'Test User',
                organizationId: 'test_org_123',
                roles: ['user'],
                emailVerified: true,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    describe('GET /api/v1/users/me', () => {
        it('should get current user profile', async () => {
            const response = await app.request('/api/v1/users/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('user');
            expect(data.user).toHaveProperty('id');
            expect(data.user).toHaveProperty('email');
            expect(data.user).toHaveProperty('name');
            expect(data.user).toHaveProperty('organizationId');
            expect(data.user).toHaveProperty('roles');
            expect(data.user).toHaveProperty('emailVerified');
            expect(data.user).toHaveProperty('preferences');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/users/me');
            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /api/v1/users/me', () => {
        it('should update current user profile', async () => {
            const response = await app.request('/api/v1/users/me', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Updated Name',
                    preferences: {
                        language: 'en-US',
                        timezone: 'America/New_York',
                        notifications: {
                            email: true,
                            push: false
                        }
                    }
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('user');
            expect(data.user).toHaveProperty('name', 'Updated Name');
            expect(data).toHaveProperty('message');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Updated Name'
                })
            });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/users/me/password', () => {
        it('should change password with valid current password', async () => {
            const response = await app.request('/api/v1/users/me/password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: 'CurrentPassword123!',
                    newPassword: 'NewPassword456!'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('message');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/users/me/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: 'current',
                    newPassword: 'NewPassword123!'
                })
            });

            expect(response.status).toBe(401);
        });

        it('should validate password strength', async () => {
            const response = await app.request('/api/v1/users/me/password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: 'CurrentPassword123!',
                    newPassword: 'weak'
                })
            });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/users/me/activity', () => {
        it('should get user activity log', async () => {
            const response = await app.request('/api/v1/users/me/activity', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('data');
            expect(Array.isArray(data.data)).toBe(true);
            expect(data).toHaveProperty('pagination');
            expect(data.pagination).toHaveProperty('page');
            expect(data.pagination).toHaveProperty('limit');
            expect(data.pagination).toHaveProperty('total');
        });

        it('should support pagination', async () => {
            const response = await app.request('/api/v1/users/me/activity?page=1&limit=10', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.pagination).toHaveProperty('page', 1);
            expect(data.pagination).toHaveProperty('limit', 10);
        });

        it('should support filtering by activity type', async () => {
            const response = await app.request('/api/v1/users/me/activity?type=document', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('data');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/users/me/activity');
            expect(response.status).toBe(401);
        });
    });
});