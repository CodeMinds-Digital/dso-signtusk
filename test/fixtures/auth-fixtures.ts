import { vi } from 'vitest';
import { mockData, authTestUtils } from '../utils/test-helpers';

/**
 * Authentication domain test fixtures
 */

export const authFixtures = {
    // Mock authentication service
    mockAuthService: () => ({
        login: vi.fn().mockResolvedValue({
            user: mockData.user(),
            token: authTestUtils.mockJwtToken(),
            session: authTestUtils.mockSession(),
        }),

        logout: vi.fn().mockResolvedValue(true),

        register: vi.fn().mockResolvedValue({
            user: mockData.user(),
            requiresEmailVerification: true,
        }),

        verifyEmail: vi.fn().mockResolvedValue(true),

        resetPassword: vi.fn().mockResolvedValue(true),

        changePassword: vi.fn().mockResolvedValue(true),

        validateToken: vi.fn().mockResolvedValue({
            valid: true,
            user: mockData.user(),
        }),

        refreshToken: vi.fn().mockResolvedValue({
            token: authTestUtils.mockJwtToken(),
        }),
    }),

    // Mock session service
    mockSessionService: () => ({
        create: vi.fn().mockResolvedValue(authTestUtils.mockSession()),
        validate: vi.fn().mockResolvedValue(true),
        destroy: vi.fn().mockResolvedValue(true),
        cleanup: vi.fn().mockResolvedValue(5), // cleaned up sessions count
    }),

    // Mock 2FA service
    mockTwoFactorService: () => ({
        generateSecret: vi.fn().mockResolvedValue({
            secret: 'MOCK2FASECRET',
            qrCode: 'data:image/png;base64,mockqrcode',
        }),

        verify: vi.fn().mockResolvedValue(true),

        generateBackupCodes: vi.fn().mockResolvedValue([
            '12345678', '87654321', '11111111', '22222222', '33333333'
        ]),

        verifyBackupCode: vi.fn().mockResolvedValue(true),
    }),

    // Mock OAuth service
    mockOAuthService: () => ({
        getAuthUrl: vi.fn().mockReturnValue('https://oauth.provider.com/auth?client_id=test'),

        handleCallback: vi.fn().mockResolvedValue({
            user: mockData.user(),
            token: authTestUtils.mockJwtToken(),
        }),

        linkAccount: vi.fn().mockResolvedValue(true),

        unlinkAccount: vi.fn().mockResolvedValue(true),
    }),

    // Test scenarios
    scenarios: {
        validLogin: {
            email: 'test@example.com',
            password: 'ValidPassword123!',
            expectedResult: {
                success: true,
                user: mockData.user(),
                token: authTestUtils.mockJwtToken(),
            },
        },

        invalidCredentials: {
            email: 'test@example.com',
            password: 'wrongpassword',
            expectedError: 'Invalid credentials',
        },

        accountLocked: {
            email: 'locked@example.com',
            password: 'ValidPassword123!',
            expectedError: 'Account is locked',
        },

        emailNotVerified: {
            email: 'unverified@example.com',
            password: 'ValidPassword123!',
            expectedError: 'Email not verified',
        },

        twoFactorRequired: {
            email: '2fa@example.com',
            password: 'ValidPassword123!',
            expectedResult: {
                requiresTwoFactor: true,
                tempToken: 'temp.token.here',
            },
        },
    },

    // Mock middleware
    mockAuthMiddleware: () => ({
        authenticate: vi.fn().mockImplementation((req, res, next) => {
            req.user = authTestUtils.mockAuthenticatedUser();
            next();
        }),

        requireAuth: vi.fn().mockImplementation((req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            next();
        }),

        requireRole: (role: string) => vi.fn().mockImplementation((req, res, next) => {
            if (req.user?.role !== role) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            next();
        }),
    }),

    // Mock password utilities
    mockPasswordUtils: () => ({
        hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
        compare: vi.fn().mockResolvedValue(true),
        generateSalt: vi.fn().mockReturnValue('mocksalt'),
        validateStrength: vi.fn().mockReturnValue({
            valid: true,
            score: 4,
            feedback: [],
        }),
    }),
};