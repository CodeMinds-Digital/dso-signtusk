/**
 * Signature and workflow test fixtures
 */

export const mockRecipients = {
    signer1: {
        id: '550e8400-e29b-41d4-a716-446655440200',
        email: 'signer1@test.com',
        name: 'John Signer',
        role: 'signer',
        order: 1,
        status: 'pending',
        accessToken: 'signer1-access-token-123',
        completedAt: null,
    },
    signer2: {
        id: '550e8400-e29b-41d4-a716-446655440201',
        email: 'signer2@test.com',
        name: 'Jane Signer',
        role: 'signer',
        order: 2,
        status: 'pending',
        accessToken: 'signer2-access-token-456',
        completedAt: null,
    },
    approver: {
        id: '550e8400-e29b-41d4-a716-446655440202',
        email: 'approver@test.com',
        name: 'Bob Approver',
        role: 'approver',
        order: 3,
        status: 'pending',
        accessToken: 'approver-access-token-789',
        completedAt: null,
    },
    viewer: {
        id: '550e8400-e29b-41d4-a716-446655440203',
        email: 'viewer@test.com',
        name: 'Alice Viewer',
        role: 'viewer',
        order: 0,
        status: 'completed',
        accessToken: 'viewer-access-token-000',
        completedAt: new Date('2024-01-01T12:00:00Z'),
    },
};

export const mockSigningRequests = {
    sequential: {
        id: '550e8400-e29b-41d4-a716-446655440210',
        documentId: '550e8400-e29b-41d4-a716-446655440100',
        title: 'Sequential Signing Request',
        message: 'Please sign this document in order',
        status: 'active',
        signingOrder: 'sequential',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        reminderInterval: 24, // hours
        recipients: [mockRecipients.signer1, mockRecipients.signer2],
        createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    parallel: {
        id: '550e8400-e29b-41d4-a716-446655440211',
        documentId: '550e8400-e29b-41d4-a716-446655440101',
        title: 'Parallel Signing Request',
        message: 'Please sign this document',
        status: 'active',
        signingOrder: 'parallel',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        reminderInterval: 48, // hours
        recipients: [mockRecipients.signer1, mockRecipients.signer2],
        createdAt: new Date('2024-01-02T00:00:00Z'),
    },
    completed: {
        id: '550e8400-e29b-41d4-a716-446655440212',
        documentId: '550e8400-e29b-41d4-a716-446655440100',
        title: 'Completed Signing Request',
        message: 'This document has been signed',
        status: 'completed',
        signingOrder: 'sequential',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reminderInterval: 24,
        recipients: [
            { ...mockRecipients.signer1, status: 'completed', completedAt: new Date('2024-01-03T10:00:00Z') },
            { ...mockRecipients.signer2, status: 'completed', completedAt: new Date('2024-01-03T15:00:00Z') },
        ],
        completedAt: new Date('2024-01-03T15:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
    },
};

export const mockSignatures = {
    drawnSignature: {
        id: '550e8400-e29b-41d4-a716-446655440220',
        fieldId: '550e8400-e29b-41d4-a716-446655440120',
        recipientId: mockRecipients.signer1.id,
        type: 'drawn',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        timestamp: new Date('2024-01-03T10:00:00Z'),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        biometricData: {
            pressure: [0.5, 0.7, 0.8, 0.6, 0.4],
            velocity: [1.2, 1.5, 1.8, 1.3, 1.0],
            acceleration: [0.1, 0.2, 0.3, 0.2, 0.1],
        },
    },
    typedSignature: {
        id: '550e8400-e29b-41d4-a716-446655440221',
        fieldId: '550e8400-e29b-41d4-a716-446655440120',
        recipientId: mockRecipients.signer2.id,
        type: 'typed',
        data: 'Jane Signer',
        font: 'signature-font-1',
        timestamp: new Date('2024-01-03T15:00:00Z'),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    uploadedSignature: {
        id: '550e8400-e29b-41d4-a716-446655440222',
        fieldId: '550e8400-e29b-41d4-a716-446655440120',
        recipientId: mockRecipients.approver.id,
        type: 'uploaded',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        timestamp: new Date('2024-01-04T09:00:00Z'),
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    },
};

export const mockWorkflows = {
    simple: {
        id: '550e8400-e29b-41d4-a716-446655440230',
        name: 'Simple Approval Workflow',
        steps: [
            {
                id: 'step-1',
                type: 'sign',
                recipients: [mockRecipients.signer1.id],
                required: true,
            },
            {
                id: 'step-2',
                type: 'approve',
                recipients: [mockRecipients.approver.id],
                required: true,
            },
        ],
        currentStep: 'step-1',
        status: 'active',
    },
    conditional: {
        id: '550e8400-e29b-41d4-a716-446655440231',
        name: 'Conditional Workflow',
        steps: [
            {
                id: 'step-1',
                type: 'sign',
                recipients: [mockRecipients.signer1.id],
                required: true,
            },
            {
                id: 'step-2',
                type: 'conditional',
                condition: 'field.contract_value > 10000',
                trueStep: 'step-3a',
                falseStep: 'step-3b',
            },
            {
                id: 'step-3a',
                type: 'approve',
                recipients: [mockRecipients.approver.id],
                required: true,
            },
            {
                id: 'step-3b',
                type: 'sign',
                recipients: [mockRecipients.signer2.id],
                required: true,
            },
        ],
        currentStep: 'step-1',
        status: 'active',
    },
};

export const mockCertificates = {
    selfSigned: {
        id: '550e8400-e29b-41d4-a716-446655440240',
        subject: 'CN=Test Certificate,O=Test Organization,C=US',
        issuer: 'CN=Test Certificate,O=Test Organization,C=US',
        serialNumber: '123456789',
        validFrom: new Date('2024-01-01T00:00:00Z'),
        validTo: new Date('2025-01-01T00:00:00Z'),
        fingerprint: 'SHA256:1234567890abcdef1234567890abcdef12345678',
        publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
    },
    ca: {
        id: '550e8400-e29b-41d4-a716-446655440241',
        subject: 'CN=Test CA,O=Test CA Organization,C=US',
        issuer: 'CN=Test Root CA,O=Test Root CA Organization,C=US',
        serialNumber: '987654321',
        validFrom: new Date('2023-01-01T00:00:00Z'),
        validTo: new Date('2026-01-01T00:00:00Z'),
        fingerprint: 'SHA256:abcdef1234567890abcdef1234567890abcdef12',
        publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
    },
};

export const mockAuditTrail = {
    documentCreated: {
        id: '550e8400-e29b-41d4-a716-446655440250',
        action: 'document.created',
        entityId: '550e8400-e29b-41d4-a716-446655440100',
        entityType: 'document',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        metadata: {
            documentName: 'Simple Contract.pdf',
            documentSize: 245760,
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2024-01-01T00:00:00Z'),
    },
    signatureCompleted: {
        id: '550e8400-e29b-41d4-a716-446655440251',
        action: 'signature.completed',
        entityId: mockSignatures.drawnSignature.id,
        entityType: 'signature',
        userId: mockRecipients.signer1.id,
        metadata: {
            signatureType: 'drawn',
            fieldId: '550e8400-e29b-41d4-a716-446655440120',
            documentId: '550e8400-e29b-41d4-a716-446655440100',
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2024-01-03T10:00:00Z'),
    },
};

export const createMockSignatureData = (type: 'drawn' | 'typed' | 'uploaded', content?: string) => {
    switch (type) {
        case 'drawn':
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        case 'typed':
            return content || 'Test Signature';
        case 'uploaded':
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        default:
            throw new Error(`Unknown signature type: ${type}`);
    }
};

export const createMockBiometricData = () => {
    return {
        pressure: Array.from({ length: 10 }, () => Math.random()),
        velocity: Array.from({ length: 10 }, () => Math.random() * 2),
        acceleration: Array.from({ length: 10 }, () => Math.random() * 0.5),
        timestamp: Array.from({ length: 10 }, (_, i) => Date.now() + i * 100),
    };
};