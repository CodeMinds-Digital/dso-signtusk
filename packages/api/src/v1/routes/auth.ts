import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authRateLimitMiddleware } from '../../middleware/rate-limit';
import { optionalAuthMiddleware } from '../../middleware/auth';

export const authRoutes = new OpenAPIHono();

// Apply rate limiting to all auth routes
authRoutes.use('*', authRateLimitMiddleware);

/**
 * Login endpoint
 */
const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    tags: ['Authentication'],
    summary: 'User login',
    description: 'Authenticate user with email and password',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        email: z.string().email('Invalid email format'),
                        password: z.string().min(1, 'Password is required'),
                        rememberMe: z.boolean().optional().default(false)
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Login successful',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        sessionToken: z.string(),
                        user: z.object({
                            id: z.string(),
                            email: z.string().email(),
                            name: z.string(),
                            organizationId: z.string()
                        }),
                        expiresAt: z.string().datetime()
                    })
                }
            }
        },
        401: {
            description: 'Invalid credentials'
        }
    }
});

authRoutes.openapi(loginRoute, async (c) => {
    const { email, password, rememberMe } = c.req.valid('json');

    // Simplified login logic - in real implementation, validate against database
    if (email === 'test@example.com' && password === 'password') {
        const jwt = await import('jsonwebtoken');
        const expiresIn = rememberMe ? '30d' : '24h';
        const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

        const sessionToken = jwt.sign(
            {
                userId: 'user_123',
                email,
                name: 'Test User',
                organizationId: 'org_123',
                roles: ['user'],
                emailVerified: true,
            },
            process.env.JWT_SECRET || 'default-jwt-secret',
            { expiresIn }
        );

        return c.json({
            success: true,
            sessionToken,
            user: {
                id: 'user_123',
                email,
                name: 'Test User',
                organizationId: 'org_123',
            },
            expiresAt: expiresAt.toISOString()
        });
    }

    return c.json({ error: 'Invalid credentials' }, 401);
});

/**
 * Register endpoint
 */
const registerRoute = createRoute({
    method: 'post',
    path: '/register',
    tags: ['Authentication'],
    summary: 'User registration',
    description: 'Register a new user account',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        email: z.string().email('Invalid email format'),
                        password: z.string()
                            .min(8, 'Password must be at least 8 characters')
                            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
                            .regex(/\d/, 'Password must contain at least one number')
                            .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
                        name: z.string().min(1, 'Name is required'),
                        organizationName: z.string().optional()
                    })
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Registration successful',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        user: z.object({
                            id: z.string(),
                            email: z.string().email(),
                            name: z.string(),
                            organizationId: z.string(),
                            emailVerified: z.boolean()
                        }),
                        message: z.string()
                    })
                }
            }
        },
        409: {
            description: 'Email already exists'
        }
    }
});

authRoutes.openapi(registerRoute, async (c) => {
    const { email, password, name, organizationName } = c.req.valid('json');

    // Simplified registration - in real implementation, check database and create user
    const userId = `user_${Date.now()}`;
    const organizationId = `org_${Date.now()}`;

    return c.json({
        success: true,
        user: {
            id: userId,
            email,
            name,
            organizationId,
            emailVerified: false
        },
        message: 'Registration successful. Please check your email to verify your account.'
    }, 201);
});

/**
 * Logout endpoint
 */
const logoutRoute = createRoute({
    method: 'post',
    path: '/logout',
    tags: ['Authentication'],
    summary: 'User logout',
    description: 'Invalidate user session',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Logout successful',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        }
    }
});

authRoutes.openapi(logoutRoute, async (c) => {
    // In real implementation, invalidate the session token
    return c.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * Session validation endpoint
 */
const sessionRoute = createRoute({
    method: 'get',
    path: '/session',
    tags: ['Authentication'],
    summary: 'Get session information',
    description: 'Retrieve current user session details',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Session information',
            content: {
                'application/json': {
                    schema: z.object({
                        authenticated: z.boolean(),
                        user: z.object({
                            id: z.string(),
                            email: z.string().email(),
                            name: z.string(),
                            organizationId: z.string(),
                            emailVerified: z.boolean(),
                            roles: z.array(z.string())
                        }),
                        sessionId: z.string(),
                        expiresAt: z.string().datetime()
                    })
                }
            }
        }
    }
});

authRoutes.use('/session', optionalAuthMiddleware);
authRoutes.openapi(sessionRoute, async (c) => {
    const apiContext = c.get('apiContext');

    if (!apiContext.user) {
        return c.json({ authenticated: false }, 401);
    }

    return c.json({
        authenticated: true,
        user: apiContext.user,
        sessionId: 'session_123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
});

/**
 * Password validation endpoint
 */
const validatePasswordRoute = createRoute({
    method: 'post',
    path: '/validate-password',
    tags: ['Authentication'],
    summary: 'Validate password strength',
    description: 'Check if password meets security requirements',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        password: z.string()
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Password validation result',
            content: {
                'application/json': {
                    schema: z.object({
                        isValid: z.boolean(),
                        errors: z.array(z.string()),
                        strength: z.enum(['weak', 'fair', 'good', 'strong']).optional()
                    })
                }
            }
        }
    }
});

authRoutes.openapi(validatePasswordRoute, async (c) => {
    const { password } = c.req.valid('json');
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Calculate strength
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (errors.length === 0) {
        if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            strength = 'strong';
        } else if (password.length >= 10) {
            strength = 'good';
        } else {
            strength = 'fair';
        }
    }

    return c.json({
        isValid: errors.length === 0,
        errors,
        strength
    });
});