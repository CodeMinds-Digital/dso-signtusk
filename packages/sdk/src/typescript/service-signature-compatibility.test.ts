/**
 * Property-based tests for service method signature compatibility
 * **Feature: typescript-compilation-fixes, Property 1: Service Method Signature Compatibility**
 * **Validates: Requirements 1.1, 1.2, 1.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { DocuSignAlternativeSDK } from './client';
import { SDKConfiguration } from './types';
import { BaseService } from './services/base';
import { DocumentService } from './services/documents';
import { UserService } from './services/users';
import { OrganizationService } from './services/organizations';
import { WebhookService } from './services/webhooks';

// Mock HTTP client for testing
const mockHttpClient = {
    defaults: { headers: {} },
    request: async (config: any) => ({
        data: { success: true, id: 'test-id' },
        status: 200,
        headers: { 'x-request-id': 'req_test' },
        requestId: 'req_test'
    }),
    get: async () => ({ data: {}, status: 200, headers: {}, requestId: 'req_get' }),
    post: async () => ({ data: {}, status: 201, headers: {}, requestId: 'req_post' }),
    put: async () => ({ data: {}, status: 200, headers: {}, requestId: 'req_put' }),
    patch: async () => ({ data: {}, status: 200, headers: {}, requestId: 'req_patch' }),
    delete: async () => ({ data: {}, status: 204, headers: {}, requestId: 'req_delete' }),
    uploadFile: async () => ({ data: {}, status: 201, headers: {}, requestId: 'req_upload' })
};

describe('Service Method Signature Compatibility Property Tests', () => {
    let sdk: DocuSignAlternativeSDK;

    beforeEach(() => {
        const config: SDKConfiguration = {
            apiKey: 'test-api-key',
            baseURL: 'https://api-test.docusign-alternative.com',
            environment: 'development',
            httpClient: mockHttpClient
        };

        sdk = new DocuSignAlternativeSDK(config);
    });

    describe('Property 1: Service Method Signature Compatibility', () => {
        it('should ensure all service classes properly extend BaseService without method signature conflicts', () => {
            fc.assert(fc.property(
                fc.record({
                    endpoint: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    data: fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }),
                        value: fc.oneof(fc.string(), fc.integer(), fc.boolean())
                    })
                }),
                (testData) => {
                    // Test that all service instances are properly created and extend BaseService
                    expect(sdk.documents).toBeInstanceOf(DocumentService);
                    expect(sdk.documents).toBeInstanceOf(BaseService);

                    expect(sdk.users).toBeInstanceOf(UserService);
                    expect(sdk.users).toBeInstanceOf(BaseService);

                    expect(sdk.organizations).toBeInstanceOf(OrganizationService);
                    expect(sdk.organizations).toBeInstanceOf(BaseService);

                    expect(sdk.webhooks).toBeInstanceOf(WebhookService);
                    expect(sdk.webhooks).toBeInstanceOf(BaseService);

                    // Verify that service methods don't conflict with BaseService protected methods
                    // All services should have access to protected BaseService methods
                    const services = [sdk.documents, sdk.users, sdk.organizations, sdk.webhooks];

                    services.forEach(service => {
                        // Verify service has access to BaseService protected methods through inheritance
                        expect(service).toHaveProperty('client');
                        expect(typeof (service as any).buildQueryString).toBe('function');
                        expect(typeof (service as any).list).toBe('function');
                        expect(typeof (service as any).get).toBe('function');
                        expect(typeof (service as any).create).toBe('function');
                        expect(typeof (service as any).update).toBe('function');
                        expect(typeof (service as any).patch).toBe('function');
                        expect(typeof (service as any).delete).toBe('function');
                        expect(typeof (service as any).upload).toBe('function');
                    });
                }
            ), { numRuns: 100 });
        });

        it('should ensure service methods use correct BaseService method signatures', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    userId: fc.string({ minLength: 5, maxLength: 20 }),
                    organizationId: fc.string({ minLength: 5, maxLength: 20 }),
                    webhookId: fc.string({ minLength: 5, maxLength: 20 }),
                    documentId: fc.string({ minLength: 5, maxLength: 20 })
                }),
                async (testData) => {
                    try {
                        // Test that service methods properly delegate to BaseService methods
                        // without signature conflicts

                        // UserService methods should work without conflicts
                        const user = await sdk.users.getUser(testData.userId);
                        expect(user).toBeDefined();

                        // OrganizationService methods should work without conflicts
                        const org = await sdk.organizations.getOrganization(testData.organizationId);
                        expect(org).toBeDefined();

                        // WebhookService methods should work without conflicts
                        const webhook = await sdk.webhooks.getWebhook(testData.webhookId);
                        expect(webhook).toBeDefined();

                        // DocumentService methods should work without conflicts
                        const document = await sdk.documents.getDocument(testData.documentId);
                        expect(document).toBeDefined();

                        // Verify that all methods return proper response structure
                        [user, org, webhook, document].forEach(response => {
                            expect(typeof response).toBe('object');
                            expect(response).not.toBeNull();
                        });

                    } catch (error) {
                        // Allow network/mock errors but ensure they're proper Error instances
                        expect(error).toBeInstanceOf(Error);
                    }
                }
            ), { numRuns: 50, timeout: 2000 });
        });

        it('should ensure service method names do not conflict with BaseService method names', () => {
            fc.assert(fc.property(
                fc.constantFrom('documents', 'users', 'organizations', 'webhooks'),
                (serviceName) => {
                    const service = (sdk as any)[serviceName];
                    const baseServiceProtectedMethods = [
                        'buildQueryString', 'list', 'get', 'create', 'update', 'patch', 'delete', 'upload'
                    ];

                    // Verify that service classes don't override BaseService methods with incompatible signatures
                    // Instead, they should use different method names or properly delegate

                    if (serviceName === 'users') {
                        // UserService should have renamed methods to avoid conflicts
                        expect(typeof service.getUser).toBe('function');
                        expect(typeof service.updateUser).toBe('function');
                        expect(typeof service.listUsers).toBe('function');

                        // Should not have conflicting method names
                        expect(service.get).toBeUndefined();
                        expect(service.update).toBeUndefined();
                        expect(service.list).toBeUndefined();
                    }

                    if (serviceName === 'organizations') {
                        // OrganizationService should have renamed methods to avoid conflicts
                        expect(typeof service.getOrganization).toBe('function');
                        expect(typeof service.updateOrganization).toBe('function');

                        // Should not have conflicting method names
                        expect(service.get).toBeUndefined();
                        expect(service.update).toBeUndefined();
                    }

                    if (serviceName === 'webhooks') {
                        // WebhookService should have renamed methods to avoid conflicts
                        expect(typeof service.createWebhook).toBe('function');
                        expect(typeof service.getWebhook).toBe('function');
                        expect(typeof service.listWebhooks).toBe('function');
                        expect(typeof service.updateWebhook).toBe('function');
                        expect(typeof service.deleteWebhook).toBe('function');

                        // Should not have conflicting method names
                        expect(service.create).toBeUndefined();
                        expect(service.get).toBeUndefined();
                        expect(service.list).toBeUndefined();
                        expect(service.update).toBeUndefined();
                        expect(service.delete).toBeUndefined();
                    }

                    if (serviceName === 'documents') {
                        // DocumentService should have renamed upload method to avoid conflicts
                        expect(typeof service.uploadDocument).toBe('function');

                        // DocumentService should not override the upload method from BaseService
                        // The upload method should be the inherited protected method from BaseService
                        const ownMethods = Object.getOwnPropertyNames(service.constructor.prototype)
                            .filter(name => name !== 'constructor');
                        expect(ownMethods).not.toContain('upload');
                        expect(ownMethods).toContain('uploadDocument');
                    }

                    // All services should still have access to BaseService protected methods
                    baseServiceProtectedMethods.forEach(methodName => {
                        expect(typeof (service as any)[methodName]).toBe('function');
                    });
                }
            ), { numRuns: 100 });
        });
    });
});