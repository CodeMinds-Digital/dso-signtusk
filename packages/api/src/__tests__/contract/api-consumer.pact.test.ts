import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pact, Matchers } from '@pact-foundation/pact';
import { createTestAPIServer } from '../test-server';
import jwt from 'jsonwebtoken';

/**
 * Contract tests using Pact for API consumers
 * Ensures API contracts are maintained between provider and consumers
 */

const { like, eachLike, term, iso8601DateTime } = Matchers;

describe('API Consumer Contract Tests', () => {
    let provider: Pact;
    let authToken: string;

    beforeAll(async () => {
        // Set up Pact provider
        provider = new Pact({
            consumer: 'DocuSign-Alternative-Web-Client',
            provider: 'DocuSign-Alternative-API',
            port: 1234,
            log: './logs/pact.log',
            dir: './pacts',
            logLevel: 'INFO',
            spec: 3
        });

        await provider.setup();

        // Generate test auth token
        authToken = jwt.sign(
            {
                userId: 'test_user_123',
                email: 'test@example.com',
                name: 'Test User',
                organizationId: 'test_org_123',
                roles: ['user'],
                emailVerified: true,
            },
            process.env.JWT_SECRET || 'default-jwt-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await provider.finalize();
    });

    describe('Authentication Endpoints Contract', () => {
        it('should login with valid credentials', async () => {
            // Define the expected interaction
            await provider.addInteraction({
                state: 'user exists with valid credentials',
                uponReceiving: 'a login request with valid credentials',
                withRequest: {
                    method: 'POST',
                    path: '/api/v1/auth/login',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        email: 'test@example.com',
                        password: 'password',
                        rememberMe: false
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        success: true,
                        sessionToken: like('jwt.token.here'),
                        user: {
                            id: like('user_123'),
                            email: 'test@example.com',
                            name: like('Test User'),
                            organizationId: like('org_123')
                        },
                        expiresAt: iso8601DateTime()
                    }
                }
            });

            // Make the actual request
            const response = await fetch('http://localhost:1234/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password',
                    rememberMe: false
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data).toHaveProperty('sessionToken');
            expect(data).toHaveProperty('user');
        });

        it('should register new user', async () => {
            await provider.addInteraction({
                state: 'user does not exist',
                uponReceiving: 'a registration request with valid data',
                withRequest: {
                    method: 'POST',
                    path: '/api/v1/auth/register',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        email: 'newuser@example.com',
                        password: 'Password123!',
                        name: 'New User'
                    }
                },
                willRespondWith: {
                    status: 201,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        success: true,
                        user: {
                            id: like('user_456'),
                            email: 'newuser@example.com',
                            name: 'New User',
                            organizationId: like('org_456'),
                            emailVerified: false
                        },
                        message: like('Registration successful. Please check your email to verify your account.')
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'newuser@example.com',
                    password: 'Password123!',
                    name: 'New User'
                })
            });

            expect(response.status).toBe(201);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.user.email).toBe('newuser@example.com');
        });

        it('should get session information', async () => {
            await provider.addInteraction({
                state: 'user is authenticated',
                uponReceiving: 'a session request with valid token',
                withRequest: {
                    method: 'GET',
                    path: '/api/v1/auth/session',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        authenticated: true,
                        user: {
                            id: like('user_123'),
                            email: like('test@example.com'),
                            name: like('Test User'),
                            organizationId: like('org_123'),
                            emailVerified: like(true),
                            roles: eachLike('user')
                        },
                        sessionId: like('session_123'),
                        expiresAt: iso8601DateTime()
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/auth/session', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.authenticated).toBe(true);
            expect(data).toHaveProperty('user');
        });
    });

    describe('Documents Endpoints Contract', () => {
        it('should list documents', async () => {
            await provider.addInteraction({
                state: 'user has documents',
                uponReceiving: 'a request to list documents',
                withRequest: {
                    method: 'GET',
                    path: '/api/v1/documents',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        documents: eachLike({
                            id: like('doc_123'),
                            name: like('Sample Document'),
                            status: term({
                                matcher: '^(DRAFT|SENT|COMPLETED|CANCELLED)$',
                                generate: 'DRAFT'
                            }),
                            createdAt: iso8601DateTime(),
                            updatedAt: iso8601DateTime()
                        }),
                        total: like(10),
                        page: like(1),
                        pageSize: like(20)
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/documents', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.documents)).toBe(true);
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('page');
        });

        it('should get document by ID', async () => {
            await provider.addInteraction({
                state: 'document exists',
                uponReceiving: 'a request to get document by ID',
                withRequest: {
                    method: 'GET',
                    path: '/api/v1/documents/doc_123',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        id: 'doc_123',
                        name: like('Sample Document'),
                        description: like('A sample document for testing'),
                        status: term({
                            matcher: '^(DRAFT|SENT|COMPLETED|CANCELLED)$',
                            generate: 'DRAFT'
                        }),
                        createdAt: iso8601DateTime(),
                        updatedAt: iso8601DateTime(),
                        createdBy: like('user_123'),
                        organizationId: like('org_123')
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/documents/doc_123', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.id).toBe('doc_123');
            expect(data).toHaveProperty('name');
            expect(data).toHaveProperty('status');
        });

        it('should create new document', async () => {
            await provider.addInteraction({
                state: 'user is authenticated',
                uponReceiving: 'a request to create document',
                withRequest: {
                    method: 'POST',
                    path: '/api/v1/documents',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: {
                        name: 'New Document',
                        description: 'A new document for testing'
                    }
                },
                willRespondWith: {
                    status: 201,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        id: like('doc_456'),
                        name: 'New Document',
                        description: 'A new document for testing',
                        status: 'DRAFT',
                        createdAt: iso8601DateTime(),
                        updatedAt: iso8601DateTime(),
                        createdBy: like('user_123'),
                        organizationId: like('org_123')
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'New Document',
                    description: 'A new document for testing'
                })
            });

            expect(response.status).toBe(201);
            const data = await response.json();
            expect(data.name).toBe('New Document');
            expect(data.status).toBe('DRAFT');
        });
    });

    describe('Signing Endpoints Contract', () => {
        it('should create signing request', async () => {
            await provider.addInteraction({
                state: 'document exists and user is authenticated',
                uponReceiving: 'a request to create signing request',
                withRequest: {
                    method: 'POST',
                    path: '/api/v1/signing/requests',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: {
                        documentId: 'doc_123',
                        title: 'Please sign this document',
                        message: 'This document requires your signature',
                        recipients: [
                            {
                                email: 'signer@example.com',
                                name: 'John Signer',
                                role: 'signer',
                                order: 1
                            }
                        ]
                    }
                },
                willRespondWith: {
                    status: 201,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        id: like('req_789'),
                        documentId: 'doc_123',
                        title: 'Please sign this document',
                        status: 'DRAFT',
                        recipients: eachLike({
                            id: like('recipient_123'),
                            email: like('signer@example.com'),
                            name: like('John Signer'),
                            role: term({
                                matcher: '^(signer|approver|cc)$',
                                generate: 'signer'
                            }),
                            order: like(1),
                            status: term({
                                matcher: '^(PENDING|SENT|DELIVERED|VIEWED|SIGNED|COMPLETED|DECLINED|ERROR)$',
                                generate: 'PENDING'
                            })
                        }),
                        createdAt: iso8601DateTime(),
                        updatedAt: iso8601DateTime()
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/signing/requests', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documentId: 'doc_123',
                    title: 'Please sign this document',
                    message: 'This document requires your signature',
                    recipients: [
                        {
                            email: 'signer@example.com',
                            name: 'John Signer',
                            role: 'signer',
                            order: 1
                        }
                    ]
                })
            });

            expect(response.status).toBe(201);
            const data = await response.json();
            expect(data.documentId).toBe('doc_123');
            expect(data.recipients).toHaveLength(1);
        });

        it('should get signing request status', async () => {
            await provider.addInteraction({
                state: 'signing request exists',
                uponReceiving: 'a request to get signing status',
                withRequest: {
                    method: 'GET',
                    path: '/api/v1/signing/requests/req_789/status',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        status: term({
                            matcher: '^(DRAFT|SENT|IN_PROGRESS|COMPLETED|CANCELLED|EXPIRED|ERROR)$',
                            generate: 'IN_PROGRESS'
                        }),
                        progress: {
                            totalRecipients: like(2),
                            completedRecipients: like(1),
                            pendingRecipients: like(1),
                            percentComplete: like(50)
                        },
                        recipients: eachLike({
                            id: like('recipient_123'),
                            email: like('signer@example.com'),
                            name: like('John Signer'),
                            status: term({
                                matcher: '^(PENDING|SENT|DELIVERED|VIEWED|SIGNED|COMPLETED|DECLINED|ERROR)$',
                                generate: 'SIGNED'
                            }),
                            signedAt: iso8601DateTime()
                        })
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/signing/requests/req_789/status', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('status');
            expect(data).toHaveProperty('progress');
            expect(data).toHaveProperty('recipients');
        });
    });

    describe('Error Response Contracts', () => {
        it('should return 401 for unauthorized requests', async () => {
            await provider.addInteraction({
                state: 'user is not authenticated',
                uponReceiving: 'a request without authentication',
                withRequest: {
                    method: 'GET',
                    path: '/api/v1/documents'
                },
                willRespondWith: {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        error: like('Unauthorized'),
                        message: like('Authentication required'),
                        timestamp: iso8601DateTime(),
                        path: '/api/v1/documents'
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/documents');

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data).toHaveProperty('error');
            expect(data).toHaveProperty('message');
            expect(data).toHaveProperty('timestamp');
        });

        it('should return 404 for non-existent resources', async () => {
            await provider.addInteraction({
                state: 'document does not exist',
                uponReceiving: 'a request for non-existent document',
                withRequest: {
                    method: 'GET',
                    path: '/api/v1/documents/nonexistent',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                },
                willRespondWith: {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        error: like('Not Found'),
                        message: like('Document not found'),
                        timestamp: iso8601DateTime(),
                        path: '/api/v1/documents/nonexistent'
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/documents/nonexistent', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data).toHaveProperty('error');
            expect(data).toHaveProperty('message');
        });

        it('should return 400 for validation errors', async () => {
            await provider.addInteraction({
                state: 'user is authenticated',
                uponReceiving: 'a request with invalid data',
                withRequest: {
                    method: 'POST',
                    path: '/api/v1/auth/register',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        email: 'invalid-email',
                        password: 'weak'
                    }
                },
                willRespondWith: {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        error: like('Validation Error'),
                        message: like('Invalid input data'),
                        details: eachLike({
                            field: like('email'),
                            message: like('Invalid email format')
                        }),
                        timestamp: iso8601DateTime(),
                        path: '/api/v1/auth/register'
                    }
                }
            });

            const response = await fetch('http://localhost:1234/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: 'weak'
                })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data).toHaveProperty('error');
            expect(data).toHaveProperty('details');
        });
    });
});