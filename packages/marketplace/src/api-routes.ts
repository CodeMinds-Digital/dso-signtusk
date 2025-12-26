/**
 * Marketplace API Routes
 * 
 * Defines API endpoints for the marketplace platform including
 * app management, developer portal, and public marketplace.
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { MarketplaceServiceImpl } from './marketplace-service';
import { DeveloperPortal } from './developer-portal';

// Helper function for safe error message extraction
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
}

export function createMarketplaceRoutes(
    marketplaceService: MarketplaceServiceImpl,
    developerPortal: DeveloperPortal
) {
    const router = new OpenAPIHono();

    // Public marketplace endpoints

    /**
     * Get marketplace apps with filtering and pagination
     */
    router.get('/apps', async (c) => {
        const category = c.req.query('category');
        const search = c.req.query('search');
        const sort = c.req.query('sort') || 'popular';
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');

        try {
            const apps = await marketplaceService.database.apps.findPublished({
                category,
                search,
                sort,
                page,
                limit
            });

            return c.json({
                success: true,
                data: apps.items,
                pagination: {
                    page,
                    limit,
                    total: apps.total,
                    pages: Math.ceil(apps.total / limit)
                }
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    /**
     * Get app details
     */
    router.get('/apps/:appId', async (c) => {
        const appId = c.req.param('appId');

        try {
            const app = await marketplaceService.database.apps.findById(appId);
            if (!app || app.status !== 'published') {
                return c.json({
                    success: false,
                    error: 'App not found'
                }, 404);
            }

            const analytics = await marketplaceService.getAppAnalytics(appId);

            return c.json({
                success: true,
                data: {
                    ...app,
                    analytics: {
                        downloads: analytics.downloads,
                        rating: analytics.rating,
                        reviewCount: analytics.reviewCount
                    }
                }
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    /**
     * Install app for organization
     */
    router.post('/apps/:appId/install', async (c) => {
        const appId = c.req.param('appId');
        const { organizationId, userId } = await c.req.json();

        try {
            const installation = await marketplaceService.installApp(appId, organizationId, userId);

            return c.json({
                success: true,
                data: installation
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Get marketplace analytics (public)
     */
    router.get('/analytics', async (c) => {
        try {
            const analytics = await marketplaceService.getMarketplaceAnalytics();

            // Return only public analytics
            return c.json({
                success: true,
                data: {
                    totalApps: analytics.totalApps,
                    totalDevelopers: analytics.totalDevelopers,
                    topCategories: analytics.topCategories,
                    averageRating: analytics.averageRating,
                    trendingApps: analytics.trendingApps.slice(0, 10) // Top 10 only
                }
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    // Developer portal endpoints

    /**
     * Register as developer
     */
    router.post('/developer/register', async (c) => {
        const { userId, ...developerData } = await c.req.json();

        try {
            const developer = await developerPortal.registerDeveloper(userId, developerData);

            return c.json({
                success: true,
                data: developer
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Get developer dashboard
     */
    router.get('/developer/:developerId/dashboard', async (c) => {
        const developerId = c.req.param('developerId');

        try {
            const dashboard = await developerPortal.getDeveloperDashboard(developerId);

            return c.json({
                success: true,
                data: dashboard
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    /**
     * Submit new app
     */
    router.post('/developer/:developerId/apps', async (c) => {
        const developerId = c.req.param('developerId');
        const appData = await c.req.json();

        try {
            const result = await developerPortal.submitApp(developerId, appData);

            if (result.success) {
                return c.json({
                    success: true,
                    data: result
                });
            } else {
                return c.json({
                    success: false,
                    errors: result.errors
                }, 400);
            }
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    /**
     * Update app
     */
    router.put('/developer/:developerId/apps/:appId', async (c) => {
        const developerId = c.req.param('developerId');
        const appId = c.req.param('appId');
        const updates = await c.req.json();

        try {
            const app = await developerPortal.updateApp(developerId, appId, updates);

            return c.json({
                success: true,
                data: app
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Get app analytics for developer
     */
    router.get('/developer/:developerId/apps/:appId/analytics', async (c) => {
        const developerId = c.req.param('developerId');
        const appId = c.req.param('appId');

        try {
            const analytics = await developerPortal.getAppAnalytics(developerId, appId);

            return c.json({
                success: true,
                data: analytics
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 403);
        }
    });

    /**
     * Get revenue analytics for developer
     */
    router.get('/developer/:developerId/revenue', async (c) => {
        const developerId = c.req.param('developerId');
        const timeframe = c.req.query('timeframe') as 'week' | 'month' | 'year' || 'month';

        try {
            const analytics = await developerPortal.getRevenueAnalytics(developerId, timeframe);

            return c.json({
                success: true,
                data: analytics
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    /**
     * Request developer verification
     */
    router.post('/developer/:developerId/verify', async (c) => {
        const developerId = c.req.param('developerId');
        const { documents } = await c.req.json();

        try {
            await developerPortal.requestVerification(developerId, documents);

            return c.json({
                success: true,
                message: 'Verification request submitted'
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Update payout settings
     */
    router.put('/developer/:developerId/payout', async (c) => {
        const developerId = c.req.param('developerId');
        const settings = await c.req.json();

        try {
            await developerPortal.updatePayoutSettings(developerId, settings);

            return c.json({
                success: true,
                message: 'Payout settings updated'
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Get marketplace insights for developers
     */
    router.get('/developer/insights', async (c) => {
        try {
            const insights = await developerPortal.getMarketplaceInsights();

            return c.json({
                success: true,
                data: insights
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    // Organization app management endpoints

    /**
     * Get installed apps for organization
     */
    router.get('/organization/:orgId/apps', async (c) => {
        const orgId = c.req.param('orgId');

        try {
            const installations = await marketplaceService.database.appInstallations.findByOrganization(orgId);

            return c.json({
                success: true,
                data: installations
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    /**
     * Configure installed app
     */
    router.put('/organization/:orgId/apps/:installationId/config', async (c) => {
        const installationId = c.req.param('installationId');
        const config = await c.req.json();

        try {
            await marketplaceService.configureApp(installationId, config);

            return c.json({
                success: true,
                message: 'App configured successfully'
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Uninstall app
     */
    router.delete('/organization/:orgId/apps/:installationId', async (c) => {
        const installationId = c.req.param('installationId');

        try {
            await marketplaceService.uninstallApp(installationId);

            return c.json({
                success: true,
                message: 'App uninstalled successfully'
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    // Sandbox execution endpoints

    /**
     * Execute code in app sandbox
     */
    router.post('/sandbox/:sandboxId/execute', async (c) => {
        const sandboxId = c.req.param('sandboxId');
        const { code, context } = await c.req.json();

        try {
            const result = await marketplaceService.executeSandboxCode(sandboxId, code, context);

            return c.json({
                success: true,
                data: result
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Get sandbox metrics
     */
    router.get('/sandbox/:sandboxId/metrics', async (c) => {
        const sandboxId = c.req.param('sandboxId');

        try {
            const metrics = await marketplaceService.sandboxManager.getSandboxMetrics(sandboxId);

            return c.json({
                success: true,
                data: metrics
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 500);
        }
    });

    // Webhook endpoints for payment processing

    /**
     * Handle Stripe webhooks
     */
    router.post('/webhooks/stripe', async (c) => {
        const event = await c.req.json();

        try {
            await marketplaceService.revenueManager.handleWebhook('stripe', event);

            return c.json({
                success: true,
                message: 'Webhook processed'
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    /**
     * Handle PayPal webhooks
     */
    router.post('/webhooks/paypal', async (c) => {
        const event = await c.req.json();

        try {
            await marketplaceService.revenueManager.handleWebhook('paypal', event);

            return c.json({
                success: true,
                message: 'Webhook processed'
            });
        } catch (error: unknown) {
            return c.json({
                success: false,
                error: getErrorMessage(error)
            }, 400);
        }
    });

    return router;
}