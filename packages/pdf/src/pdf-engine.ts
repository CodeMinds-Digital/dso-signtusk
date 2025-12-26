import {
    PDFDocument,
    PDFPage,
    PDFField,
    PDFForm,
    PDFTextField,
    PDFCheckBox,
    PDFDropdown,
    PDFRadioGroup,
    rgb,
    StandardFonts,
    PageSizes,
    degrees,
} from 'pdf-lib';
import type {
    PDFProcessingEngine,
    FieldDefinition,
    PageRange,
    OptimizationOptions,
    WatermarkOptions,
    ValidationResult,
    PDFMetadata,
    TextExtractionResult,
    ProcessingResult,
    ProcessingOptions,
    SignatureAppearanceConfig,
    SignatureAppearanceMetadata,
    SignatureAppearanceResult,
} from './types';
import {
    PDFProcessingError,
    PDFValidationError,
    PDFCorruptionError,
    FieldDefinitionSchema,
} from './types';
import { SignatureAppearanceEngine } from './signature-appearance-engine';

export class PDFEngine implements PDFProcessingEngine {
    private readonly signatureAppearanceEngine: SignatureAppearanceEngine;
    private readonly defaultOptions: ProcessingOptions = {
        timeout: 30000, // 30 seconds
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowEncrypted: false,
        preserveMetadata: true,
    };

    constructor(private options: ProcessingOptions = {}) {
        this.options = { ...this.defaultOptions, ...options };
        this.signatureAppearanceEngine = new SignatureAppearanceEngine();
    }

    /**
     * Load a PDF document from buffer
     */
    async loadPDF(buffer: Buffer): Promise<PDFDocument> {
        const startTime = Date.now();

        try {
            // Validate file size
            if (this.options.maxFileSize && buffer.length > this.options.maxFileSize) {
                throw new PDFValidationError(
                    `File size ${buffer.length} exceeds maximum allowed size ${this.options.maxFileSize}`
                );
            }

            // Load the PDF document
            const pdfDoc = await PDFDocument.load(buffer, {
                ignoreEncryption: this.options.allowEncrypted,
                parseSpeed: 1, // Fastest parsing
                throwOnInvalidObject: false,
            });

            // Check processing timeout
            if (this.options.timeout && Date.now() - startTime > this.options.timeout) {
                throw new PDFProcessingError('PDF loading timeout exceeded', 'TIMEOUT_ERROR');
            }

            return pdfDoc;
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.message.includes('encrypted')) {
                    throw new PDFValidationError('PDF is encrypted and encryption is not allowed', error);
                }
                if (error.message.includes('Invalid PDF')) {
                    throw new PDFCorruptionError('PDF file is corrupted or invalid', error);
                }
            }

            throw new PDFProcessingError(
                `Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LOAD_ERROR',
                error
            );
        }
    }

    /**
     * Create a form field in the PDF document with precise placement and validation
     */
    async createField(document: PDFDocument, field: FieldDefinition): Promise<PDFField> {
        try {
            // Validate field definition using Zod schema
            const validatedField = FieldDefinitionSchema.parse(field);

            const form = document.getForm();
            const pages = document.getPages();

            if (validatedField.page >= pages.length) {
                throw new PDFValidationError(`Page ${validatedField.page} does not exist in document (document has ${pages.length} pages)`);
            }

            const page = pages[validatedField.page];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Validate field position with precise boundary checking
            if (validatedField.x < 0 || validatedField.y < 0) {
                throw new PDFValidationError('Field position cannot be negative');
            }

            if (validatedField.x + validatedField.width > pageWidth) {
                throw new PDFValidationError(`Field extends beyond page width (${validatedField.x + validatedField.width} > ${pageWidth})`);
            }

            if (validatedField.y + validatedField.height > pageHeight) {
                throw new PDFValidationError(`Field extends beyond page height (${validatedField.y + validatedField.height} > ${pageHeight})`);
            }

            // Check for field name conflicts
            const existingFields = form.getFields();
            if (existingFields.some(f => f.getName() === validatedField.name)) {
                throw new PDFValidationError(`Field with name '${validatedField.name}' already exists`);
            }

            let pdfField: PDFField;

            switch (validatedField.type) {
                case 'text':
                    pdfField = await this.createTextField(form, page, validatedField, pageHeight);
                    break;

                case 'checkbox':
                    pdfField = await this.createCheckboxField(form, page, validatedField, pageHeight);
                    break;

                case 'dropdown':
                    pdfField = await this.createDropdownField(form, page, validatedField, pageHeight);
                    break;

                case 'list':
                    pdfField = await this.createListField(form, page, validatedField, pageHeight);
                    break;

                case 'radio':
                    pdfField = await this.createRadioField(form, page, validatedField, pageHeight);
                    break;

                case 'signature':
                    pdfField = await this.createSignatureField(form, page, validatedField, pageHeight);
                    break;

                case 'date':
                    pdfField = await this.createDateField(form, page, validatedField, pageHeight);
                    break;

                default:
                    throw new PDFValidationError(`Unsupported field type: ${validatedField.type}`);
            }

            // Apply common field properties
            await this.applyCommonFieldProperties(pdfField, validatedField);

            return pdfField;
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to create field: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'FIELD_CREATION_ERROR',
                error
            );
        }
    }

    /**
     * Create a text field with validation and formatting
     */
    private async createTextField(form: PDFForm, page: PDFPage, field: FieldDefinition, pageHeight: number): Promise<PDFTextField> {
        const textField = form.createTextField(field.name);

        // Set initial value
        if (field.value) {
            textField.setText(field.value);
        }

        // Set multiline if specified
        if (field.multiline) {
            textField.enableMultiline();
        }

        // Set max length if specified
        if (field.maxLength) {
            textField.setMaxLength(field.maxLength);
        }

        // Add field to page with precise positioning
        textField.addToPage(page, {
            x: field.x,
            y: pageHeight - field.y - field.height, // Convert to PDF coordinate system
            width: field.width,
            height: field.height,
        });

        return textField;
    }

    /**
     * Create a checkbox field with proper state handling
     */
    private async createCheckboxField(form: PDFForm, page: PDFPage, field: FieldDefinition, pageHeight: number): Promise<PDFCheckBox> {
        const checkbox = form.createCheckBox(field.name);

        // Set initial state
        if (field.value === 'true' || field.value === '1' || field.value === 'checked') {
            checkbox.check();
        } else {
            checkbox.uncheck();
        }

        // Add field to page with precise positioning
        checkbox.addToPage(page, {
            x: field.x,
            y: pageHeight - field.y - field.height,
            width: field.width,
            height: field.height,
        });

        return checkbox;
    }

    /**
     * Create a dropdown field with options validation
     */
    private async createDropdownField(form: PDFForm, page: PDFPage, field: FieldDefinition, pageHeight: number): Promise<PDFDropdown> {
        if (!field.options || field.options.length === 0) {
            throw new PDFValidationError('Dropdown field requires at least one option');
        }

        // Validate options are unique
        const uniqueOptions = [...new Set(field.options)];
        if (uniqueOptions.length !== field.options.length) {
            throw new PDFValidationError('Dropdown options must be unique');
        }

        const dropdown = form.createDropdown(field.name);
        dropdown.setOptions(field.options);

        // Set initial selection
        if (field.value && field.options.includes(field.value)) {
            dropdown.select(field.value);
        }

        // Add field to page with precise positioning
        dropdown.addToPage(page, {
            x: field.x,
            y: pageHeight - field.y - field.height,
            width: field.width,
            height: field.height,
        });

        return dropdown;
    }

    /**
     * Create a list field (similar to dropdown but allows multiple selections)
     */
    private async createListField(form: PDFForm, page: PDFPage, field: FieldDefinition, pageHeight: number): Promise<PDFDropdown> {
        if (!field.options || field.options.length === 0) {
            throw new PDFValidationError('List field requires at least one option');
        }

        // Note: pdf-lib doesn't have a dedicated list field, so we use dropdown
        // In a real implementation, you might need to create a custom widget
        const listField = form.createDropdown(field.name);
        listField.setOptions(field.options);

        // Set initial selection
        if (field.value && field.options.includes(field.value)) {
            listField.select(field.value);
        }

        // Add field to page with precise positioning
        listField.addToPage(page, {
            x: field.x,
            y: pageHeight - field.y - field.height,
            width: field.width,
            height: field.height,
        });

        return listField;
    }

    /**
     * Create a radio button group with proper grouping
     */
    private async createRadioField(form: PDFForm, page: PDFPage, field: FieldDefinition, pageHeight: number): Promise<PDFRadioGroup> {
        if (!field.options || field.options.length === 0) {
            throw new PDFValidationError('Radio field requires at least one option');
        }

        const radioGroup = form.createRadioGroup(field.radioGroup || field.name);

        // Calculate spacing for radio buttons
        const buttonHeight = 20; // Standard radio button height
        const buttonSpacing = 5; // 5 points spacing between buttons
        const totalHeight = field.options.length * buttonHeight + (field.options.length - 1) * buttonSpacing;

        // Validate that all radio buttons fit within the specified area
        if (totalHeight > field.height) {
            throw new PDFValidationError(`Radio buttons require ${totalHeight} points height, but only ${field.height} provided`);
        }

        // Add each radio button option
        field.options.forEach((option, index) => {
            const buttonY = pageHeight - field.y - (index * (buttonHeight + buttonSpacing)) - buttonHeight;

            radioGroup.addOptionToPage(option, page, {
                x: field.x,
                y: buttonY,
                width: Math.min(field.width, 20), // Standard radio button size
                height: buttonHeight,
            });
        });

        // Set initial selection
        if (field.value && field.options.includes(field.value)) {
            radioGroup.select(field.value);
        }

        return radioGroup;
    }

    /**
     * Create a signature field with proper signature handling
     */
    private async createSignatureField(form: PDFForm, page: PDFPage, field: FieldDefinition, pageHeight: number): Promise<PDFTextField> {
        // Create a text field that will serve as a signature placeholder
        // In a real implementation, this would be a proper signature widget
        const signatureField = form.createTextField(field.name);

        // Set placeholder text for signature
        signatureField.setText(field.placeholder || 'Click to sign');

        // Mark as readonly initially (will be enabled during signing process)
        signatureField.enableReadOnly();

        // Add field to page with precise positioning
        signatureField.addToPage(page, {
            x: field.x,
            y: pageHeight - field.y - field.height,
            width: field.width,
            height: field.height,
        });

        return signatureField;
    }

    /**
     * Create a date field with validation
     */
    private async createDateField(form: PDFForm, page: PDFPage, field: FieldDefinition, pageHeight: number): Promise<PDFTextField> {
        const dateField = form.createTextField(field.name);

        // Set initial date value if provided
        if (field.value) {
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(field.value)) {
                throw new PDFValidationError('Date field value must be in YYYY-MM-DD format');
            }
            dateField.setText(field.value);
        }

        // Add field to page with precise positioning
        dateField.addToPage(page, {
            x: field.x,
            y: pageHeight - field.y - field.height,
            width: field.width,
            height: field.height,
        });

        return dateField;
    }

    /**
     * Apply common properties to all field types
     */
    private async applyCommonFieldProperties(pdfField: PDFField, field: FieldDefinition): Promise<void> {
        try {
            // Set readonly status
            if (field.readonly) {
                pdfField.enableReadOnly();
            }

            // Note: pdf-lib doesn't have a markAsRequired method
            // Required status is tracked in our field definition but not enforced by pdf-lib
            // This would need to be handled at the application level during validation

            // Note: Font size, colors, and borders require more complex implementation
            // with pdf-lib's appearance streams, which is beyond basic field creation
            // These would typically be handled in a more advanced PDF library or custom implementation

        } catch (error) {
            // Some field types may not support all properties
            // Log warning but don't fail field creation
            console.warn(`Could not apply some properties to field ${field.name}:`, error);
        }
    }

    /**
     * Merge multiple PDF documents into one
     */
    async mergePDFs(documents: PDFDocument[]): Promise<PDFDocument> {
        try {
            if (documents.length === 0) {
                throw new PDFValidationError('No documents provided for merging');
            }

            if (documents.length === 1) {
                return documents[0];
            }

            const mergedPdf = await PDFDocument.create();

            for (const doc of documents) {
                const pageIndices = doc.getPageIndices();
                const copiedPages = await mergedPdf.copyPages(doc, pageIndices);
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            return mergedPdf;
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'MERGE_ERROR',
                error
            );
        }
    }

    /**
     * Split PDF document into multiple documents based on page ranges
     */
    async splitPDF(document: PDFDocument, pageRanges: PageRange[]): Promise<PDFDocument[]> {
        try {
            if (pageRanges.length === 0) {
                throw new PDFValidationError('No page ranges provided for splitting');
            }

            const totalPages = document.getPageCount();
            const splitDocuments: PDFDocument[] = [];

            for (const range of pageRanges) {
                if (range.start < 1 || range.end > totalPages || range.start > range.end) {
                    throw new PDFValidationError(
                        `Invalid page range: ${range.start}-${range.end} (document has ${totalPages} pages)`
                    );
                }

                const newDoc = await PDFDocument.create();
                const pageIndices = Array.from(
                    { length: range.end - range.start + 1 },
                    (_, i) => range.start - 1 + i
                );

                const copiedPages = await newDoc.copyPages(document, pageIndices);
                copiedPages.forEach((page) => newDoc.addPage(page));

                splitDocuments.push(newDoc);
            }

            return splitDocuments;
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SPLIT_ERROR',
                error
            );
        }
    }

    /**
     * Extract specific pages from a PDF document
     */
    async extractPages(document: PDFDocument, pageNumbers: number[]): Promise<PDFDocument> {
        try {
            if (pageNumbers.length === 0) {
                throw new PDFValidationError('No page numbers provided for extraction');
            }

            const totalPages = document.getPageCount();
            const validPageNumbers = pageNumbers.filter(num => num >= 1 && num <= totalPages);

            if (validPageNumbers.length === 0) {
                throw new PDFValidationError('No valid page numbers provided');
            }

            const newDoc = await PDFDocument.create();
            const pageIndices = validPageNumbers.map(num => num - 1);

            const copiedPages = await newDoc.copyPages(document, pageIndices);
            copiedPages.forEach((page) => newDoc.addPage(page));

            return newDoc;
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to extract pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'EXTRACT_ERROR',
                error
            );
        }
    }

    /**
     * Optimize PDF document using the comprehensive optimization engine
     */
    async optimizePDF(document: PDFDocument, options: OptimizationOptions): Promise<PDFDocument> {
        try {
            // Use the comprehensive PDF optimization engine
            const { PDFOptimizationEngine } = await import('./pdf-optimization-engine');
            const optimizationEngine = new PDFOptimizationEngine(options);

            const { document: optimizedDoc } = await optimizationEngine.optimizePDF(document, options);
            return optimizedDoc;
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to optimize PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'OPTIMIZATION_ERROR',
                error
            );
        }
    }

    /**
     * Extract text from PDF document
     */
    async extractText(document: PDFDocument): Promise<string> {
        try {
            // Note: pdf-lib doesn't have built-in text extraction
            // This is a placeholder implementation
            // In a real implementation, you'd use a library like pdf-parse or pdf2pic

            const pages = document.getPages();
            const pageTexts: string[] = [];

            for (const page of pages) {
                // This is a simplified implementation
                // Real text extraction would require additional libraries
                pageTexts.push(`[Page ${pageTexts.length + 1} - Text extraction not fully implemented]`);
            }

            return pageTexts.join('\n\n');
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'TEXT_EXTRACTION_ERROR',
                error
            );
        }
    }

    /**
     * Generate thumbnail for a specific page
     */
    async generateThumbnail(document: PDFDocument, page: number): Promise<Buffer> {
        try {
            const pages = document.getPages();

            if (page < 0 || page >= pages.length) {
                throw new PDFValidationError(`Page ${page} does not exist in document`);
            }

            // Note: pdf-lib doesn't have built-in thumbnail generation
            // This is a placeholder implementation
            // In a real implementation, you'd use a library like pdf2pic or pdf-poppler

            throw new PDFProcessingError(
                'Thumbnail generation not implemented - requires additional libraries',
                'NOT_IMPLEMENTED'
            );
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'THUMBNAIL_ERROR',
                error
            );
        }
    }

    /**
     * Add watermark to PDF document
     */
    async addWatermark(document: PDFDocument, watermark: WatermarkOptions): Promise<PDFDocument> {
        try {
            const pages = document.getPages();
            const font = await document.embedFont(StandardFonts.Helvetica);

            for (const page of pages) {
                const { width, height } = page.getSize();

                let x: number, y: number;

                switch (watermark.position) {
                    case 'center':
                        x = width / 2;
                        y = height / 2;
                        break;
                    case 'top-left':
                        x = 50;
                        y = height - 50;
                        break;
                    case 'top-right':
                        x = width - 50;
                        y = height - 50;
                        break;
                    case 'bottom-left':
                        x = 50;
                        y = 50;
                        break;
                    case 'bottom-right':
                        x = width - 50;
                        y = 50;
                        break;
                    default:
                        x = width / 2;
                        y = height / 2;
                }

                // Parse color (assuming hex format)
                const colorMatch = watermark.color.match(/^#([0-9A-F]{6})$/i);
                const color = colorMatch
                    ? rgb(
                        parseInt(colorMatch[1].substr(0, 2), 16) / 255,
                        parseInt(colorMatch[1].substr(2, 2), 16) / 255,
                        parseInt(colorMatch[1].substr(4, 2), 16) / 255
                    )
                    : rgb(0.8, 0.8, 0.8);

                page.drawText(watermark.text, {
                    x,
                    y,
                    size: watermark.fontSize,
                    font,
                    color,
                    opacity: watermark.opacity,
                    rotate: degrees(watermark.rotation),
                });
            }

            return document;
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to add watermark: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'WATERMARK_ERROR',
                error
            );
        }
    }

    /**
     * Validate PDF document
     */
    async validatePDF(buffer: Buffer): Promise<ValidationResult> {
        try {
            const result: ValidationResult = {
                isValid: false,
                errors: [],
                warnings: [],
                pageCount: 0,
                hasFormFields: false,
                hasSignatures: false,
                isEncrypted: false,
                version: '',
                fileSize: buffer.length,
            };

            try {
                const document = await this.loadPDF(buffer);

                result.isValid = true;
                result.pageCount = document.getPageCount();

                // Check for form fields
                try {
                    const form = document.getForm();
                    const fields = form.getFields();
                    result.hasFormFields = fields.length > 0;
                } catch {
                    result.hasFormFields = false;
                }

                // Basic version detection (simplified)
                result.version = '1.4'; // Default assumption

            } catch (error) {
                result.isValid = false;

                if (error instanceof PDFValidationError) {
                    result.errors.push(error.message);
                    if (error.message.includes('encrypted')) {
                        result.isEncrypted = true;
                    }
                } else if (error instanceof PDFCorruptionError) {
                    result.errors.push(error.message);
                } else {
                    result.errors.push('Unknown validation error');
                }
            }

            return result;
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to validate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'VALIDATION_ERROR',
                error
            );
        }
    }

    /**
     * Get PDF metadata
     */
    async getMetadata(document: PDFDocument): Promise<PDFMetadata> {
        try {
            return {
                title: document.getTitle(),
                author: document.getAuthor(),
                subject: document.getSubject(),
                keywords: document.getKeywords()?.split(',').map(k => k.trim()),
                creator: document.getCreator(),
                producer: document.getProducer(),
                creationDate: document.getCreationDate(),
                modificationDate: document.getModificationDate(),
                pageCount: document.getPageCount(),
                fileSize: 0, // Would need to be calculated from serialized document
                version: '1.4', // Default assumption
            };
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'METADATA_ERROR',
                error
            );
        }
    }

    /**
     * Get all form fields from a PDF document
     */
    async getFormFields(document: PDFDocument): Promise<PDFField[]> {
        try {
            const form = document.getForm();
            return form.getFields();
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to get form fields: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'FIELD_RETRIEVAL_ERROR',
                error
            );
        }
    }

    /**
     * Get a specific form field by name
     */
    async getFormField(document: PDFDocument, fieldName: string): Promise<PDFField | null> {
        try {
            const form = document.getForm();
            const fields = form.getFields();
            return fields.find(field => field.getName() === fieldName) || null;
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to get form field '${fieldName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
                'FIELD_RETRIEVAL_ERROR',
                error
            );
        }
    }

    /**
     * Remove a form field from the PDF document
     */
    async removeFormField(document: PDFDocument, fieldName: string): Promise<boolean> {
        try {
            const form = document.getForm();
            const field = await this.getFormField(document, fieldName);

            if (!field) {
                return false;
            }

            // Note: pdf-lib doesn't have a direct removeField method
            // This would require more complex implementation
            throw new PDFProcessingError(
                'Field removal not implemented - requires advanced PDF manipulation',
                'NOT_IMPLEMENTED'
            );
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to remove form field '${fieldName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
                'FIELD_REMOVAL_ERROR',
                error
            );
        }
    }

    /**
     * Update field value
     */
    async updateFieldValue(document: PDFDocument, fieldName: string, value: string): Promise<void> {
        try {
            const field = await this.getFormField(document, fieldName);

            if (!field) {
                throw new PDFValidationError(`Field '${fieldName}' not found`);
            }

            // Update field value based on field type
            if (field instanceof PDFTextField) {
                field.setText(value);
            } else if (field instanceof PDFCheckBox) {
                if (value === 'true' || value === '1' || value === 'checked') {
                    field.check();
                } else {
                    field.uncheck();
                }
            } else if (field instanceof PDFDropdown) {
                const options = field.getOptions();
                if (options.includes(value)) {
                    field.select(value);
                } else {
                    throw new PDFValidationError(`Value '${value}' is not a valid option for dropdown field '${fieldName}'`);
                }
            } else if (field instanceof PDFRadioGroup) {
                const options = field.getOptions();
                if (options.includes(value)) {
                    field.select(value);
                } else {
                    throw new PDFValidationError(`Value '${value}' is not a valid option for radio field '${fieldName}'`);
                }
            } else {
                throw new PDFValidationError(`Unsupported field type for field '${fieldName}'`);
            }
        } catch (error) {
            if (error instanceof PDFProcessingError) {
                throw error;
            }

            throw new PDFProcessingError(
                `Failed to update field value: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'FIELD_UPDATE_ERROR',
                error
            );
        }
    }

    /**
     * Validate all form fields in the document
     */
    async validateFormFields(document: PDFDocument, fieldDefinitions?: FieldDefinition[]): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
        try {
            const result = {
                isValid: true,
                errors: [] as string[],
                warnings: [] as string[]
            };

            const form = document.getForm();
            const fields = form.getFields();

            // Create a map of field names to their definitions for required checking
            const fieldDefMap = new Map<string, FieldDefinition>();
            if (fieldDefinitions) {
                fieldDefinitions.forEach(def => fieldDefMap.set(def.name, def));
            }

            for (const field of fields) {
                try {
                    const fieldName = field.getName();
                    const fieldDef = fieldDefMap.get(fieldName);

                    // Check if required fields have values (based on our field definitions)
                    if (fieldDef?.required) {
                        let hasValue = false;

                        if (field instanceof PDFTextField) {
                            const text = field.getText();
                            hasValue = !!(text && text.trim());
                        } else if (field instanceof PDFCheckBox) {
                            hasValue = field.isChecked();
                        } else if (field instanceof PDFDropdown) {
                            hasValue = !!field.getSelected().length;
                        } else if (field instanceof PDFRadioGroup) {
                            hasValue = !!field.getSelected();
                        }

                        if (!hasValue) {
                            result.errors.push(`Required field '${fieldName}' is empty`);
                            result.isValid = false;
                        }
                    }
                } catch (error) {
                    result.warnings.push(`Could not validate field '${field.getName()}': ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return result;
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to validate form fields: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'FIELD_VALIDATION_ERROR',
                error
            );
        }
    }

    /**
     * Serialize PDF document to buffer
     */
    async serialize(document: PDFDocument): Promise<Buffer> {
        try {
            const pdfBytes = await document.save();
            return Buffer.from(pdfBytes);
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to serialize PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SERIALIZATION_ERROR',
                error
            );
        }
    }

    /**
     * Apply signature appearance to PDF document
     */
    async applySignatureAppearance(
        document: PDFDocument,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<SignatureAppearanceResult> {
        try {
            // Ensure all required properties have defaults
            const configWithDefaults = {
                ...config,
                page: config.page ?? 0,
                fontSize: config.fontSize ?? 12,
                font: config.font ?? 'Helvetica' as const,
                borderWidth: config.borderWidth ?? 1,
                textColor: config.textColor ?? '#000000',
                logoPosition: config.logoPosition ?? 'top-left' as const,
                logoSize: config.logoSize ?? 20,
                showTimestamp: config.showTimestamp ?? true,
                showSignerName: config.showSignerName ?? true,
                showReason: config.showReason ?? false,
                showLocation: config.showLocation ?? false,
                multiPageCoordination: config.multiPageCoordination ?? false,
                rotation: config.rotation ?? 0,
                scaleX: config.scaleX ?? 1,
                scaleY: config.scaleY ?? 1,
                imageQuality: config.imageQuality ?? 85,
                antiAliasing: config.antiAliasing ?? true
            };

            return await this.signatureAppearanceEngine.generateSignatureAppearance(
                document,
                configWithDefaults,
                metadata
            );
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to apply signature appearance: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SIGNATURE_APPEARANCE_ERROR',
                error
            );
        }
    }

    /**
     * Create signature with custom appearance
     */
    async createSignatureWithAppearance(
        document: PDFDocument,
        fieldName: string,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<{ field: PDFField; appearance: SignatureAppearanceResult }> {
        try {
            // First create the signature field
            const fieldDefinition: FieldDefinition = {
                type: 'signature',
                name: fieldName,
                page: config.page || 0,
                x: config.x,
                y: config.y,
                width: config.width,
                height: config.height,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
                multiline: false,
                alignment: 'left'
            };

            const field = await this.createField(document, fieldDefinition);

            // Then apply the signature appearance
            const appearance = await this.applySignatureAppearance(document, config, metadata);

            return { field, appearance };
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to create signature with appearance: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SIGNATURE_CREATION_ERROR',
                error
            );
        }
    }

    /**
     * Update existing signature field with new appearance
     */
    async updateSignatureAppearance(
        document: PDFDocument,
        fieldName: string,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<SignatureAppearanceResult> {
        try {
            // Check if field exists
            const field = await this.getFormField(document, fieldName);
            if (!field) {
                throw new PDFValidationError(`Signature field '${fieldName}' not found`);
            }

            // Apply new appearance
            return await this.applySignatureAppearance(document, config, metadata);
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to update signature appearance: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SIGNATURE_UPDATE_ERROR',
                error
            );
        }
    }

    /**
     * Apply multi-page signature coordination
     */
    async applyMultiPageSignature(
        document: PDFDocument,
        primaryConfig: SignatureAppearanceConfig,
        pageReferences: Array<{
            page: number;
            x: number;
            y: number;
            width: number;
            height: number;
        }>,
        metadata: SignatureAppearanceMetadata
    ): Promise<SignatureAppearanceResult> {
        try {
            const configWithMultiPage: SignatureAppearanceConfig = {
                ...primaryConfig,
                multiPageCoordination: true,
                pageReferences,
            };

            return await this.applySignatureAppearance(document, configWithMultiPage, metadata);
        } catch (error) {
            throw new PDFProcessingError(
                `Failed to apply multi-page signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'MULTI_PAGE_SIGNATURE_ERROR',
                error
            );
        }
    }

    /**
     * Clear signature appearance engine cache
     */
    clearSignatureCache(): void {
        this.signatureAppearanceEngine.clearCache();
    }
}