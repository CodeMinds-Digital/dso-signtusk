import { vi } from 'vitest';

// Mock sharp for image processing
vi.mock('sharp', () => {
    const mockSharp = vi.fn(() => ({
        metadata: vi.fn().mockResolvedValue({
            width: 800,
            height: 600,
            format: 'jpeg',
        }),
        resize: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image')),
    }));

    mockSharp.default = mockSharp;
    return { default: mockSharp };
});

// Mock node-forge for SSL certificate generation
vi.mock('node-forge', () => ({
    pki: {
        rsa: {
            generateKeyPair: vi.fn().mockReturnValue({
                privateKey: 'mock-private-key',
                publicKey: 'mock-public-key',
            }),
        },
        createCertificate: vi.fn().mockReturnValue({
            publicKey: null,
            serialNumber: '01',
            validity: {
                notBefore: new Date(),
                notAfter: new Date(),
            },
            subject: { attributes: [] },
            issuer: { attributes: [] },
            sign: vi.fn(),
        }),
        privateKeyToPem: vi.fn().mockReturnValue('-----BEGIN PRIVATE KEY-----\nmock-key\n-----END PRIVATE KEY-----'),
        certificateToPem: vi.fn().mockReturnValue('-----BEGIN CERTIFICATE-----\nmock-cert\n-----END CERTIFICATE-----'),
    },
}));

// Mock Color library
vi.mock('color', () => {
    const mockColor = vi.fn((color: string) => ({
        hex: vi.fn().mockReturnValue(color),
        lighten: vi.fn().mockReturnThis(),
        darken: vi.fn().mockReturnThis(),
        contrast: vi.fn().mockReturnValue(4.5), // Mock good contrast ratio
    }));

    mockColor.default = mockColor;
    return { default: mockColor };
});

// Global test setup
beforeEach(() => {
    vi.clearAllMocks();
});