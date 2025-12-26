import * as QRCode from 'qrcode';
import { DateTime } from 'luxon';
import { BasePDFGenerator } from './base-generator.js';
import {
    PDFProcessingError,
    PDF_ERROR_CODES,
    type CertificateData,
    type PDFGenerationOptions
} from '../types/index.js';

/**
 * Certificate generator using pdf-lib for server-side PDF generation
 * This is an independent implementation that creates professional certificate PDFs
 */
export class CertificateGenerator extends BasePDFGenerator {
    private certificateData: CertificateData;

    constructor(certificateData: CertificateData, options: PDFGenerationOptions) {
        super(options);
        this.certificateData = certificateData;
    }

    /**
     * Generate a certificate PDF
     */
    async generate(): Promise<Buffer> {
        try {
            const document = await this.initializeDocument();
            await this.loadFonts(document);

            const page = this.addPage(document);
            const { width, height } = page.getSize();

            // Draw certificate content
            await this.drawCertificateHeader(page, width, height);
            await this.drawCertificateBody(page, width, height);
            await this.drawCertificateFooter(page, width, height);
            await this.drawQRCode(page, width, height);

            return await this.finalizePDF();
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }
            throw new PDFProcessingError(
                'Failed to generate certificate PDF',
                PDF_ERROR_CODES.GENERATION_FAILED,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Draw the certificate header with title and decorative elements
     */
    private async drawCertificateHeader(page: any, width: number, height: number): Promise<void> {
        const centerX = width / 2;
        const topY = height - 80;

        // Draw decorative border
        this.drawRectangle(page, 40, 40, width - 80, height - 80, {
            borderColor: { r: 0.2, g: 0.4, b: 0.8 },
            borderWidth: 3,
        });

        // Inner decorative border
        this.drawRectangle(page, 50, 50, width - 100, height - 100, {
            borderColor: { r: 0.8, g: 0.8, b: 0.8 },
            borderWidth: 1,
        });

        // Certificate title
        this.drawText(page, 'CERTIFICATE OF COMPLETION', centerX - 150, topY, {
            size: 24,
            font: this.getFont('bold'),
            color: { r: 0.2, g: 0.4, b: 0.8 },
        });

        // Subtitle
        this.drawText(page, 'Document Signing Certificate', centerX - 100, topY - 40, {
            size: 16,
            font: this.getFont('regular'),
            color: { r: 0.4, g: 0.4, b: 0.4 },
        });
    }

    /**
     * Draw the main certificate content
     */
    private async drawCertificateBody(page: any, width: number, height: number): Promise<void> {
        const centerX = width / 2;
        const bodyStartY = height - 200;

        // Document information
        this.drawText(page, 'This certifies that the document:', 80, bodyStartY, {
            size: 14,
            font: this.getFont('regular'),
        });

        this.drawText(page, this.certificateData.documentTitle, 80, bodyStartY - 30, {
            size: 16,
            font: this.getFont('bold'),
            maxWidth: width - 160,
        });

        // Signer information
        this.drawText(page, 'Has been digitally signed by:', 80, bodyStartY - 80, {
            size: 14,
            font: this.getFont('regular'),
        });

        this.drawText(page, this.certificateData.signerName, 80, bodyStartY - 110, {
            size: 16,
            font: this.getFont('bold'),
        });

        this.drawText(page, this.certificateData.signerEmail, 80, bodyStartY - 135, {
            size: 12,
            font: this.getFont('regular'),
            color: { r: 0.4, g: 0.4, b: 0.4 },
        });

        // Signing date and time
        const signedAtFormatted = DateTime.fromJSDate(this.certificateData.signedAt)
            .setLocale(this.certificateData.language || 'en')
            .toFormat('MMMM dd, yyyy \'at\' HH:mm:ss ZZZZ');

        this.drawText(page, 'Signed on:', 80, bodyStartY - 180, {
            size: 14,
            font: this.getFont('regular'),
        });

        this.drawText(page, signedAtFormatted, 80, bodyStartY - 205, {
            size: 12,
            font: this.getFont('regular'),
        });

        // Certificate ID
        this.drawText(page, 'Certificate ID:', 80, bodyStartY - 250, {
            size: 12,
            font: this.getFont('regular'),
        });

        this.drawText(page, this.certificateData.certificateId, 80, bodyStartY - 270, {
            size: 10,
            font: this.getFont('regular'),
            color: { r: 0.4, g: 0.4, b: 0.4 },
        });
    }

    /**
     * Draw the certificate footer with verification information
     */
    private async drawCertificateFooter(page: any, width: number, height: number): Promise<void> {
        const footerY = 120;

        // Verification text
        this.drawText(page, 'Verification:', 80, footerY, {
            size: 12,
            font: this.getFont('bold'),
        });

        this.drawText(page, 'This certificate can be verified by scanning the QR code', 80, footerY - 20, {
            size: 10,
            font: this.getFont('regular'),
        });

        this.drawText(page, 'or visiting the verification URL below:', 80, footerY - 35, {
            size: 10,
            font: this.getFont('regular'),
        });

        this.drawText(page, this.certificateData.verificationUrl, 80, footerY - 55, {
            size: 9,
            font: this.getFont('regular'),
            color: { r: 0.2, g: 0.4, b: 0.8 },
            maxWidth: width - 200,
        });
    }

    /**
     * Generate and embed QR code for verification
     */
    private async drawQRCode(page: any, width: number, height: number): Promise<void> {
        try {
            // Generate QR code as data URL
            const qrCodeDataUrl = await QRCode.toDataURL(this.certificateData.verificationUrl, {
                width: 120,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });

            // Convert data URL to buffer
            const base64Data = qrCodeDataUrl.split(',')[1];
            const qrCodeBuffer = Buffer.from(base64Data, 'base64');

            // Embed QR code image
            const qrCodeImage = await this.document!.embedPng(qrCodeBuffer);
            const qrCodeSize = 100;

            // Position QR code in bottom right
            page.drawImage(qrCodeImage, {
                x: width - qrCodeSize - 80,
                y: 80,
                width: qrCodeSize,
                height: qrCodeSize,
            });

        } catch (error) {
            throw new PDFProcessingError(
                'Failed to generate QR code',
                PDF_ERROR_CODES.QR_CODE_GENERATION_FAILED,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }
}