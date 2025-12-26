import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { AppError, AppErrorCode } from '@signtusk/lib/errors/app-error';
import { SSOService } from '../sso/services/sso-service';
import { SSOAuthRequestSchema } from '../sso/types/sso-types';
import type { HonoAuthContext } from '../types/context';

const ssoService = new SSOService();

// Define the schema separately to avoid type inference issues
const ssoDiscoverySchema = z.object({
    email: z.string().email(),
    organisationId: z.string().optional(),
});

export const ssoRoute = new Hono<HonoAuthContext>()
    /**
     * Discover SSO configuration for email domain
     */
    .get(
        '/discover',
        zValidator('query', ssoDiscoverySchema as any),
        async (c) => {
            try {
                const { email, organisationId } = c.req.valid('query');

                const discovery = await ssoService.discoverSSO(email, organisationId);

                return c.json(discovery);
            } catch (error) {
                throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        },
    )

    /**
     * Initiate SSO authentication
     */
    .post(
        '/initiate/:configId',
        zValidator('json', SSOAuthRequestSchema as any),
        async (c) => {
            try {
                const configId = c.req.param('configId');
                const request = c.req.valid('json');

                const result = await ssoService.initiateAuthentication(configId, request);

                return c.json(result);
            } catch (error) {
                throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        },
    )

    /**
     * Handle SAML SSO callback
     */
    .post('/callback/saml/:configId', async (c) => {
        try {
            const configId = c.req.param('configId');
            const body = await c.req.parseBody();

            // TODO: Implement SAML callback handling
            // const result = await ssoService.handleSAMLCallback(configId, body);

            return c.json({ message: 'SAML callback handling not yet implemented' });
        } catch (error) {
            throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    })

    /**
     * Handle OIDC SSO callback
     */
    .get('/callback/oidc/:configId', async (c) => {
        try {
            const configId = c.req.param('configId');
            const query = c.req.query();

            // TODO: Implement OIDC callback handling
            // const result = await ssoService.handleOIDCCallback(configId, query);

            return c.json({ message: 'OIDC callback handling not yet implemented' });
        } catch (error) {
            throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    })

    /**
     * Initiate SSO logout
     */
    .post(
        '/logout/:sessionId',
        async (c) => {
            try {
                const sessionId = c.req.param('sessionId');

                // TODO: Implement SSO logout
                // const result = await ssoService.initiateLogout(sessionId);

                return c.json({ message: 'SSO logout not yet implemented' });
            } catch (error) {
                throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        },
    )

    /**
     * Get SAML metadata for SP
     */
    .get('/metadata/saml/:configId', async (c) => {
        try {
            const configId = c.req.param('configId');

            // TODO: Implement SAML metadata generation
            // const metadata = await ssoService.getSAMLMetadata(configId);

            return c.json({ message: 'SAML metadata generation not yet implemented' });
        } catch (error) {
            throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });