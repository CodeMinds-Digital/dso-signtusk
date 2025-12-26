import type { Route } from './+types/security.txt';

/**
 * Security.txt endpoint handler
 * Handles requests to /.well-known/security.txt
 * Returns security policy information as per RFC 9116
 */
export async function loader({ request }: Route.LoaderArgs) {
    const securityTxt = `Contact: security@signtusk.com
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Preferred-Languages: en
Canonical: ${new URL('/.well-known/security.txt', request.url).toString()}`;

    return new Response(securityTxt, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
        }
    });
}