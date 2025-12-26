import { z } from 'zod';

// ============================================================================
// BRANDING CONFIGURATION SCHEMAS
// ============================================================================

export const ColorPaletteSchema = z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    textSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    border: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    success: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    error: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    info: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
});

export const TypographySchema = z.object({
    fontFamily: z.string().min(1),
    headingFontFamily: z.string().optional(),
    fontSize: z.object({
        xs: z.string(),
        sm: z.string(),
        base: z.string(),
        lg: z.string(),
        xl: z.string(),
        '2xl': z.string(),
        '3xl': z.string(),
        '4xl': z.string(),
    }),
    fontWeight: z.object({
        light: z.number().min(100).max(900),
        normal: z.number().min(100).max(900),
        medium: z.number().min(100).max(900),
        semibold: z.number().min(100).max(900),
        bold: z.number().min(100).max(900),
    }),
    lineHeight: z.object({
        tight: z.number().positive(),
        normal: z.number().positive(),
        relaxed: z.number().positive(),
    }),
});

export const LogoConfigSchema = z.object({
    primary: z.object({
        url: z.string().url(),
        width: z.number().positive(),
        height: z.number().positive(),
        alt: z.string().min(1),
    }),
    secondary: z.object({
        url: z.string().url(),
        width: z.number().positive(),
        height: z.number().positive(),
        alt: z.string().min(1),
    }).optional(),
    favicon: z.object({
        url: z.string().url(),
        sizes: z.array(z.string()),
    }),
    appleTouchIcon: z.object({
        url: z.string().url(),
        sizes: z.array(z.string()),
    }).optional(),
});

export const CustomCSSSchema = z.object({
    global: z.string().optional(),
    components: z.record(z.string()).optional(),
    variables: z.record(z.string()).optional(),
});

export const BrandingConfigSchema = z.object({
    organizationId: z.string().cuid(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    colors: ColorPaletteSchema,
    typography: TypographySchema,
    logos: LogoConfigSchema,
    customCSS: CustomCSSSchema.optional(),
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
    animations: z.boolean().default(true),
    version: z.number().positive().default(1),
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

// ============================================================================
// DOMAIN CONFIGURATION SCHEMAS
// ============================================================================

export const SSLCertificateSchema = z.object({
    provider: z.enum(['letsencrypt', 'custom', 'cloudflare']),
    certificate: z.string().optional(),
    privateKey: z.string().optional(),
    certificateChain: z.string().optional(),
    autoRenewal: z.boolean().default(true),
    expiresAt: z.date().optional(),
    status: z.enum(['pending', 'active', 'expired', 'error']).default('pending'),
});

export const DomainConfigSchema = z.object({
    organizationId: z.string().cuid(),
    domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/, 'Invalid domain format'),
    subdomain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/, 'Invalid subdomain format').optional(),
    isCustomDomain: z.boolean().default(false),
    ssl: SSLCertificateSchema,
    dnsRecords: z.array(z.object({
        type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT']),
        name: z.string(),
        value: z.string(),
        ttl: z.number().positive().default(300),
        priority: z.number().optional(),
    })).default([]),
    status: z.enum(['pending', 'active', 'error', 'suspended']).default('pending'),
    verificationToken: z.string().optional(),
    verifiedAt: z.date().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

// ============================================================================
// WHITE-LABEL DEPLOYMENT SCHEMAS
// ============================================================================

export const DeploymentConfigSchema = z.object({
    organizationId: z.string().cuid(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    domain: z.string(),
    brandingId: z.string().cuid(),
    features: z.object({
        customBranding: z.boolean().default(true),
        customDomain: z.boolean().default(false),
        apiAccess: z.boolean().default(true),
        webhooks: z.boolean().default(true),
        analytics: z.boolean().default(true),
        whiteLabel: z.boolean().default(true),
    }),
    limits: z.object({
        maxUsers: z.number().positive().optional(),
        maxDocuments: z.number().positive().optional(),
        maxStorage: z.number().positive().optional(), // in bytes
        maxApiCalls: z.number().positive().optional(), // per month
    }).optional(),
    environment: z.enum(['development', 'staging', 'production']).default('production'),
    status: z.enum(['pending', 'deploying', 'active', 'error', 'suspended']).default('pending'),
    deployedAt: z.date().optional(),
    lastHealthCheck: z.date().optional(),
    healthStatus: z.enum(['healthy', 'degraded', 'unhealthy']).default('healthy'),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

// ============================================================================
// ASSET MANAGEMENT SCHEMAS
// ============================================================================

export const AssetMetadataSchema = z.object({
    filename: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string(),
    size: z.number().positive(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    hash: z.string(),
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
});

export const BrandAssetSchema = z.object({
    id: z.string().cuid(),
    organizationId: z.string().cuid(),
    brandingId: z.string().cuid(),
    type: z.enum(['logo', 'favicon', 'background', 'icon', 'font', 'image']),
    category: z.string().optional(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    metadata: AssetMetadataSchema,
    version: z.number().positive().default(1),
    isActive: z.boolean().default(true),
    tags: z.array(z.string()).default([]),
    createdBy: z.string().cuid(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

// ============================================================================
// THEME GENERATION SCHEMAS
// ============================================================================

export const ThemeVariablesSchema = z.object({
    colors: z.record(z.string()),
    typography: z.record(z.string()),
    spacing: z.record(z.string()),
    shadows: z.record(z.string()),
    borders: z.record(z.string()),
    animations: z.record(z.string()),
});

export const GeneratedThemeSchema = z.object({
    brandingId: z.string().cuid(),
    css: z.string(),
    variables: ThemeVariablesSchema,
    tailwindConfig: z.record(z.any()),
    version: z.number().positive(),
    generatedAt: z.date().default(() => new Date()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ColorPalette = z.infer<typeof ColorPaletteSchema>;
export type Typography = z.infer<typeof TypographySchema>;
export type LogoConfig = z.infer<typeof LogoConfigSchema>;
export type CustomCSS = z.infer<typeof CustomCSSSchema>;
export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;

export type SSLCertificate = z.infer<typeof SSLCertificateSchema>;
export type DomainConfig = z.infer<typeof DomainConfigSchema>;

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

export type AssetMetadata = z.infer<typeof AssetMetadataSchema>;
export type BrandAsset = z.infer<typeof BrandAssetSchema>;

export type ThemeVariables = z.infer<typeof ThemeVariablesSchema>;
export type GeneratedTheme = z.infer<typeof GeneratedThemeSchema>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface BrandingPreview {
    brandingId: string;
    previewUrl: string;
    thumbnailUrl: string;
    generatedAt: Date;
    expiresAt: Date;
}

export interface DomainVerificationResult {
    domain: string;
    verified: boolean;
    records: Array<{
        type: string;
        name: string;
        expected: string;
        actual?: string;
        valid: boolean;
    }>;
    errors: string[];
}

export interface DeploymentStatus {
    deploymentId: string;
    status: 'pending' | 'deploying' | 'active' | 'error' | 'suspended';
    progress: number; // 0-100
    message: string;
    logs: Array<{
        timestamp: Date;
        level: 'info' | 'warn' | 'error';
        message: string;
    }>;
}

export interface AssetUploadResult {
    asset: BrandAsset;
    uploadUrl?: string;
    thumbnailUrl?: string;
}

export interface ThemeGenerationOptions {
    includeAnimations: boolean;
    includeFonts: boolean;
    includeCustomCSS: boolean;
    minify: boolean;
    format: 'css' | 'scss' | 'tailwind';
}