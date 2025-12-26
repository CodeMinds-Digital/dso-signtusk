import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import jwt from 'jsonwebtoken';

/**
 * Simplified test server for API testing
 * Provides mock implementations of all API endpoints for testing
 */

export function createTestAPIServer() {
    const app = new Hono();

    // Basic middleware
    app.use('*', logger());
    app.use('*', cors());

    // Mock authentication middleware
    app.use('/api/v1/*', async (c, next) => {
        const authHeader = c.req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret') as any;
                c.set('user', decoded);
            } catch (error) {
                // Invalid token
            }
        }

        await next();
    });

    // Health check
    app.get('/health', (c) => {
        return c.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });

    // API versions
    app.get('/api/versions', (c) => {
        return c.json({
            versions: ['v1'],
            latest: 'v1',
            deprecated: []
        });
    });

    app.get('/api/v1', (c) => {
        return c.json({
            version: 'v1',
            endpoints: [
                '/auth',
                '/documents',
                '/signing',
                '/templates',
                '/users',
                '/organizations'
            ]
        });
    });

    // OpenAPI spec
    app.get('/api/openapi.json', (c) => {
        return c.json({
            openapi: '3.0.0',
            info: {
                title: 'Signtusk API',
                version: '1.0.0',
                description: 'Comprehensive e-signature platform API'
            },
            paths: {},
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    },
                    apiKey: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'X-API-Key'
                    }
                }
            }
        });
    });

    // Auth endpoints
    app.post('/api/v1/auth/login', async (c) => {
        const body = await c.req.json();
        const { email, password, rememberMe } = body;

        if (!email || !password) {
            return c.json({ error: 'Email and password are required' }, 400);
        }

        if (email === 'test@example.com' && password === 'password') {
            const expiresIn = rememberMe ? '30d' : '24h';
            const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

            const sessionToken = jwt.sign(
                {
                    userId: 'user_123',
                    email,
                    name: 'Test User',
                    organizationId: 'org_123',
                    roles: ['user'],
                    emailVerified: true,
                },
                process.env.JWT_SECRET || 'test-jwt-secret',
                { expiresIn }
            );

            return c.json({
                success: true,
                sessionToken,
                user: {
                    id: 'user_123',
                    email,
                    name: 'Test User',
                    organizationId: 'org_123',
                },
                expiresAt: expiresAt.toISOString()
            });
        }

        return c.json({ error: 'Invalid credentials' }, 401);
    });

    app.post('/api/v1/auth/register', async (c) => {
        const body = await c.req.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return c.json({ error: 'Email, password, and name are required' }, 400);
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return c.json({ error: 'Invalid email format' }, 400);
        }

        // Validate password strength
        if (password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/\d/.test(password) ||
            !/[@$!%*?&]/.test(password)) {
            return c.json({ error: 'Password does not meet requirements' }, 400);
        }

        const userId = `user_${Date.now()}`;
        const organizationId = `org_${Date.now()}`;

        return c.json({
            success: true,
            user: {
                id: userId,
                email,
                name,
                organizationId,
                emailVerified: false
            },
            message: 'Registration successful. Please check your email to verify your account.'
        }, 201);
    });

    app.post('/api/v1/auth/logout', (c) => {
        return c.json({
            success: true,
            message: 'Logged out successfully'
        });
    });

    app.get('/api/v1/auth/session', (c) => {
        const user = c.get('user');

        if (!user) {
            return c.json({ authenticated: false }, 401);
        }

        return c.json({
            authenticated: true,
            user,
            sessionId: 'session_123',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
    });

    app.post('/api/v1/auth/validate-password', async (c) => {
        const body = await c.req.json();
        const { password } = body;
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
        if (errors.length === 0) {
            if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                strength = 'strong';
            } else if (password.length >= 10) {
                strength = 'good';
            } else {
                strength = 'fair';
            }
        }

        return c.json({
            isValid: errors.length === 0,
            errors,
            strength
        });
    });

    // Documents endpoints
    app.get('/api/v1/documents', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const page = parseInt(c.req.query('page') || '1');
        const pageSize = parseInt(c.req.query('pageSize') || '20');

        return c.json({
            documents: [
                {
                    id: 'doc_123',
                    name: 'Sample Document',
                    status: 'DRAFT',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            total: 1,
            page,
            pageSize
        });
    });

    app.get('/api/v1/documents/:id', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const id = c.req.param('id');

        if (id === 'nonexistent_id') {
            return c.json({ error: 'Document not found' }, 404);
        }

        return c.json({
            id,
            name: 'Sample Document',
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    });

    app.post('/api/v1/documents', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const body = await c.req.json();
        const { name } = body;

        if (!name) {
            return c.json({ error: 'Name is required' }, 400);
        }

        return c.json({
            id: `doc_${Date.now()}`,
            name,
            status: 'DRAFT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, 201);
    });

    app.patch('/api/v1/documents/:id', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const id = c.req.param('id');

        if (id === 'nonexistent_id') {
            return c.json({ error: 'Document not found' }, 404);
        }

        return c.json({
            id,
            name: 'Updated Document',
            status: 'DRAFT',
            updatedAt: new Date().toISOString()
        });
    });

    app.delete('/api/v1/documents/:id', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const id = c.req.param('id');

        if (id === 'nonexistent_id') {
            return c.json({ error: 'Document not found' }, 404);
        }

        return c.json({ success: true }, 204);
    });

    app.post('/api/v1/documents/:id/share', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const id = c.req.param('id');
        const body = await c.req.json();
        const { email, permission } = body;

        if (id === 'nonexistent_id') {
            return c.json({ error: 'Document not found' }, 404);
        }

        if (!['view', 'edit', 'admin'].includes(permission)) {
            return c.json({ error: 'Invalid permission' }, 400);
        }

        return c.json({
            success: true,
            shareId: `share_${Date.now()}`
        }, 201);
    });

    // Signing endpoints
    app.post('/api/v1/signing/requests', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const body = await c.req.json();
        const { documentId, title, recipients } = body;

        if (!documentId) {
            return c.json({ error: 'Document ID is required' }, 400);
        }

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return c.json({ error: 'At least one recipient is required' }, 400);
        }

        // Validate recipient emails
        for (const recipient of recipients) {
            if (!recipient.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
                return c.json({ error: 'Invalid recipient email' }, 400);
            }
        }

        return c.json({
            id: `req_${Date.now()}`,
            documentId,
            title,
            status: 'DRAFT',
            recipients: recipients.map((r: any, index: number) => ({
                id: `recipient_${Date.now()}_${index}`,
                ...r,
                status: 'PENDING'
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, 201);
    });

    app.get('/api/v1/signing/requests', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const page = parseInt(c.req.query('page') || '1');
        const pageSize = parseInt(c.req.query('pageSize') || '20');

        return c.json({
            requests: [
                {
                    id: 'req_123',
                    documentId: 'doc_123',
                    title: 'Sample Signing Request',
                    status: 'DRAFT',
                    createdAt: new Date().toISOString()
                }
            ],
            total: 1,
            page,
            pageSize
        });
    });

    app.get('/api/v1/signing/requests/:id', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const id = c.req.param('id');

        if (id === 'nonexistent_id') {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        return c.json({
            id,
            documentId: 'doc_123',
            title: 'Sample Signing Request',
            status: 'DRAFT',
            recipients: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    });

    app.get('/api/v1/signing/requests/:id/status', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const id = c.req.param('id');

        if (id === 'nonexistent_id') {
            return c.json({ error: 'Signing request not found' }, 404);
        }

        return c.json({
            status: 'IN_PROGRESS',
            progress: {
                totalRecipients: 2,
                completedRecipients: 1,
                pendingRecipients: 1,
                percentComplete: 50
            },
            recipients: [
                {
                    id: 'recipient_123',
                    email: 'signer@example.com',
                    name: 'Test Signer',
                    status: 'SIGNED',
                    signedAt: new Date().toISOString()
                }
            ]
        });
    });

    // Add more endpoints as needed...

    // Templates endpoints
    app.get('/api/v1/templates', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const page = parseInt(c.req.query('page') || '1');
        const pageSize = parseInt(c.req.query('pageSize') || '20');

        return c.json({
            templates: [],
            total: 0,
            page,
            pageSize
        });
    });

    // Users endpoints
    app.get('/api/v1/users/me', (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        return c.json(user);
    });

    app.patch('/api/v1/users/me', async (c) => {
        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const body = await c.req.json();

        if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            return c.json({ error: 'Invalid email format' }, 400);
        }

        return c.json({
            ...user,
            ...body,
            updatedAt: new Date().toISOString()
        });
    });

    // Error handler
    app.onError((err, c) => {
        console.error('API Error:', err);
        return c.json({
            error: 'Internal Server Error',
            message: err.message,
            timestamp: new Date().toISOString(),
            path: c.req.path
        }, 500);
    });

    // 404 handler
    app.notFound((c) => {
        return c.json({
            error: 'Not Found',
            message: 'The requested resource was not found',
            timestamp: new Date().toISOString(),
            path: c.req.path
        }, 404);
    });

    return app;
}