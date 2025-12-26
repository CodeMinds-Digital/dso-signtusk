import type { Route } from './+types/_index';

/**
 * Base well-known directory handler
 * Handles requests to /.well-known/
 */
export async function loader({ request }: Route.LoaderArgs) {
    const responseData = {
        message: 'Well-known directory',
        available_endpoints: [
            '/.well-known/appspecific/com.chrome.devtools.json',
            '/.well-known/security.txt'
        ]
    };

    return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}