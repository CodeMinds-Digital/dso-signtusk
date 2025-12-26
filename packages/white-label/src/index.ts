// Main exports
export * from './types';
export * from './branding-service';
export * from './domain-service';
export * from './deployment-service';
export * from './asset-service';
export * from './factory';

// Re-export commonly used types
export type {
    BrandingConfig,
    ColorPalette,
    Typography,
    LogoConfig,
    CustomCSS,
    DomainConfig,
    SSLCertificate,
    DeploymentConfig,
    BrandAsset,
    AssetMetadata,
    BrandingPreview,
    DomainVerificationResult,
    DeploymentStatus,
    AssetUploadResult,
    ThemeGenerationOptions,
    GeneratedTheme,
} from './types';

// Default configurations
export const DEFAULT_COLOR_PALETTE = {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
};

export const DEFAULT_TYPOGRAPHY = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
    },
    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const SUPPORTED_IMAGE_FORMATS = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];

export const SUPPORTED_FONT_FORMATS = [
    'font/woff',
    'font/woff2',
    'application/font-woff',
    'application/font-woff2',
];

export const DEFAULT_THUMBNAIL_SIZES = [
    { width: 150, height: 150 },
    { width: 300, height: 300 },
    { width: 600, height: 600 },
];

// Utility functions
export function validateHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function validateDomain(domain: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain);
}

export function validateSubdomain(subdomain: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/.test(subdomain);
}

export function generateRandomColor(): string {
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

export function contrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, would use a proper color library
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);

    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);

    const l1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
    const l2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

export function isAccessibleContrast(color1: string, color2: string): boolean {
    return contrastRatio(color1, color2) >= 4.5; // WCAG AA standard
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
}

export function isImageFile(mimeType: string): boolean {
    return SUPPORTED_IMAGE_FORMATS.includes(mimeType);
}

export function isFontFile(mimeType: string): boolean {
    return SUPPORTED_FONT_FORMATS.includes(mimeType);
}