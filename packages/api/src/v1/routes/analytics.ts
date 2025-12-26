import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../../middleware/auth';

export const analyticsRoutes = new OpenAPIHono();
analyticsRoutes.use('*', authMiddleware);

const getAnalyticsRoute = createRoute({
    method: 'get',
    path: '/dashboard',
    tags: ['Analytics'],
    summary: 'Get analytics dashboard',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Analytics data',
            content: {
                'application/json': {
                    schema: z.object({
                        totalDocuments: z.number(),
                        completedSignatures: z.number(),
                        pendingSignatures: z.number(),
                        completionRate: z.number()
                    })
                }
            }
        }
    }
});

analyticsRoutes.openapi(getAnalyticsRoute, async (c) => {
    return c.json({
        totalDocuments: 150,
        completedSignatures: 120,
        pendingSignatures: 30,
        completionRate: 0.8
    });
});