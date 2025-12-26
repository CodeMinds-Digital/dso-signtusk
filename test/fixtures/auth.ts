/**
 * Authentication test fixtures and utilities
 */

export const mockUsers = {
    admin: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'admin@test.com',
        name: 'Test Admin',
        password: 'TestPassword123!',
        roles: ['admin'],
    },
    user: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'user@test.com',
        name: 'Test User',
        password: 'TestPassword123!',
        roles: ['user'],
    },
    viewer: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'viewer@test.com',
        name: 'Test Viewer',
        password: 'TestPassword123!',
        roles: ['viewer'],
    },
};

export const mockOrganizations = {
    acme: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Acme Corporation',
        domain: 'acme.com',
        settings: {
            requireTwoFactor: false,
            allowPublicTemplates: true,
        },
    },
    enterprise: {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Enterprise Corp',
        domain: 'enterprise.com',
        settings: {
            requireTwoFactor: true,
            allowPublicTemplates: false,
        },
    },
};

export const mockSessions = {
    validSession: {
        id: '550e8400-e29b-41d4-a716-446655440020',
        userId: mockUsers.user.id,
        token: 'valid-session-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
    expiredSession: {
        id: '550e8400-e29b-41d4-a716-446655440021',
        userId: mockUsers.user.id,
        token: 'expired-session-token-123',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    },
};

export const mockAPITokens = {
    validToken: {
        id: '550e8400-e29b-41d4-a716-446655440030',
        name: 'Test API Token',
        token: 'test-api-token-123456789',
        userId: mockUsers.user.id,
        permissions: ['documents:read', 'documents:write'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    expiredToken: {
        id: '550e8400-e29b-41d4-a716-446655440031',
        name: 'Expired API Token',
        token: 'expired-api-token-123456789',
        userId: mockUsers.user.id,
        permissions: ['documents:read'],
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
};

export const mockTwoFactorSecrets = {
    user: {
        userId: mockUsers.user.id,
        secret: 'JBSWY3DPEHPK3PXP',
        backupCodes: [
            '123456789',
            '987654321',
            '456789123',
            '789123456',
            '321654987',
        ],
    },
};

export const createMockJWT = (payload: any) => {
    // Simple mock JWT for testing - not cryptographically secure
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = 'mock-signature';
    return `${header}.${body}.${signature}`;
};

export const createMockAuthHeaders = (user = mockUsers.user) => {
    const token = createMockJWT({
        sub: user.id,
        email: user.email,
        roles: user.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });

    return {
        Authorization: `Bearer ${token}`,
    };
};

export const createMockAPIHeaders = (token = mockAPITokens.validToken.token) => {
    return {
        'X-API-Key': token,
    };
};