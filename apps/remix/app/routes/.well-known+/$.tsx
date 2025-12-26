import type { Route } from './+types/$';

/**
 * Wildcard catch-all for undefined well-known endpoints
 * Handles requests to /.well-known/* that don't match specific routes
 */
export async function loader({ request, params }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const splat = params['*'] || '';

    const responseData = {
        error: 'Not Found',
        message: `Well-known endpoint not found: ${splat}`,
        path: url.pathname,
        timestamp: new Date().toISOString(),
        available_endpoints: [
            '/.well-known/',
            '/.well-known/appspecific/com.chrome.devtools.json',
            '/.well-known/security.txt'
        ]
    };

    return new Response(JSON.stringify(responseData), {
        status: 404,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
}