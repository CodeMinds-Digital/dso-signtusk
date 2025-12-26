import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { PDFProcessingError, PDF_ERROR_CODES, type PDFGenerationOptions } from '../types/index.js';

/**
 * Base class for PDF generators providing common functionality
 * This is an independent implementation using pdf-lib for server-side PDF generation
 */
export abstract class BasePDFGenerator {
    protected document: PDFDocument | null = null;
    protected fonts: Map<string, PDFFont> = new Map();
    protected options: PDFGenerationOptions;

    constructor(options: PDFGenerationOptions) {
        this.options = options;
    }

    /**
     * Initialize a new PDF document
     */
    protected async initializeDocument(): Promise<PDFDocument> {
        try {
            this.document = await PDFDocument.create();
            return this.document;
        } catch (error) {
            throw new PDFProcessingError(
                'Failed to initialize PDF document',
                PDF_ERROR_CODES.GENERATION_FAILED,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Load and cache fonts for the document
     */
    protected async loadFonts(document: PDFDocument): Promise<void> {
        try {
            // Load standard fonts - these are built into pdf-lib
            const helvetica = await document.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await document.embedFont(StandardFonts.HelveticaBold);
            const helveticaOblique = await document.embedFont(StandardFonts.HelveticaOblique);

            this.fonts.set('regular', helvetica);
            this.fonts.set('bold', helveticaBold);
            this.fonts.set('italic', helveticaOblique);
        } catch (error) {
            throw new PDFProcessingError(
                'Failed to load fonts',
                PDF_ERROR_CODES.FONT_LOADING_FAILED,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Get font by type with fallback
     */
    protected getFont(type: 'regular' | 'bold' | 'italic' = 'regular'): PDFFont {
        const font = this.fonts.get(type) || this.fonts.get('regular');
        if (!font) {
            throw new PDFProcessingError(
                'Font not loaded',
                PDF_ERROR_CODES.FONT_LOADING_FAILED,
                { fontType: type }
            );
        }
        return font;
    }

    /**
     * Add a new page to the document
     */
    protected addPage(document: PDFDocument): PDFPage {
        const pageSize = this.options.format === 'A4' ? [595.28, 841.89] : [612, 792];
        return document.addPage(pageSize as [number, number]);
    }

    /**
     * Draw text with proper positioning and styling
     */
    protected drawText(
        page: PDFPage,
        text: string,
        x: number,
        y: number,
        options: {
            size?: number;
            font?: PDFFont;
            color?: { r: number; g: number; b: number };
            maxWidth?: number;
        } = {}
    ): void {
        const {
            size = 12,
            font = this.getFont('regular'),
            color = { r: 0, g: 0, b: 0 },
            maxWidth
        } = options;

        let displayText = text;

        // Handle text wrapping if maxWidth is specified
        if (maxWidth) {
            const textWidth = font.widthOfTextAtSize(text, size);
            if (textWidth > maxWidth) {
                // Simple text truncation - in a real implementation, you'd want proper word wrapping
                const ratio = maxWidth / textWidth;
                const maxChars = Math.floor(text.length * ratio * 0.9); // 90% to be safe
                displayText = text.substring(0, maxChars) + '...';
            }
        }

        page.drawText(displayText, {
            x,
            y,
            size,
            font,
            color: rgb(color.r, color.g, color.b),
        });
    }

    /**
     * Draw a rectangle (useful for borders, backgrounds)
     */
    protected drawRectangle(
        page: PDFPage,
        x: number,
        y: number,
        width: number,
        height: number,
        options: {
            borderColor?: { r: number; g: number; b: number };
            fillColor?: { r: number; g: number; b: number };
            borderWidth?: number;
        } = {}
    ): void {
        const {
            borderColor = { r: 0, g: 0, b: 0 },
            fillColor,
            borderWidth = 1
        } = options;

        if (fillColor) {
            page.drawRectangle({
                x,
                y,
                width,
                height,
                color: rgb(fillColor.r, fillColor.g, fillColor.b),
            });
        }

        if (borderWidth > 0) {
            page.drawRectangle({
                x,
                y,
                width,
                height,
                borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
                borderWidth,
            });
        }
    }

    /**
     * Abstract method that subclasses must implement
     */
    abstract generate(): Promise<Buffer>;

    /**
     * Finalize and return the PDF as a buffer
     */
    protected async finalizePDF(): Promise<Buffer> {
        if (!this.document) {
            throw new PDFProcessingError(
                'Document not initialized',
                PDF_ERROR_CODES.GENERATION_FAILED
            );
        }

        try {
            const pdfBytes = await this.document.save();
            return Buffer.from(pdfBytes);
        } catch (error) {
            throw new PDFProcessingError(
                'Failed to finalize PDF',
                PDF_ERROR_CODES.GENERATION_FAILED,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }
}