import { PDFDocument, PDFPage, PDFFont, rgb, PDFImage, degrees } from 'pdf-lib';
import { z } from 'zod';
import { PDFProcessingError } from './types';

/**
 * Signature appearance configuration schema
 */
export const SignatureAppearanceConfigSchema = z.object({
    // Image-based signature
    imageData: z.string().optional(), // Base64 encoded image
    imageFormat: z.enum(['png', 'jpg', 'jpeg']).optional(),

    // Text-based signature
    text: z.string().optional(),
    font: z.enum(['Helvetica', 'Times-Roman', 'Courier']).default('Helvetica'),
    fontSize: z.number().min(6).max(72).default(12),

    // Positioning and sizing
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(10),
    height: z.number().min(10),
    page: z.number().min(0).default(0),

    // Appearance customization
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    borderWidth: z.number().min(0).max(10).default(1),
    textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),

    // Branding elements
    logo: z.string().optional(), // Base64 encoded logo
    logoPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).default('top-left'),
    logoSize: z.number().min(10).max(100).default(20),

    // Signature metadata display
    showTimestamp: z.boolean().default(true),
    showSignerName: z.boolean().default(true),
    showReason: z.boolean().default(false),
    showLocation: z.boolean().default(false),

    // Multi-page support
    multiPageCoordination: z.boolean().default(false),
    pageReferences: z.array(z.object({
        page: z.number().min(0),
        x: z.number().min(0),
        y: z.number().min(0),
        width: z.number().min(10),
        height: z.number().min(10),
    })).optional(),

    // Rotation and scaling
    rotation: z.number().min(0).max(360).default(0),
    scaleX: z.number().min(0.1).max(5).default(1),
    scaleY: z.number().min(0.1).max(5).default(1),

    // Quality settings
    imageQuality: z.number().min(0.1).max(1).default(0.9),
    antiAliasing: z.boolean().default(true),
});

export type SignatureAppearanceConfig = z.infer<typeof SignatureAppearanceConfigSchema>;

/**
 * Signature appearance metadata
 */
export interface SignatureAppearanceMetadata {
    signerName?: string;
    signingTime?: Date;
    reason?: string;
    location?: string;
    contactInfo?: string;
    certificateInfo?: {
        subject: string;
        issuer: string;
        serialNumber: string;
        validFrom: Date;
        validTo: Date;
    };
}

/**
 * Signature appearance result
 */
export interface SignatureAppearanceResult {
    success: boolean;
    signatureId: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
        page: number;
    };
    multiPageReferences?: Array<{
        page: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    metadata: SignatureAppearanceMetadata;
    processingTime: number;
}

/**
 * Signature appearance engine for creating customized signature visuals
 */
export class SignatureAppearanceEngine {
    private fonts: Map<string, PDFFont> = new Map();
    private images: Map<string, PDFImage> = new Map();

    /**
     * Generate signature appearance and apply to PDF document
     */
    async generateSignatureAppearance(
        document: PDFDocument,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<SignatureAppearanceResult> {
        const startTime = Date.now();

        try {
            // Validate configuration
            const validatedConfig = SignatureAppearanceConfigSchema.parse(config);

            // Get target page
            const pages = document.getPages();
            if (validatedConfig.page >= pages.length) {
                throw new PDFProcessingError(
                    `Page ${validatedConfig.page} does not exist in document`,
                    'INVALID_PAGE_NUMBER'
                );
            }

            const page = pages[validatedConfig.page];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Validate positioning
            this.validatePositioning(validatedConfig, pageWidth, pageHeight);

            // Generate unique signature ID
            const signatureId = this.generateSignatureId();

            // Create signature appearance
            if (validatedConfig.imageData) {
                await this.createImageBasedSignature(document, page, validatedConfig, metadata);
            } else if (validatedConfig.text) {
                await this.createTextBasedSignature(document, page, validatedConfig, metadata);
            } else {
                await this.createDefaultSignature(document, page, validatedConfig, metadata);
            }

            // Handle multi-page coordination if enabled
            const multiPageReferences = validatedConfig.multiPageCoordination && validatedConfig.pageReferences
                ? await this.handleMultiPageCoordination(document, validatedConfig, metadata)
                : undefined;

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                signatureId,
                boundingBox: {
                    x: validatedConfig.x,
                    y: validatedConfig.y,
                    width: validatedConfig.width,
                    height: validatedConfig.height,
                    page: validatedConfig.page,
                },
                multiPageReferences,
                metadata,
                processingTime,
            };

        } catch (error) {
            throw new PDFProcessingError(
                `Failed to generate signature appearance: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SIGNATURE_APPEARANCE_ERROR',
                error
            );
        }
    }

    /**
     * Create image-based signature appearance
     */
    private async createImageBasedSignature(
        document: PDFDocument,
        page: PDFPage,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<void> {
        if (!config.imageData) return;

        // Decode base64 image
        const imageBuffer = Buffer.from(config.imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

        // Embed image in document
        let image: PDFImage;
        const format = config.imageFormat || this.detectImageFormat(config.imageData);

        if (format === 'png') {
            image = await document.embedPng(imageBuffer);
        } else {
            image = await document.embedJpg(imageBuffer);
        }

        // Calculate positioning (PDF coordinates start from bottom-left)
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const yPosition = pageHeight - config.y - config.height;

        // Apply scaling and rotation
        const scaleX = config.scaleX || 1;
        const scaleY = config.scaleY || 1;
        const rotation = config.rotation || 0;

        // Draw signature image
        page.drawImage(image, {
            x: config.x,
            y: yPosition,
            width: config.width * scaleX,
            height: config.height * scaleY,
            rotate: degrees(rotation),
            opacity: config.imageQuality,
        });

        // Add branding logo if specified
        if (config.logo) {
            await this.addBrandingLogo(document, page, config, yPosition);
        }

        // Add metadata text if enabled
        if (config.showTimestamp || config.showSignerName || config.showReason || config.showLocation) {
            await this.addMetadataText(document, page, config, metadata, yPosition);
        }

        // Add border if specified
        if (config.borderColor && config.borderWidth > 0) {
            this.addBorder(page, config, yPosition);
        }
    }

    /**
     * Create text-based signature appearance
     */
    private async createTextBasedSignature(
        document: PDFDocument,
        page: PDFPage,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<void> {
        if (!config.text) return;

        // Get or load font
        const font = await this.getFont(document, config.font);

        // Calculate positioning
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const yPosition = pageHeight - config.y - config.height;

        // Parse text color
        const textColor = this.parseColor(config.textColor);

        // Add background if specified
        if (config.backgroundColor) {
            const bgColor = this.parseColor(config.backgroundColor);
            page.drawRectangle({
                x: config.x,
                y: yPosition,
                width: config.width,
                height: config.height,
                color: bgColor,
            });
        }

        // Calculate text positioning within signature area
        const textWidth = font.widthOfTextAtSize(config.text, config.fontSize);
        const textHeight = font.heightAtSize(config.fontSize);

        // Center text within signature area
        const textX = config.x + (config.width - textWidth) / 2;
        const textY = yPosition + (config.height - textHeight) / 2;

        // Draw signature text
        page.drawText(config.text, {
            x: textX,
            y: textY,
            size: config.fontSize,
            font: font,
            color: textColor,
            rotate: degrees(config.rotation || 0),
        });

        // Add branding logo if specified
        if (config.logo) {
            await this.addBrandingLogo(document, page, config, yPosition);
        }

        // Add metadata text if enabled
        if (config.showTimestamp || config.showSignerName || config.showReason || config.showLocation) {
            await this.addMetadataText(document, page, config, metadata, yPosition);
        }

        // Add border if specified
        if (config.borderColor && config.borderWidth > 0) {
            this.addBorder(page, config, yPosition);
        }
    }

    /**
     * Create default signature appearance when no image or text is provided
     */
    private async createDefaultSignature(
        document: PDFDocument,
        page: PDFPage,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<void> {
        // Get default font
        const font = await this.getFont(document, 'Helvetica');

        // Calculate positioning
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const yPosition = pageHeight - config.y - config.height;

        // Add background
        const bgColor = config.backgroundColor ? this.parseColor(config.backgroundColor) : rgb(0.95, 0.95, 0.95);
        page.drawRectangle({
            x: config.x,
            y: yPosition,
            width: config.width,
            height: config.height,
            color: bgColor,
        });

        // Create default signature text
        const defaultText = metadata.signerName || 'Digital Signature';
        const fontSize = Math.min(config.fontSize, config.height / 3);
        const textColor = this.parseColor(config.textColor);

        // Center text
        const textWidth = font.widthOfTextAtSize(defaultText, fontSize);
        const textX = config.x + (config.width - textWidth) / 2;
        const textY = yPosition + config.height * 0.6;

        page.drawText(defaultText, {
            x: textX,
            y: textY,
            size: fontSize,
            font: font,
            color: textColor,
        });

        // Add timestamp if enabled
        if (config.showTimestamp && metadata.signingTime) {
            const timestampText = metadata.signingTime.toLocaleString();
            const timestampFontSize = fontSize * 0.7;
            const timestampWidth = font.widthOfTextAtSize(timestampText, timestampFontSize);
            const timestampX = config.x + (config.width - timestampWidth) / 2;
            const timestampY = yPosition + config.height * 0.3;

            page.drawText(timestampText, {
                x: timestampX,
                y: timestampY,
                size: timestampFontSize,
                font: font,
                color: textColor,
            });
        }

        // Add border
        const borderColor = config.borderColor ? this.parseColor(config.borderColor) : rgb(0.5, 0.5, 0.5);
        page.drawRectangle({
            x: config.x,
            y: yPosition,
            width: config.width,
            height: config.height,
            borderColor: borderColor,
            borderWidth: config.borderWidth,
        });
    }

    /**
     * Add branding logo to signature
     */
    private async addBrandingLogo(
        document: PDFDocument,
        page: PDFPage,
        config: SignatureAppearanceConfig,
        yPosition: number
    ): Promise<void> {
        if (!config.logo) return;

        try {
            // Decode logo image
            const logoBuffer = Buffer.from(config.logo.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
            const logoFormat = this.detectImageFormat(config.logo);

            let logoImage: PDFImage;
            if (logoFormat === 'png') {
                logoImage = await document.embedPng(logoBuffer);
            } else {
                logoImage = await document.embedJpg(logoBuffer);
            }

            // Calculate logo position based on logoPosition setting
            const logoSize = config.logoSize || 20;
            let logoX: number, logoY: number;

            switch (config.logoPosition) {
                case 'top-left':
                    logoX = config.x + 5;
                    logoY = yPosition + config.height - logoSize - 5;
                    break;
                case 'top-right':
                    logoX = config.x + config.width - logoSize - 5;
                    logoY = yPosition + config.height - logoSize - 5;
                    break;
                case 'bottom-left':
                    logoX = config.x + 5;
                    logoY = yPosition + 5;
                    break;
                case 'bottom-right':
                    logoX = config.x + config.width - logoSize - 5;
                    logoY = yPosition + 5;
                    break;
                case 'center':
                default:
                    logoX = config.x + (config.width - logoSize) / 2;
                    logoY = yPosition + (config.height - logoSize) / 2;
                    break;
            }

            // Draw logo
            page.drawImage(logoImage, {
                x: logoX,
                y: logoY,
                width: logoSize,
                height: logoSize,
                opacity: 0.8,
            });

        } catch (error) {
            // Log error but don't fail the entire signature creation
            console.warn('Failed to add branding logo:', error);
        }
    }

    /**
     * Add metadata text to signature
     */
    private async addMetadataText(
        document: PDFDocument,
        page: PDFPage,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata,
        yPosition: number
    ): Promise<void> {
        const font = await this.getFont(document, config.font);
        const fontSize = Math.min(config.fontSize * 0.6, 8);
        const textColor = this.parseColor(config.textColor);
        const lineHeight = fontSize + 2;

        let currentY = yPosition + config.height - fontSize - 5;
        const textX = config.x + 5;

        // Add signer name
        if (config.showSignerName && metadata.signerName) {
            page.drawText(`Signed by: ${metadata.signerName}`, {
                x: textX,
                y: currentY,
                size: fontSize,
                font: font,
                color: textColor,
            });
            currentY -= lineHeight;
        }

        // Add timestamp
        if (config.showTimestamp && metadata.signingTime) {
            page.drawText(`Date: ${metadata.signingTime.toLocaleString()}`, {
                x: textX,
                y: currentY,
                size: fontSize,
                font: font,
                color: textColor,
            });
            currentY -= lineHeight;
        }

        // Add reason
        if (config.showReason && metadata.reason) {
            page.drawText(`Reason: ${metadata.reason}`, {
                x: textX,
                y: currentY,
                size: fontSize,
                font: font,
                color: textColor,
            });
            currentY -= lineHeight;
        }

        // Add location
        if (config.showLocation && metadata.location) {
            page.drawText(`Location: ${metadata.location}`, {
                x: textX,
                y: currentY,
                size: fontSize,
                font: font,
                color: textColor,
            });
        }
    }

    /**
     * Add border to signature
     */
    private addBorder(page: PDFPage, config: SignatureAppearanceConfig, yPosition: number): void {
        const borderColor = this.parseColor(config.borderColor!);

        page.drawRectangle({
            x: config.x,
            y: yPosition,
            width: config.width,
            height: config.height,
            borderColor: borderColor,
            borderWidth: config.borderWidth,
        });
    }

    /**
     * Handle multi-page signature coordination
     */
    private async handleMultiPageCoordination(
        document: PDFDocument,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<Array<{ page: number; x: number; y: number; width: number; height: number }>> {
        if (!config.pageReferences) return [];

        const results: Array<{ page: number; x: number; y: number; width: number; height: number }> = [];

        for (const pageRef of config.pageReferences) {
            const pages = document.getPages();
            if (pageRef.page >= pages.length) continue;

            const page = pages[pageRef.page];
            const { height: pageHeight } = page.getSize();

            // Create a smaller reference signature on each page
            const refConfig: SignatureAppearanceConfig = {
                ...config,
                x: pageRef.x,
                y: pageRef.y,
                width: pageRef.width,
                height: pageRef.height,
                page: pageRef.page,
                fontSize: Math.min(config.fontSize * 0.8, pageRef.height / 4),
                logoSize: Math.min(config.logoSize || 20, pageRef.width / 4),
            };

            // Create reference signature
            if (config.imageData) {
                await this.createImageBasedSignature(document, page, refConfig, metadata);
            } else {
                await this.createDefaultSignature(document, page, refConfig, metadata);
            }

            results.push({
                page: pageRef.page,
                x: pageRef.x,
                y: pageRef.y,
                width: pageRef.width,
                height: pageRef.height,
            });
        }

        return results;
    }

    /**
     * Validate signature positioning
     */
    private validatePositioning(config: SignatureAppearanceConfig, pageWidth: number, pageHeight: number): void {
        if (config.x < 0 || config.y < 0) {
            throw new PDFProcessingError('Signature position cannot be negative', 'INVALID_POSITION');
        }

        if (config.x + config.width > pageWidth) {
            throw new PDFProcessingError(
                `Signature extends beyond page width (${config.x + config.width} > ${pageWidth})`,
                'SIGNATURE_OUT_OF_BOUNDS'
            );
        }

        if (config.y + config.height > pageHeight) {
            throw new PDFProcessingError(
                `Signature extends beyond page height (${config.y + config.height} > ${pageHeight})`,
                'SIGNATURE_OUT_OF_BOUNDS'
            );
        }
    }

    /**
     * Get or load font
     */
    private async getFont(document: PDFDocument, fontName: string): Promise<PDFFont> {
        if (this.fonts.has(fontName)) {
            return this.fonts.get(fontName)!;
        }

        let font: PDFFont;
        switch (fontName) {
            case 'Times-Roman':
                font = await document.embedFont('Times-Roman');
                break;
            case 'Courier':
                font = await document.embedFont('Courier');
                break;
            case 'Helvetica':
            default:
                font = await document.embedFont('Helvetica');
                break;
        }

        this.fonts.set(fontName, font);
        return font;
    }

    /**
     * Parse color string to RGB
     */
    private parseColor(colorString: string) {
        const hex = colorString.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        return rgb(r, g, b);
    }

    /**
     * Detect image format from base64 data
     */
    private detectImageFormat(base64Data: string): 'png' | 'jpg' {
        if (base64Data.startsWith('data:image/png')) return 'png';
        if (base64Data.startsWith('data:image/jpg') || base64Data.startsWith('data:image/jpeg')) return 'jpg';

        // Default to PNG if format cannot be determined
        return 'png';
    }

    /**
     * Generate unique signature ID
     */
    private generateSignatureId(): string {
        return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clear cached fonts and images
     */
    clearCache(): void {
        this.fonts.clear();
        this.images.clear();
    }
}

/**
 * Factory function to create signature appearance engine
 */
export const createSignatureAppearanceEngine = (): SignatureAppearanceEngine => {
    return new SignatureAppearanceEngine();
};