/**
 * Document test fixtures and utilities
 */

export const mockDocuments = {
    simplePDF: {
        id: '550e8400-e29b-41d4-a716-446655440100',
        name: 'Simple Contract.pdf',
        originalName: 'contract-template.pdf',
        mimeType: 'application/pdf',
        size: 245760, // 240KB
        hash: 'sha256:abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
        status: 'active',
        metadata: {
            title: 'Simple Contract',
            description: 'A basic contract template',
            tags: ['contract', 'legal'],
            category: 'Legal Documents',
        },
    },
    complexDocument: {
        id: '550e8400-e29b-41d4-a716-446655440101',
        name: 'Multi-Page Agreement.pdf',
        originalName: 'complex-agreement.pdf',
        mimeType: 'application/pdf',
        size: 1048576, // 1MB
        hash: 'sha256:efgh5678901234efgh5678901234efgh5678901234efgh5678901234efgh5678',
        status: 'active',
        metadata: {
            title: 'Multi-Page Agreement',
            description: 'Complex agreement with multiple sections',
            tags: ['agreement', 'multi-page', 'complex'],
            category: 'Agreements',
        },
    },
};

export const mockFolders = {
    contracts: {
        id: '550e8400-e29b-41d4-a716-446655440110',
        name: 'Contracts',
        parentId: null,
        path: '/Contracts',
        permissions: {
            read: true,
            write: true,
            delete: true,
        },
    },
    templates: {
        id: '550e8400-e29b-41d4-a716-446655440111',
        name: 'Templates',
        parentId: null,
        path: '/Templates',
        permissions: {
            read: true,
            write: true,
            delete: false,
        },
    },
    archived: {
        id: '550e8400-e29b-41d4-a716-446655440112',
        name: 'Archived',
        parentId: null,
        path: '/Archived',
        permissions: {
            read: true,
            write: false,
            delete: false,
        },
    },
};

export const mockDocumentFields = {
    signatureField: {
        id: '550e8400-e29b-41d4-a716-446655440120',
        type: 'signature',
        position: {
            x: 0.1,
            y: 0.8,
            width: 0.3,
            height: 0.1,
            page: 1,
        },
        required: true,
        label: 'Client Signature',
        recipientId: '550e8400-e29b-41d4-a716-446655440002',
    },
    dateField: {
        id: '550e8400-e29b-41d4-a716-446655440121',
        type: 'date',
        position: {
            x: 0.5,
            y: 0.8,
            width: 0.2,
            height: 0.05,
            page: 1,
        },
        required: true,
        label: 'Date Signed',
        recipientId: '550e8400-e29b-41d4-a716-446655440002',
    },
    textField: {
        id: '550e8400-e29b-41d4-a716-446655440122',
        type: 'text',
        position: {
            x: 0.1,
            y: 0.7,
            width: 0.4,
            height: 0.05,
            page: 1,
        },
        required: false,
        label: 'Company Name',
        placeholder: 'Enter company name',
        recipientId: '550e8400-e29b-41d4-a716-446655440002',
    },
};

export const mockDocumentVersions = {
    v1: {
        id: '550e8400-e29b-41d4-a716-446655440130',
        documentId: mockDocuments.simplePDF.id,
        version: 1,
        hash: mockDocuments.simplePDF.hash,
        size: mockDocuments.simplePDF.size,
        changes: 'Initial version',
        createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    v2: {
        id: '550e8400-e29b-41d4-a716-446655440131',
        documentId: mockDocuments.simplePDF.id,
        version: 2,
        hash: 'sha256:updated1234567890updated1234567890updated1234567890updated1234',
        size: 250000,
        changes: 'Updated terms and conditions',
        createdAt: new Date('2024-01-15T00:00:00Z'),
    },
};

export const mockDocumentShares = {
    publicShare: {
        id: '550e8400-e29b-41d4-a716-446655440140',
        documentId: mockDocuments.simplePDF.id,
        shareToken: 'public-share-token-123456789',
        permissions: ['read'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        passwordProtected: false,
        accessCount: 0,
        maxAccess: null,
    },
    protectedShare: {
        id: '550e8400-e29b-41d4-a716-446655440141',
        documentId: mockDocuments.complexDocument.id,
        shareToken: 'protected-share-token-123456789',
        permissions: ['read', 'comment'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        passwordProtected: true,
        password: 'SharePassword123!',
        accessCount: 5,
        maxAccess: 10,
    },
};

export const mockDocumentComments = {
    comment1: {
        id: '550e8400-e29b-41d4-a716-446655440150',
        documentId: mockDocuments.simplePDF.id,
        userId: '550e8400-e29b-41d4-a716-446655440002',
        content: 'Please review section 3.2',
        position: {
            x: 0.2,
            y: 0.5,
            page: 1,
        },
        resolved: false,
        createdAt: new Date('2024-01-10T10:00:00Z'),
    },
    comment2: {
        id: '550e8400-e29b-41d4-a716-446655440151',
        documentId: mockDocuments.simplePDF.id,
        userId: '550e8400-e29b-41d4-a716-446655440001',
        content: 'Updated as requested',
        position: {
            x: 0.2,
            y: 0.5,
            page: 1,
        },
        resolved: true,
        resolvedAt: new Date('2024-01-11T14:30:00Z'),
        createdAt: new Date('2024-01-11T14:30:00Z'),
    },
};

export const createMockPDFBuffer = (size: number = 1024): Buffer => {
    // Create a minimal PDF structure for testing
    const pdfHeader = '%PDF-1.4\n';
    const pdfTrailer = '\n%%EOF';
    const content = 'Mock PDF content for testing purposes.';

    const totalContent = pdfHeader + content.repeat(Math.ceil(size / content.length)) + pdfTrailer;
    return Buffer.from(totalContent.slice(0, size));
};

export const createMockDocumentUpload = (overrides: Partial<any> = {}) => {
    return {
        originalname: 'test-document.pdf',
        mimetype: 'application/pdf',
        size: 245760,
        buffer: createMockPDFBuffer(245760),
        ...overrides,
    };
};

export const mockDocumentAnalytics = {
    views: {
        total: 150,
        unique: 45,
        byDay: [
            { date: '2024-01-01', views: 10 },
            { date: '2024-01-02', views: 15 },
            { date: '2024-01-03', views: 8 },
        ],
    },
    downloads: {
        total: 25,
        byDay: [
            { date: '2024-01-01', downloads: 3 },
            { date: '2024-01-02', downloads: 5 },
            { date: '2024-01-03', downloads: 2 },
        ],
    },
    completionRate: 0.85,
    averageTimeToComplete: 1800, // 30 minutes in seconds
};