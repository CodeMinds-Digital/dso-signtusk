import { vi } from 'vitest';
import { mockData, storageTestUtils } from '../utils/test-helpers';

/**
 * Document management domain test fixtures
 */

export const documentFixtures = {
    // Mock document service
    mockDocumentService: () => ({
        upload: vi.fn().mockResolvedValue({
            id: mockData.document().id,
            name: 'test-document.pdf',
            size: 1024000,
            url: 'https://storage.example.com/documents/test.pdf',
        }),

        get: vi.fn().mockResolvedValue(mockData.document()),

        list: vi.fn().mockResolvedValue({
            documents: Array.from({ length: 10 }, () => mockData.document()),
            total: 10,
            page: 1,
            limit: 10,
        }),

        search: vi.fn().mockResolvedValue({
            documents: Array.from({ length: 5 }, () => mockData.document()),
            total: 5,
            query: 'contract',
        }),

        delete: vi.fn().mockResolvedValue(true),

        updateMetadata: vi.fn().mockResolvedValue(mockData.document()),

        generateThumbnail: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockthumbnail'),

        extractText: vi.fn().mockResolvedValue('Extracted text content from PDF'),
    }),

    // Mock PDF processing service
    mockPdfService: () => ({
        loadPdf: vi.fn().mockResolvedValue({
            pageCount: 3,
            metadata: {
                title: 'Test Document',
                author: 'Test Author',
                creationDate: new Date(),
            },
        }),

        addField: vi.fn().mockResolvedValue({
            fieldId: mockData.signatureField().id,
            page: 1,
            coordinates: { x: 100, y: 200, width: 200, height: 50 },
        }),

        removeField: vi.fn().mockResolvedValue(true),

        getFields: vi.fn().mockResolvedValue([
            mockData.signatureField(),
            mockData.signatureField(),
        ]),

        renderPage: vi.fn().mockResolvedValue(Buffer.from('mock page image')),

        mergePdfs: vi.fn().mockResolvedValue(storageTestUtils.createMockPdfBuffer()),

        splitPdf: vi.fn().mockResolvedValue([
            storageTestUtils.createMockPdfBuffer(),
            storageTestUtils.createMockPdfBuffer(),
        ]),

        optimizePdf: vi.fn().mockResolvedValue({
            originalSize: 2048000,
            optimizedSize: 1024000,
            compressionRatio: 0.5,
        }),
    }),

    // Mock signing service
    mockSigningService: () => ({
        createSigningRequest: vi.fn().mockResolvedValue({
            id: mockData.signingRequest().id,
            signingUrl: 'https://app.example.com/sign/abc123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }),

        getSigningRequest: vi.fn().mockResolvedValue(mockData.signingRequest()),

        addRecipient: vi.fn().mockResolvedValue(mockData.recipient()),

        removeRecipient: vi.fn().mockResolvedValue(true),

        sendReminder: vi.fn().mockResolvedValue(true),

        cancelRequest: vi.fn().mockResolvedValue(true),

        getSigningStatus: vi.fn().mockResolvedValue({
            status: 'in_progress',
            completedRecipients: 1,
            totalRecipients: 3,
            progress: 33.33,
        }),
    }),

    // Mock signature service
    mockSignatureService: () => ({
        captureSignature: vi.fn().mockResolvedValue({
            signatureId: 'sig_123',
            imageData: 'data:image/png;base64,mocksignature',
            timestamp: new Date(),
        }),

        applySignature: vi.fn().mockResolvedValue({
            fieldId: 'field_123',
            signatureId: 'sig_123',
            applied: true,
        }),

        validateSignature: vi.fn().mockResolvedValue({
            valid: true,
            timestamp: new Date(),
            signer: mockData.user(),
        }),

        generateCertificate: vi.fn().mockResolvedValue({
            certificateId: 'cert_123',
            pdfBuffer: storageTestUtils.createMockPdfBuffer(),
        }),
    }),

    // Test scenarios
    scenarios: {
        validUpload: {
            file: storageTestUtils.mockFile({
                originalname: 'contract.pdf',
                mimetype: 'application/pdf',
                size: 1024000,
            }),
            expectedResult: {
                success: true,
                document: mockData.document(),
            },
        },

        invalidFileType: {
            file: storageTestUtils.mockFile({
                originalname: 'document.txt',
                mimetype: 'text/plain',
            }),
            expectedError: 'Invalid file type. Only PDF files are allowed.',
        },

        fileTooLarge: {
            file: storageTestUtils.mockFile({
                size: 50 * 1024 * 1024, // 50MB
            }),
            expectedError: 'File size exceeds maximum limit of 25MB.',
        },

        corruptedPdf: {
            file: storageTestUtils.mockFile({
                originalname: 'corrupted.pdf',
                mimetype: 'application/pdf',
                buffer: Buffer.from('invalid pdf content'),
            }),
            expectedError: 'Invalid or corrupted PDF file.',
        },

        successfulSigning: {
            signingRequest: mockData.signingRequest(),
            signature: {
                type: 'drawn',
                data: 'data:image/png;base64,signature',
            },
            expectedResult: {
                success: true,
                signedDocument: mockData.document(),
            },
        },
    },

    // Mock folder service
    mockFolderService: () => ({
        create: vi.fn().mockResolvedValue({
            id: 'folder_123',
            name: 'Test Folder',
            parentId: null,
            path: '/Test Folder',
        }),

        list: vi.fn().mockResolvedValue([
            { id: 'folder_1', name: 'Contracts', documentCount: 5 },
            { id: 'folder_2', name: 'Templates', documentCount: 3 },
        ]),

        move: vi.fn().mockResolvedValue(true),

        delete: vi.fn().mockResolvedValue(true),

        getDocuments: vi.fn().mockResolvedValue({
            documents: Array.from({ length: 5 }, () => mockData.document()),
            total: 5,
        }),
    }),

    // Mock template service
    mockTemplateService: () => ({
        create: vi.fn().mockResolvedValue(mockData.template()),

        get: vi.fn().mockResolvedValue(mockData.template()),

        list: vi.fn().mockResolvedValue({
            templates: Array.from({ length: 10 }, () => mockData.template()),
            total: 10,
        }),

        instantiate: vi.fn().mockResolvedValue({
            documentId: mockData.document().id,
            fieldsPopulated: 5,
        }),

        share: vi.fn().mockResolvedValue({
            shareId: 'share_123',
            shareUrl: 'https://app.example.com/templates/share/abc123',
        }),

        clone: vi.fn().mockResolvedValue(mockData.template()),

        getUsageStats: vi.fn().mockResolvedValue({
            totalUses: 150,
            thisMonth: 25,
            avgCompletionTime: 300, // seconds
        }),
    }),

    // Mock validation utilities
    mockValidationUtils: () => ({
        validatePdf: vi.fn().mockResolvedValue({
            valid: true,
            pageCount: 3,
            hasText: true,
            hasImages: false,
        }),

        validateField: vi.fn().mockReturnValue({
            valid: true,
            errors: [],
        }),

        validateSignature: vi.fn().mockReturnValue({
            valid: true,
            strength: 'strong',
        }),
    }),
};