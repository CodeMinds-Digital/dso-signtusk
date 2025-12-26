import { OpenAPIHono } from '@hono/zod-openapi';
import { v1Router } from './v1';
import { v2Router } from './v2';
import { v3Router } from './v3';
import {
    createVersionNegotiationMiddleware,
    getAvailableVersions,
    versionConfig,
    DeprecationManager
} from './versioning';

/**
 * Main API router with comprehensive versioning support
 */
export const apiRouter = new OpenAPIHono();

// Apply version negotiation middleware globally
apiRouter.use('*', createVersionNegotiationMiddleware());

// Mount version-specific routers
apiRouter.route('/v1', v1Router);
apiRouter.route('/v2', v2Router);
apiRouter.route('/v3', v3Router);

// Version information and negotiation endpoints
apiRouter.get('/versions', (c) => {
    const versions = getAvailableVersions();

    return c.json({
        versions: versions.map(version => ({
            version: version.version,
            status: version.status,
            path: version.path,
            documentation: version.documentation,
            deprecated: version.deprecated,
            sunset: version.sunset,
            releaseDate: version.releaseDate,
            endOfLife: version.endOfLife,
            features: version.features,
            isCurrent: version.isCurrent,
            isDefault: version.isDefault
        })),
        latest: versionConfig.latestVersion,
        default: versionConfig.defaultVersion,
        supported: versionConfig.supportedVersions,
        strategies: versionConfig.strategies
    });
});

// Deprecation timeline endpoint
apiRouter.get('/deprecation-timeline', (c) => {
    const timeline = versionConfig.supportedVersions.map(version => ({
        version,
        timeline: DeprecationManager.getDeprecationTimeline(version),
        currentPhase: DeprecationManager.getCurrentPhase(version),
        warnings: DeprecationManager.getDeprecationWarnings(version)
    })).filter(item => item.timeline.length > 0);

    return c.json({
        timeline,
        lastUpdated: new Date().toISOString()
    });
});

// Migration information endpoint
apiRouter.get('/migration/:from/:to', (c) => {
    const from = c.req.param('from') as any;
    const to = c.req.param('to') as any;

    // This would use the migration tools from the versioning system
    return c.json({
        from,
        to,
        available: true, // Simplified for now
        guide: `/api/docs/migration/${from}-to-${to}`,
        complexity: 'medium',
        estimatedTime: '2-4 weeks',
        breakingChanges: [],
        automatedTools: `/api/migration-tools/${from}-to-${to}`
    });
});

export type APIRouter = typeof apiRouter;