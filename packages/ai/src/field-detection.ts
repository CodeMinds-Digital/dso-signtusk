import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import type { FieldDetectionResult, DetectedField } from './types';
import { FieldDetectionResultSchema } from './types';

/**
 * Field Detection Service using computer vision and OCR
 */
export class FieldDetectionService {
    constructor(
        private db: any,
        private storageService: any,
        private pdfService: any
    ) { }

    /**
     * Detect form fields automatically using computer vision
     */
    async detectFields(documentId: string, organizationId: string): Promise<FieldDetectionResult> {
        const startTime = Date.now();

        try {
            // Get document from storage
            const document = await this.getDocument(documentId, organizationId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Convert PDF to images for processing
            const images = await this.convertPdfToImages(document.filePath);

            const allFields: DetectedField[] = [];
            let totalConfidence = 0;

            // Process each page
            for (let pageIndex = 0; pageIndex < images.length; pageIndex++) {
                const pageFields = await this.detectFieldsOnPage(
                    images[pageIndex],
                    pageIndex + 1,
                    documentId
                );

                allFields.push(...pageFields);

                // Calculate page confidence
                const pageConfidence = pageFields.length > 0
                    ? pageFields.reduce((sum, field) => sum + field.confidence, 0) / pageFields.length
                    : 0.5;

                totalConfidence += pageConfidence;
            }

            const overallConfidence = images.length > 0 ? totalConfidence / images.length : 0;
            const processingTime = Date.now() - startTime;

            const result: FieldDetectionResult = {
                documentId,
                fields: allFields,
                confidence: overallConfidence,
                processingTime,
                metadata: {
                    algorithm: 'computer_vision_ocr_v1',
                    version: '1.0.0',
                    pageCount: images.length,
                    imageResolution: images.length > 0 ? await this.getImageDimensions(images[0]) : undefined,
                },
            };

            // Validate result
            const validatedResult = FieldDetectionResultSchema.parse(result);

            // Store result in database
            await this.storeFieldDetectionResult(validatedResult, organizationId);

            return validatedResult;

        } catch (error) {
            console.error('Field detection failed:', error);
            throw error;
        }
    }

    /**
     * Detect fields on a single page
     */
    private async detectFieldsOnPage(
        imageBuffer: Buffer,
        pageNumber: number,
        documentId: string
    ): Promise<DetectedField[]> {
        const fields: DetectedField[] = [];

        try {
            // Preprocess image for better OCR results
            const processedImage = await this.preprocessImage(imageBuffer);

            // Extract text with OCR
            const ocrResult = await this.performOCR(processedImage);

            // Detect signature fields
            const signatureFields = await this.detectSignatureFields(processedImage, ocrResult, pageNumber);
            fields.push(...signatureFields);

            // Detect date fields
            const dateFields = await this.detectDateFields(ocrResult, pageNumber);
            fields.push(...dateFields);

            // Detect text input fields
            const textFields = await this.detectTextFields(processedImage, ocrResult, pageNumber);
            fields.push(...textFields);

            // Detect checkbox fields
            const checkboxFields = await this.detectCheckboxFields(processedImage, ocrResult, pageNumber);
            fields.push(...checkboxFields);

            // Add context and semantic meaning
            for (const field of fields) {
                field.context = await this.analyzeFieldContext(field, ocrResult);
            }

            return fields;

        } catch (error) {
            console.error(`Field detection failed for page ${pageNumber}:`, error);
            return [];
        }
    }

    /**
     * Preprocess image for better analysis
     */
    private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
        return sharp(imageBuffer)
            .greyscale()
            .normalize()
            .sharpen()
            .png()
            .toBuffer();
    }

    /**
     * Perform OCR on image
     */
    private async performOCR(imageBuffer: Buffer): Promise<any> {
        const worker = await createWorker('eng');

        try {
            const { data } = await worker.recognize(imageBuffer);
            return data;
        } finally {
            await worker.terminate();
        }
    }

    /**
     * Detect signature fields using pattern recognition
     */
    private async detectSignatureFields(
        imageBuffer: Buffer,
        ocrResult: any,
        pageNumber: number
    ): Promise<DetectedField[]> {
        const fields: DetectedField[] = [];

        // Look for signature-related text patterns
        const signaturePatterns = [
            /signature/i,
            /sign here/i,
            /signed by/i,
            /signatory/i,
            /\bsign\b/i,
            /x\s*_+/i, // X followed by underscores
        ];

        if (ocrResult.words) {
            for (const word of ocrResult.words) {
                const text = word.text.toLowerCase();

                for (const pattern of signaturePatterns) {
                    if (pattern.test(text)) {
                        // Look for nearby lines or underscores that might indicate signature area
                        const signatureArea = await this.findNearbySignatureArea(word, ocrResult);

                        if (signatureArea) {
                            fields.push({
                                id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                type: 'signature',
                                label: this.extractFieldLabel(word, ocrResult),
                                coordinates: {
                                    x: signatureArea.x,
                                    y: signatureArea.y,
                                    width: signatureArea.width,
                                    height: signatureArea.height,
                                    page: pageNumber,
                                },
                                confidence: this.calculateFieldConfidence(word, 'signature'),
                                suggestedProperties: {
                                    required: true,
                                },
                            });
                        }
                        break;
                    }
                }
            }
        }

        return fields;
    }

    /**
     * Detect date fields using pattern recognition
     */
    private async detectDateFields(ocrResult: any, pageNumber: number): Promise<DetectedField[]> {
        const fields: DetectedField[] = [];

        const datePatterns = [
            /date/i,
            /\d{1,2}\/\d{1,2}\/\d{2,4}/,
            /\d{1,2}-\d{1,2}-\d{2,4}/,
            /\d{1,2}\.\d{1,2}\.\d{2,4}/,
            /__\/__\/__/,
            /_+\/_+\/_+/,
        ];

        if (ocrResult.words) {
            for (const word of ocrResult.words) {
                const text = word.text;

                for (const pattern of datePatterns) {
                    if (pattern.test(text)) {
                        fields.push({
                            id: `date_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'date',
                            label: this.extractFieldLabel(word, ocrResult),
                            coordinates: {
                                x: word.bbox.x0,
                                y: word.bbox.y0,
                                width: word.bbox.x1 - word.bbox.x0,
                                height: word.bbox.y1 - word.bbox.y0,
                                page: pageNumber,
                            },
                            confidence: this.calculateFieldConfidence(word, 'date'),
                            suggestedProperties: {
                                required: text.includes('date') || text.includes('Date'),
                                placeholder: 'MM/DD/YYYY',
                                validation: 'date',
                            },
                        });
                        break;
                    }
                }
            }
        }

        return fields;
    }

    /**
     * Detect text input fields
     */
    private async detectTextFields(
        imageBuffer: Buffer,
        ocrResult: any,
        pageNumber: number
    ): Promise<DetectedField[]> {
        const fields: DetectedField[] = [];

        // Look for underscores, lines, or boxes that might indicate text fields
        const textFieldPatterns = [
            /__{3,}/,  // Multiple underscores
            /name/i,
            /address/i,
            /phone/i,
            /email/i,
            /title/i,
            /company/i,
        ];

        if (ocrResult.words) {
            for (const word of ocrResult.words) {
                const text = word.text;

                for (const pattern of textFieldPatterns) {
                    if (pattern.test(text)) {
                        // Determine field type based on label
                        let fieldType: 'text' | 'email' | 'phone' = 'text';
                        let validation: string | undefined;

                        if (/email/i.test(text)) {
                            fieldType = 'text';
                            validation = 'email';
                        } else if (/phone/i.test(text)) {
                            fieldType = 'text';
                            validation = 'phone';
                        }

                        fields.push({
                            id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: fieldType,
                            label: this.extractFieldLabel(word, ocrResult),
                            coordinates: {
                                x: word.bbox.x0,
                                y: word.bbox.y0,
                                width: Math.max(word.bbox.x1 - word.bbox.x0, 150), // Minimum width
                                height: word.bbox.y1 - word.bbox.y0,
                                page: pageNumber,
                            },
                            confidence: this.calculateFieldConfidence(word, 'text'),
                            suggestedProperties: {
                                required: false,
                                validation,
                            },
                        });
                        break;
                    }
                }
            }
        }

        return fields;
    }

    /**
     * Detect checkbox fields
     */
    private async detectCheckboxFields(
        imageBuffer: Buffer,
        ocrResult: any,
        pageNumber: number
    ): Promise<DetectedField[]> {
        const fields: DetectedField[] = [];

        // Look for checkbox patterns
        const checkboxPatterns = [
            /\[\s*\]/,  // Empty brackets
            /\[x\]/i,   // Checked brackets
            /☐/,        // Unicode checkbox
            /☑/,        // Unicode checked
            /□/,        // Square
        ];

        if (ocrResult.words) {
            for (const word of ocrResult.words) {
                const text = word.text;

                for (const pattern of checkboxPatterns) {
                    if (pattern.test(text)) {
                        fields.push({
                            id: `checkbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'checkbox',
                            label: this.extractFieldLabel(word, ocrResult),
                            coordinates: {
                                x: word.bbox.x0,
                                y: word.bbox.y0,
                                width: Math.max(word.bbox.x1 - word.bbox.x0, 20),
                                height: Math.max(word.bbox.y1 - word.bbox.y0, 20),
                                page: pageNumber,
                            },
                            confidence: this.calculateFieldConfidence(word, 'checkbox'),
                            suggestedProperties: {
                                required: false,
                            },
                        });
                        break;
                    }
                }
            }
        }

        return fields;
    }

    /**
     * Find nearby signature area (lines, underscores, etc.)
     */
    private async findNearbySignatureArea(word: any, ocrResult: any): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null> {
        // Look for nearby underscores or lines
        const searchRadius = 100; // pixels

        if (ocrResult.words) {
            for (const nearbyWord of ocrResult.words) {
                const distance = Math.sqrt(
                    Math.pow(nearbyWord.bbox.x0 - word.bbox.x0, 2) +
                    Math.pow(nearbyWord.bbox.y0 - word.bbox.y0, 2)
                );

                if (distance <= searchRadius && /_+/.test(nearbyWord.text)) {
                    return {
                        x: nearbyWord.bbox.x0,
                        y: nearbyWord.bbox.y0,
                        width: nearbyWord.bbox.x1 - nearbyWord.bbox.x0,
                        height: nearbyWord.bbox.y1 - nearbyWord.bbox.y0,
                    };
                }
            }
        }

        // Default signature area near the word
        return {
            x: word.bbox.x1 + 10,
            y: word.bbox.y0,
            width: 150,
            height: 30,
        };
    }

    /**
     * Extract field label from surrounding text
     */
    private extractFieldLabel(word: any, ocrResult: any): string {
        // Look for text before the field that might be a label
        const searchRadius = 50;
        let bestLabel = word.text;
        let bestDistance = Infinity;

        if (ocrResult.words) {
            for (const nearbyWord of ocrResult.words) {
                const distance = Math.sqrt(
                    Math.pow(nearbyWord.bbox.x0 - word.bbox.x0, 2) +
                    Math.pow(nearbyWord.bbox.y0 - word.bbox.y0, 2)
                );

                if (distance <= searchRadius && distance < bestDistance &&
                    nearbyWord.text.length > 2 && !/^_+$/.test(nearbyWord.text)) {
                    bestLabel = nearbyWord.text;
                    bestDistance = distance;
                }
            }
        }

        return bestLabel.replace(/[_\-:]/g, '').trim();
    }

    /**
     * Calculate confidence score for detected field
     */
    private calculateFieldConfidence(word: any, fieldType: string): number {
        let confidence = 0.5; // Base confidence

        // Adjust based on OCR confidence
        if (word.confidence) {
            confidence = Math.max(confidence, word.confidence / 100);
        }

        // Adjust based on field type patterns
        const text = word.text.toLowerCase();

        switch (fieldType) {
            case 'signature':
                if (/signature|sign/.test(text)) confidence += 0.3;
                if (/x\s*_+/.test(text)) confidence += 0.2;
                break;
            case 'date':
                if (/date/.test(text)) confidence += 0.3;
                if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) confidence += 0.4;
                break;
            case 'text':
                if (/name|address|phone|email/.test(text)) confidence += 0.2;
                if (/_+/.test(text)) confidence += 0.1;
                break;
            case 'checkbox':
                if (/\[\s*\]/.test(text)) confidence += 0.4;
                break;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Analyze field context and semantic meaning
     */
    private async analyzeFieldContext(field: DetectedField, ocrResult: any): Promise<{
        surroundingText: string;
        semanticMeaning: string;
    }> {
        // Extract surrounding text
        const surroundingWords: string[] = [];
        const searchRadius = 100;

        if (ocrResult.words) {
            for (const word of ocrResult.words) {
                const distance = Math.sqrt(
                    Math.pow(word.bbox.x0 - field.coordinates.x, 2) +
                    Math.pow(word.bbox.y0 - field.coordinates.y, 2)
                );

                if (distance <= searchRadius) {
                    surroundingWords.push(word.text);
                }
            }
        }

        const surroundingText = surroundingWords.join(' ');

        // Determine semantic meaning
        let semanticMeaning = 'Unknown';
        const text = surroundingText.toLowerCase();

        if (field.type === 'signature') {
            if (/client|customer|buyer/.test(text)) {
                semanticMeaning = 'Client Signature';
            } else if (/witness/.test(text)) {
                semanticMeaning = 'Witness Signature';
            } else if (/notary/.test(text)) {
                semanticMeaning = 'Notary Signature';
            } else {
                semanticMeaning = 'General Signature';
            }
        } else if (field.type === 'date') {
            if (/effective|start/.test(text)) {
                semanticMeaning = 'Effective Date';
            } else if (/expir|end/.test(text)) {
                semanticMeaning = 'Expiration Date';
            } else if (/sign/.test(text)) {
                semanticMeaning = 'Signature Date';
            } else {
                semanticMeaning = 'General Date';
            }
        } else if (field.type === 'text') {
            if (/name/.test(text)) {
                semanticMeaning = 'Name Field';
            } else if (/address/.test(text)) {
                semanticMeaning = 'Address Field';
            } else if (/phone/.test(text)) {
                semanticMeaning = 'Phone Field';
            } else if (/email/.test(text)) {
                semanticMeaning = 'Email Field';
            } else {
                semanticMeaning = 'Text Input';
            }
        }

        return {
            surroundingText: surroundingText.substring(0, 200), // Limit length
            semanticMeaning,
        };
    }

    // Helper methods

    private async getDocument(documentId: string, organizationId: string): Promise<any> {
        return this.db.document.findFirst({
            where: {
                id: documentId,
                organizationId,
            },
        });
    }

    private async convertPdfToImages(filePath: string): Promise<Buffer[]> {
        // This would use the PDF service to convert PDF pages to images
        // For now, return a mock implementation
        return [Buffer.from('mock-image-data')];
    }

    private async getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
        const metadata = await sharp(imageBuffer).metadata();
        return {
            width: metadata.width || 0,
            height: metadata.height || 0,
        };
    }

    private async storeFieldDetectionResult(result: FieldDetectionResult, organizationId: string): Promise<void> {
        await this.db.aiAnalysisResult.create({
            data: {
                id: `field_detection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                documentId: result.documentId,
                organizationId,
                analysisType: 'field_detection',
                status: 'completed',
                result: JSON.stringify(result),
                confidence: result.confidence,
                processingTime: result.processingTime,
                createdAt: new Date(),
                completedAt: new Date(),
            },
        });
    }
}