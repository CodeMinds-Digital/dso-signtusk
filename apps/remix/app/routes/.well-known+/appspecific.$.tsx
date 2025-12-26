import type { Route } from './+types/appspecific.$';

/**
 * Chrome DevTools appspecific handler
 * Handles requests to /.well-known/appspecific/*
 * Specifically handles com.chrome.devtools.json requests
 */
export async function loader({ request, params }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const splat = params['*'] || '';

    // Handle Chrome DevTools specific request
    if (splat === 'com.chrome.devtools.json') {
        const responseData = {
            error: 'Not Found',
            message: 'Chrome DevTools configuration not available',
            path: url.pathname,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(responseData), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }

    // Handle other appspecific requests
    const responseData = {
        error: 'Not Found',
        message: `App-specific endpoint not found: ${splat}`,
        path: url.pathname,
        timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(responseData), {
        status: 404,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
}