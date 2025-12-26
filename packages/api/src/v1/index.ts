import { OpenAPIHono } from '@hono/zod-openapi';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { documentRoutes } from './routes/documents';
import { templateRoutes } from './routes/templates';
import { signingRoutes } from './routes/signing';
import { organizationRoutes } from './routes/organizations';
import { analyticsRoutes } from './routes/analytics';
import { webhookRoutes } from './routes/webhooks';
import { monitoringRouter } from './routes/monitoring';
import { errorReportingRouter } from '../routes/error-reporting';

/**
 * API v1 router
 */
const v1Router = new OpenAPIHono();

// Health check for v1
v1Router.get('/', (c) => {
    return c.json({
        version: 'v1',
        status: 'stable',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            documents: '/api/v1/documents',
            templates: '/api/v1/templates',
            signing: '/api/v1/signing',
            organizations: '/api/v1/organizations',
            analytics: '/api/v1/analytics',
            webhooks: '/api/v1/webhooks',
            monitoring: '/api/v1/monitoring',
            errors: '/api/v1/errors'
        },
        documentation: '/api/docs'
    });
});

// Mount route modules
v1Router.route('/auth', authRoutes);
v1Router.route('/users', userRoutes);
v1Router.route('/documents', documentRoutes);
v1Router.route('/templates', templateRoutes);
v1Router.route('/signing', signingRoutes);
v1Router.route('/organizations', organizationRoutes);
v1Router.route('/analytics', analyticsRoutes);
v1Router.route('/webhooks', webhookRoutes);
v1Router.route('/monitoring', monitoringRouter);
v1Router.route('/errors', errorReportingRouter);

export type V1Router = typeof v1Router;
export { v1Router };