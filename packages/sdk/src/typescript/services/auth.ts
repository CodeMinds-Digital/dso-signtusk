/**
 * Authentication service for OAuth and token management
 */

import { BaseService } from './base';

export class AuthService extends BaseService {
    getAuthorizationUrl(scopes: string[] = [], state?: string): string {
        const config = this.client.getConfig();
        if (!config.oauth.clientId) {
            throw new Error('OAuth client ID not configured');
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.oauth.clientId,
            redirect_uri: config.oauth.redirectUri,
            scope: scopes.join(' '),
            ...(state && { state })
        });

        return `${config.baseURL}/oauth/authorize?${params.toString()}`;
    }

    async exchangeCodeForToken(code: string, state?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    }> {
        const config = this.client.getConfig();
        return this.create<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            tokenType: string;
        }>('/oauth/token', {
            grant_type: 'authorization_code',
            client_id: config.oauth.clientId,
            client_secret: config.oauth.clientSecret,
            redirect_uri: config.oauth.redirectUri,
            code,
            state
        });
    }

    async refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    }> {
        const config = this.client.getConfig();
        return this.create<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            tokenType: string;
        }>('/oauth/token', {
            grant_type: 'refresh_token',
            client_id: config.oauth.clientId,
            client_secret: config.oauth.clientSecret,
            refresh_token: refreshToken
        });
    }

    async revokeToken(token: string): Promise<void> {
        const config = this.client.getConfig();
        return this.create<void>('/oauth/revoke', {
            client_id: config.oauth.clientId,
            client_secret: config.oauth.clientSecret,
            token
        });
    }
}