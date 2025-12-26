import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import {
    PDFAccessibilityEngine,
    AccessibilityLevel,
    StructureElementType,
    AccessibilityIssueType,
    createPDFAccessibilityEngine,
    type StructureElement,
    type TaggedPDFOptions,
    type ScreenReaderOptions,
    type AccessibilityValidationResult
} from '../pdf-accessibility-engine';

describe('PDFAccessibilityEngine', () => {
    let engine: PDFAccessibilityEngine;
    let document: PDFDocument;

    beforeEach(async () => {
        engine = createPDFAccessibilityEngine();
        document = await PDFDocument.create();
    });

    describe('createTaggedPDF', () => {
        it('should create tagged PDF with basic structure', async () => {
            const structure: StructureElement[] = [
                {
                    type: StructureElementType.DOCUMENT,
                    metadata: {
                        title: 'Test Document'
                    },
                    children: [
                        {
                            type: StructureElementType.HEADING_1,
                            metadata: {
                                actualText: 'Main Heading'
                            }
                        },
                        {
                            type: StructureElementType.PARAGRAPH,
                            metadata: {
                                actualText: 'This is a paragraph of text.'
                            }
                        }
                    ]
                }
            ];

            const options: TaggedPDFOptions = {
                title: 'Test Document',
                language: 'en-US',
                author: 'Test Author',
                marked: true,
                displayDocTitle: true
            };

            const result = await engine.createTaggedPDF(document, structure, options);

            expect(result).toBe(document);
            expect(document.getTitle()).toBe('Test Document');
            expect(document.getAuthor()).toBe('Test Author');

            // Check that structure tree root was created
            const catalog = document.catalog;
            expect(catalog.has(PDFName.of('StructTreeRoot'))).toBe(true);
            expect(catalog.has(PDFName.of('Lang'))).toBe(true);
            expect(catalog.has(PDFName.of('Marked'))).toBe(true);
        });

        it('should handle complex nested structure', async () => {
            const structure: StructureElement[] = [
                {
                    type: StructureElementType.DOCUMENT,
                    metadata: {
                        title: 'Complex Document'
                    },
                    children: [
                        {
                            type: StructureElementType.SECTION,
                            metadata: {
                                title: 'Introduction'
                            },
                            children: [
                                {
                                    type: StructureElementType.HEADING_1,
                                    metadata: {
                                        actualText: 'Introduction'
                                    }
                                },
                                {
                                    type: StructureElementType.PARAGRAPH,
                                    metadata: {
                                        actualText: 'Introduction paragraph.'
                                    }
                                }
                            ]
                        },
                        {
                            type: StructureElementType.TABLE,
                            metadata: {
                                title: 'Data Table'
                            },
                            children: [
                                {
                                    type: StructureElementType.TABLE_ROW,
                                    metadata: {},
                                    children: [
                                        {
                                            type: StructureElementType.TABLE_HEADER,
                                            metadata: {
                                                actualText: 'Header 1'
                                            }
                                        },
                                        {
                                            type: StructureElementType.TABLE_HEADER,
                                            metadata: {
                                                actualText: 'Header 2'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ];

            const options: TaggedPDFOptions = {
                title: 'Complex Document',
                language: 'en-US'
            };

            const result = await engine.createTaggedPDF(document, structure, options);

            expect(result).toBe(document);
            expect(document.getTitle()).toBe('Complex Document');
        });

        it('should validate options and throw error for invalid input', async () => {
            const structure: StructureElement[] = [];
            const invalidOptions = {
                title: '', // Invalid empty title
                language: 'en-US'
            } as TaggedPDFOptions;

            await expect(
                engine.createTaggedPDF(document, structure, invalidOptions)
            ).rejects.toThrow('Failed to create tagged PDF');
        });
    });

    describe('optimizeForScreenReaders', () => {
        it('should optimize document for screen readers with all options enabled', async () => {
            const options: ScreenReaderOptions = {
                optimizeReadingOrder: true,
                addNavigationAids: true,
                enhanceFormLabels: true,
                improveTableStructure: true,
                addLandmarkRoles: true
            };

            // Mock console.log to verify optimization steps
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            const result = await engine.optimizeForScreenReaders(document, options);

            expect(result).toBe(document);
            expect(consoleSpy).toHaveBeenCalledWith('Optimizing reading order for screen readers...');
            expect(consoleSpy).toHaveBeenCalledWith('Adding navigation aids...');
            expect(consoleSpy).toHaveBeenCalledWith('Enhancing form labels...');
            expect(consoleSpy).toHaveBeenCalledWith('Improving table structure...');
            expect(consoleSpy).toHaveBeenCalledWith('Adding landmark roles...');

            consoleSpy.mockRestore();
        });

        it('should optimize selectively based on options', async () => {
            const options: ScreenReaderOptions = {
                optimizeReadingOrder: true,
                addNavigationAids: false,
                enhanceFormLabels: true,
                improveTableStructure: false,
                addLandmarkRoles: false
            };

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            const result = await engine.optimizeForScreenReaders(document, options);

            expect(result).toBe(document);
            expect(consoleSpy).toHaveBeenCalledWith('Optimizing reading order for screen readers...');
            expect(consoleSpy).toHaveBeenCalledWith('Enhancing form labels...');
            expect(consoleSpy).not.toHaveBeenCalledWith('Adding navigation aids...');

            consoleSpy.mockRestore();
        });
    });

    describe('addAlternativeText', () => {
        it('should add alternative text for images', async () => {
            // Add a page to the document
            document.addPage();

            const imageAlternatives = new Map<string, string>([
                ['image1', 'A chart showing sales data'],
                ['image2', 'Company logo'],
                ['image3', 'Diagram of the process flow']
            ]);

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            const result = await engine.addAlternativeText(document, imageAlternatives);

            expect(result).toBe(document);
            expect(consoleSpy).toHaveBeenCalledWith('Processing images on page 1...');

            consoleSpy.mockRestore();
        });

        it('should handle empty image alternatives map', async () => {
            document.addPage();
            const imageAlternatives = new Map<string, string>();

            const result = await engine.addAlternativeText(document, imageAlternatives);

            expect(result).toBe(document);
        });
    });

    describe('validateAccessibilityCompliance', () => {
        it('should validate basic document and return compliance result', async () => {
            // Create a basic document with some accessibility features
            document.setTitle('Test Document');
            document.catalog.set(PDFName.of('Lang'), PDFString.of('en-US'));

            const result = await engine.validateAccessibilityCompliance(
                document,
                AccessibilityLevel.BASIC
            );

            expect(result).toMatchObject({
                isCompliant: expect.any(Boolean),
                level: expect.any(String),
                issues: expect.any(Array),
                warnings: expect.any(Array),
                score: expect.any(Number),
                recommendations: expect.any(Array),
                structureAnalysis: expect.any(Object)
            });

            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should identify missing structure tree as critical issue', async () => {
            // Document without structure tree
            const result = await engine.validateAccessibilityCompliance(document);

            const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
            const structureTreeIssue = criticalIssues.find(
                issue => issue.type === AccessibilityIssueType.MISSING_STRUCTURE_TREE
            );

            expect(structureTreeIssue).toBeDefined();
            expect(structureTreeIssue?.description).toContain('structure tree');
            expect(structureTreeIssue?.wcagGuideline).toContain('WCAG 2.1');
        });

        it('should identify missing title and language as major issues', async () => {
            const result = await engine.validateAccessibilityCompliance(document);

            const majorIssues = result.issues.filter(issue => issue.severity === 'major');

            const titleIssue = majorIssues.find(
                issue => issue.type === AccessibilityIssueType.MISSING_TITLE
            );
            const languageIssue = majorIssues.find(
                issue => issue.type === AccessibilityIssueType.MISSING_LANGUAGE
            );

            expect(titleIssue).toBeDefined();
            expect(languageIssue).toBeDefined();
        });

        it('should calculate compliance score correctly', async () => {
            // Document with title and language set
            document.setTitle('Accessible Document');
            document.catalog.set(PDFName.of('Lang'), PDFString.of('en-US'));

            const result = await engine.validateAccessibilityCompliance(document);

            // Should have higher score with basic accessibility features
            expect(result.score).toBeGreaterThan(50);
        });

        it('should determine compliance level based on score', async () => {
            const result = await engine.validateAccessibilityCompliance(document);

            expect([
                AccessibilityLevel.BASIC,
                AccessibilityLevel.ENHANCED,
                AccessibilityLevel.FULL_COMPLIANCE
            ]).toContain(result.level);
        });

        it('should provide relevant recommendations', async () => {
            const result = await engine.validateAccessibilityCompliance(document);

            expect(result.recommendations).toBeInstanceOf(Array);
            expect(result.recommendations.length).toBeGreaterThan(0);

            // Should recommend addressing critical issues
            const criticalRecommendation = result.recommendations.find(
                rec => rec.includes('critical')
            );
            expect(criticalRecommendation).toBeDefined();
        });

        it('should include structure analysis', async () => {
            const result = await engine.validateAccessibilityCompliance(document);

            expect(result.structureAnalysis).toMatchObject({
                hasStructureTree: expect.any(Boolean),
                elementCount: expect.any(Number),
                headingStructure: expect.any(Array),
                tableCount: expect.any(Number),
                imageCount: expect.any(Number),
                formFieldCount: expect.any(Number),
                linkCount: expect.any(Number),
                readingOrder: expect.any(Array)
            });
        });
    });

    describe('error handling', () => {
        it('should throw PDFAccessibilityError for invalid structure', async () => {
            const invalidStructure = null as any;
            const options: TaggedPDFOptions = {
                title: 'Test',
                language: 'en-US'
            };

            await expect(
                engine.createTaggedPDF(document, invalidStructure, options)
            ).rejects.toThrow();
        });

        it('should handle errors in screen reader optimization gracefully', async () => {
            // Mock a method to throw an error
            const originalMethod = (engine as any).optimizeReadingOrder;
            (engine as any).optimizeReadingOrder = vi.fn().mockRejectedValue(new Error('Test error'));

            const options: ScreenReaderOptions = {
                optimizeReadingOrder: true,
                addNavigationAids: false,
                enhanceFormLabels: false,
                improveTableStructure: false,
                addLandmarkRoles: false
            };

            await expect(
                engine.optimizeForScreenReaders(document, options)
            ).rejects.toThrow('Failed to optimize for screen readers');

            // Restore original method
            (engine as any).optimizeReadingOrder = originalMethod;
        });
    });

    describe('factory function', () => {
        it('should create PDFAccessibilityEngine instance', () => {
            const engine = createPDFAccessibilityEngine();
            expect(engine).toBeInstanceOf(PDFAccessibilityEngine);
        });
    });

    describe('accessibility metadata validation', () => {
        it('should handle structure elements with complete metadata', async () => {
            const structure: StructureElement[] = [
                {
                    type: StructureElementType.FIGURE,
                    metadata: {
                        alternativeText: 'A detailed chart showing quarterly sales',
                        actualText: 'Q1: $100K, Q2: $150K, Q3: $200K, Q4: $180K',
                        title: 'Quarterly Sales Chart',
                        language: 'en-US',
                        role: 'img',
                        placement: 'Block'
                    },
                    pageContent: {
                        page: 1,
                        boundingBox: {
                            x: 100,
                            y: 200,
                            width: 300,
                            height: 200
                        }
                    }
                }
            ];

            const options: TaggedPDFOptions = {
                title: 'Chart Document',
                language: 'en-US'
            };

            const result = await engine.createTaggedPDF(document, structure, options);
            expect(result).toBe(document);
        });

        it('should handle structure elements with minimal metadata', async () => {
            const structure: StructureElement[] = [
                {
                    type: StructureElementType.PARAGRAPH,
                    metadata: {}
                }
            ];

            const options: TaggedPDFOptions = {
                title: 'Minimal Document',
                language: 'en-US'
            };

            const result = await engine.createTaggedPDF(document, structure, options);
            expect(result).toBe(document);
        });
    });
});