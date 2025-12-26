import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import jwt from 'jsonwebtoken';
import { createAPIContext } from '../context';

/**
 * Simplified test server that uses real API routes but with simplified auth
 */
export function createSimpleTestAPIServer() {
    const app = new Hono();

    // Basic middleware
    app.use('*', logger());
    app.use('*', cors());

    // Simplified auth middleware for testing
    app.use('/api/v1/*', async (c, next) => {
        const apiContext = createAPIContext(c);
        c.set('apiContext', apiContext);

        const authHeader = c.req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret') as any;

                // Set user context from JWT payload
                apiContext.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    name: decoded.name,
                    organizationId: decoded.organizationId,
                    emailVerified: decoded.emailVerified,
                    roles: decoded.roles || ['user']
                };
                apiContext.organizationId = decoded.organizationId;
            } catch (error) {
                return c.json({ error: 'Invalid token' }, 401);
            }
        } else {
            return c.json({ error: 'Authorization header required' }, 401);
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

    // Mock user endpoints that match the real API structure
    app.get('/api/v1/users/me', (c) => {
        const apiContext = c.get('apiContext');
        return c.json({
            user: {
                ...apiContext.user,
                preferences: {
                    language: 'en',
                    timezone: 'UTC',
                    notifications: {
                        email: true,
                        push: true
                    }
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        });
    });

    app.patch('/api/v1/users/me', async (c) => {
        const apiContext = c.get('apiContext');
        const updates = await c.req.json();

        const updatedUser = {
            ...apiContext.user,
            name: updates.name || apiContext.user?.name,
            preferences: updates.preferences || {
                language: 'en',
                timezone: 'UTC',
                notifications: { email: true, push: true }
            },
            updatedAt: new Date().toISOString()
        };

        return c.json({
            success: true,
            user: updatedUser,
            message: 'Profile updated successfully'
        });
    });

    app.post('/api/v1/users/me/password', async (c) => {
        const { currentPassword, newPassword } = await c.req.json();

        // Validate password strength
        if (newPassword.length < 8 ||
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/\d/.test(newPassword) ||
            !/[@$!%*?&]/.test(newPassword)) {
            return c.json({ error: 'Password does not meet requirements' }, 400);
        }

        return c.json({
            success: true,
            message: 'Password changed successfully'
        });
    });

    app.get('/api/v1/users/me/activity', (c) => {
        const query = c.req.query();
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '20');
        const type = query.type || 'all';

        // Mock activity data
        const activities = [
            {
                id: 'activity_1',
                type: 'login',
                description: 'User logged in',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            },
            {
                id: 'activity_2',
                type: 'document',
                description: 'Document uploaded: Contract.pdf',
                metadata: { documentId: 'doc_123', fileName: 'Contract.pdf' },
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
            }
        ];

        const filteredActivities = type === 'all' ? activities : activities.filter(a => a.type === type);
        const total = filteredActivities.length;
        const totalPages = Math.ceil(total / limit);

        return c.json({
            data: filteredActivities,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
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