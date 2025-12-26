import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestAPIServer } from '../test-server';
import type { Hono } from 'hono';

/**
 * Unit tests for Authentication API endpoints
 * Tests all auth endpoints for proper functionality, validation, and error handling
 */

describe('Authentication API Endpoints - Unit Tests', () => {
    let app: Hono;

    beforeAll(async () => {
        app = createTestAPIServer();
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password',
                    rememberMe: false
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('sessionToken');
            expect(data).toHaveProperty('user');
            expect(data).toHaveProperty('expiresAt');
            expect(data.user).toHaveProperty('id');
            expect(data.user).toHaveProperty('email', 'test@example.com');
        });

        it('should reject invalid credentials', async () => {
            const response = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
            });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data).toHaveProperty('error', 'Invalid credentials');
        });

        it('should validate email format', async () => {
            const response = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: 'password'
                })
            });

            expect(response.status).toBe(400);
        });

        it('should require password', async () => {
            const response = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com'
                })
            });

            expect(response.status).toBe(400);
        });

        it('should handle remember me option', async () => {
            const response = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password',
                    rememberMe: true
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);

            // Verify extended expiration for remember me
            const expiresAt = new Date(data.expiresAt);
            const now = new Date();
            const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBeGreaterThan(25); // Should be ~30 days
        });
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register with valid data', async () => {
            const response = await app.request('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'newuser@example.com',
                    password: 'Password123!',
                    name: 'New User',
                    organizationName: 'Test Org'
                })
            });

            expect(response.status).toBe(201);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('user');
            expect(data).toHaveProperty('message');
            expect(data.user).toHaveProperty('email', 'newuser@example.com');
            expect(data.user).toHaveProperty('name', 'New User');
            expect(data.user).toHaveProperty('emailVerified', false);
        });

        it('should validate password strength', async () => {
            const weakPasswords = [
                'weak',
                '12345678',
                'password',
                'Password',
                'Password123',
                'password123!'
            ];

            for (const password of weakPasswords) {
                const response = await app.request('/api/v1/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password,
                        name: 'Test User'
                    })
                });

                expect(response.status).toBe(400);
            }
        });

        it('should require all mandatory fields', async () => {
            const incompleteData = [
                { password: 'Password123!', name: 'Test' }, // Missing email
                { email: 'test@example.com', name: 'Test' }, // Missing password
                { email: 'test@example.com', password: 'Password123!' } // Missing name
            ];

            for (const data of incompleteData) {
                const response = await app.request('/api/v1/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                expect(response.status).toBe(400);
            }
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout successfully with valid token', async () => {
            // First login to get a token
            const loginResponse = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password'
                })
            });

            const loginData = await loginResponse.json();
            const token = loginData.sessionToken;

            // Then logout
            const response = await app.request('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('message', 'Logged out successfully');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/v1/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/auth/session', () => {
        it('should return session info with valid token', async () => {
            // First login to get a token
            const loginResponse = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password'
                })
            });

            const loginData = await loginResponse.json();
            const token = loginData.sessionToken;

            // Get session info
            const response = await app.request('/api/v1/auth/session', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('authenticated', true);
            expect(data).toHaveProperty('user');
            expect(data).toHaveProperty('sessionId');
            expect(data).toHaveProperty('expiresAt');
            expect(data.user).toHaveProperty('email');
            expect(data.user).toHaveProperty('roles');
        });

        it('should return 401 without valid token', async () => {
            const response = await app.request('/api/v1/auth/session');

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data).toHaveProperty('authenticated', false);
        });
    });

    describe('POST /api/v1/auth/validate-password', () => {
        it('should validate strong password', async () => {
            const response = await app.request('/api/v1/auth/validate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: 'StrongPassword123!'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('isValid', true);
            expect(data).toHaveProperty('errors');
            expect(data).toHaveProperty('strength');
            expect(data.errors).toHaveLength(0);
            expect(['fair', 'good', 'strong']).toContain(data.strength);
        });

        it('should identify weak password issues', async () => {
            const response = await app.request('/api/v1/auth/validate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: 'weak'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('isValid', false);
            expect(data).toHaveProperty('errors');
            expect(data.errors.length).toBeGreaterThan(0);
            expect(data).toHaveProperty('strength', 'weak');
        });

        it('should provide detailed password requirements', async () => {
            const response = await app.request('/api/v1/auth/validate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: 'short'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.errors).toContain('Password must be at least 8 characters long');
            expect(data.errors).toContain('Password must contain at least one uppercase letter');
            expect(data.errors).toContain('Password must contain at least one number');
            expect(data.errors).toContain('Password must contain at least one special character');
        });
    });
});