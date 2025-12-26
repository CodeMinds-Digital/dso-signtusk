import { PDFDocument } from 'pdf-lib';
import {
    createPDFAccessibilityEngine,
    AccessibilityLevel,
    StructureElementType,
    type StructureElement,
    type TaggedPDFOptions,
    type ScreenReaderOptions
} from '../src/pdf-accessibility-engine';

/**
 * Example: Creating an accessible PDF with tagged structure
 */
async function createAccessibleDocument() {
    console.log('Creating accessible PDF document...');

    // Create a new PDF document
    const document = await PDFDocument.create();
    const page = document.addPage([612, 792]); // Standard letter size

    // Create accessibility engine
    const accessibilityEngine = createPDFAccessibilityEngine();

    // Define document structure for screen readers
    const documentStructure: StructureElement[] = [
        {
            type: StructureElementType.DOCUMENT,
            metadata: {
                title: 'Accessible Business Report',
                language: 'en-US'
            },
            children: [
                // Document header
                {
                    type: StructureElementType.SECTION,
                    metadata: {
                        title: 'Header Section',
                        role: 'banner'
                    },
                    children: [
                        {
                            type: StructureElementType.HEADING_1,
                            metadata: {
                                actualText: 'Q4 2024 Business Report',
                                title: 'Main Document Title'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 700, width: 500, height: 40 }
                            }
                        },
                        {
                            type: StructureElementType.FIGURE,
                            metadata: {
                                alternativeText: 'Company logo featuring a blue circle with white text',
                                title: 'Company Logo'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 450, y: 720, width: 100, height: 50 }
                            }
                        }
                    ]
                },

                // Main content section
                {
                    type: StructureElementType.SECTION,
                    metadata: {
                        title: 'Main Content',
                        role: 'main'
                    },
                    children: [
                        // Executive Summary
                        {
                            type: StructureElementType.HEADING_2,
                            metadata: {
                                actualText: 'Executive Summary',
                                title: 'Executive Summary Section'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 650, width: 200, height: 25 }
                            }
                        },
                        {
                            type: StructureElementType.PARAGRAPH,
                            metadata: {
                                actualText: 'This report presents our Q4 2024 performance metrics and strategic outlook for the upcoming year. Key highlights include 15% revenue growth and successful market expansion.',
                                title: 'Executive Summary Content'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 600, width: 500, height: 40 }
                            }
                        },

                        // Financial Performance Section
                        {
                            type: StructureElementType.HEADING_2,
                            metadata: {
                                actualText: 'Financial Performance',
                                title: 'Financial Performance Section'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 550, width: 250, height: 25 }
                            }
                        },

                        // Data table
                        {
                            type: StructureElementType.TABLE,
                            metadata: {
                                title: 'Quarterly Financial Data',
                                alternativeText: 'Table showing quarterly revenue, expenses, and profit for Q1 through Q4 2024'
                            },
                            children: [
                                // Table header row
                                {
                                    type: StructureElementType.TABLE_ROW,
                                    metadata: {
                                        title: 'Table Header Row'
                                    },
                                    children: [
                                        {
                                            type: StructureElementType.TABLE_HEADER,
                                            metadata: {
                                                actualText: 'Quarter',
                                                title: 'Quarter Column Header'
                                            }
                                        },
                                        {
                                            type: StructureElementType.TABLE_HEADER,
                                            metadata: {
                                                actualText: 'Revenue',
                                                title: 'Revenue Column Header'
                                            }
                                        },
                                        {
                                            type: StructureElementType.TABLE_HEADER,
                                            metadata: {
                                                actualText: 'Expenses',
                                                title: 'Expenses Column Header'
                                            }
                                        },
                                        {
                                            type: StructureElementType.TABLE_HEADER,
                                            metadata: {
                                                actualText: 'Profit',
                                                title: 'Profit Column Header'
                                            }
                                        }
                                    ]
                                },
                                // Data rows
                                {
                                    type: StructureElementType.TABLE_ROW,
                                    metadata: {
                                        title: 'Q1 Data Row'
                                    },
                                    children: [
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: 'Q1 2024' }
                                        },
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: '$2.5M' }
                                        },
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: '$1.8M' }
                                        },
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: '$0.7M' }
                                        }
                                    ]
                                },
                                {
                                    type: StructureElementType.TABLE_ROW,
                                    metadata: {
                                        title: 'Q4 Data Row'
                                    },
                                    children: [
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: 'Q4 2024' }
                                        },
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: '$3.2M' }
                                        },
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: '$2.1M' }
                                        },
                                        {
                                            type: StructureElementType.TABLE_DATA,
                                            metadata: { actualText: '$1.1M' }
                                        }
                                    ]
                                }
                            ],
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 400, width: 500, height: 120 }
                            }
                        },

                        // Chart figure
                        {
                            type: StructureElementType.FIGURE,
                            metadata: {
                                alternativeText: 'Bar chart showing quarterly revenue growth from Q1 to Q4 2024. Q1: $2.5M, Q2: $2.8M, Q3: $3.0M, Q4: $3.2M, demonstrating consistent upward trend.',
                                title: 'Quarterly Revenue Growth Chart',
                                actualText: 'Revenue increased from $2.5M in Q1 to $3.2M in Q4, showing 28% growth over the year.'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 200, width: 500, height: 180 }
                            }
                        },

                        // Caption for chart
                        {
                            type: StructureElementType.CAPTION,
                            metadata: {
                                actualText: 'Figure 1: Quarterly Revenue Growth - Consistent upward trend throughout 2024',
                                title: 'Chart Caption'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 180, width: 500, height: 15 }
                            }
                        }
                    ]
                },

                // Footer section
                {
                    type: StructureElementType.SECTION,
                    metadata: {
                        title: 'Footer Section',
                        role: 'contentinfo'
                    },
                    children: [
                        {
                            type: StructureElementType.PARAGRAPH,
                            metadata: {
                                actualText: 'Confidential - Internal Use Only | Page 1 of 1 | Generated on December 18, 2024',
                                title: 'Document Footer'
                            },
                            pageContent: {
                                page: 1,
                                boundingBox: { x: 50, y: 50, width: 500, height: 15 }
                            }
                        }
                    ]
                }
            ]
        }
    ];

    // Configure tagged PDF options
    const taggedPDFOptions: TaggedPDFOptions = {
        title: 'Q4 2024 Business Report - Accessible Version',
        language: 'en-US',
        author: 'Business Intelligence Team',
        subject: 'Quarterly financial performance and strategic analysis',
        keywords: ['business', 'financial', 'quarterly', 'report', '2024'],
        marked: true,
        suspects: false,
        displayDocTitle: true
    };

    // Create tagged PDF structure
    const taggedDocument = await accessibilityEngine.createTaggedPDF(
        document,
        documentStructure,
        taggedPDFOptions
    );

    console.log('✓ Tagged PDF structure created successfully');

    // Configure screen reader optimization
    const screenReaderOptions: ScreenReaderOptions = {
        optimizeReadingOrder: true,
        addNavigationAids: true,
        enhanceFormLabels: false, // No forms in this document
        improveTableStructure: true,
        addLandmarkRoles: true
    };

    // Optimize for screen readers
    const optimizedDocument = await accessibilityEngine.optimizeForScreenReaders(
        taggedDocument,
        screenReaderOptions
    );

    console.log('✓ Screen reader optimization completed');

    // Add alternative text for images
    const imageAlternatives = new Map<string, string>([
        ['company-logo', 'Company logo featuring a blue circle with white text reading "TechCorp"'],
        ['revenue-chart', 'Bar chart showing quarterly revenue growth from Q1 to Q4 2024. Values: Q1 $2.5M, Q2 $2.8M, Q3 $3.0M, Q4 $3.2M. Chart demonstrates consistent upward trend with 28% total growth.']
    ]);

    const finalDocument = await accessibilityEngine.addAlternativeText(
        optimizedDocument,
        imageAlternatives
    );

    console.log('✓ Alternative text added for images');

    return finalDocument;
}

/**
 * Example: Validating PDF accessibility compliance
 */
async function validateDocumentAccessibility(document: PDFDocument) {
    console.log('\nValidating document accessibility compliance...');

    const accessibilityEngine = createPDFAccessibilityEngine();

    // Validate for enhanced accessibility level
    const validationResult = await accessibilityEngine.validateAccessibilityCompliance(
        document,
        AccessibilityLevel.ENHANCED
    );

    console.log('\n=== Accessibility Validation Report ===');
    console.log(`Compliance Level: ${validationResult.level}`);
    console.log(`Overall Score: ${validationResult.score}/100`);
    console.log(`Is Compliant: ${validationResult.isCompliant ? 'Yes' : 'No'}`);

    // Display structure analysis
    console.log('\n--- Structure Analysis ---');
    console.log(`Has Structure Tree: ${validationResult.structureAnalysis.hasStructureTree}`);
    console.log(`Structure Elements: ${validationResult.structureAnalysis.elementCount}`);
    console.log(`Headings Found: ${validationResult.structureAnalysis.headingStructure.length}`);
    console.log(`Tables: ${validationResult.structureAnalysis.tableCount}`);
    console.log(`Images: ${validationResult.structureAnalysis.imageCount}`);
    console.log(`Form Fields: ${validationResult.structureAnalysis.formFieldCount}`);
    console.log(`Links: ${validationResult.structureAnalysis.linkCount}`);

    // Display issues
    if (validationResult.issues.length > 0) {
        console.log('\n--- Accessibility Issues ---');
        validationResult.issues.forEach((issue, index) => {
            console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
            console.log(`   Recommendation: ${issue.recommendation}`);
            if (issue.wcagGuideline) {
                console.log(`   WCAG Guideline: ${issue.wcagGuideline}`);
            }
            if (issue.location) {
                console.log(`   Location: Page ${issue.location.page || 'N/A'}`);
            }
            console.log('');
        });
    }

    // Display warnings
    if (validationResult.warnings.length > 0) {
        console.log('--- Accessibility Warnings ---');
        validationResult.warnings.forEach((warning, index) => {
            console.log(`${index + 1}. ${warning.description}`);
            console.log(`   Suggestion: ${warning.suggestion}`);
            console.log('');
        });
    }

    // Display recommendations
    if (validationResult.recommendations.length > 0) {
        console.log('--- Recommendations ---');
        validationResult.recommendations.forEach((recommendation, index) => {
            console.log(`${index + 1}. ${recommendation}`);
        });
    }

    return validationResult;
}

/**
 * Example: Creating accessible form document
 */
async function createAccessibleFormDocument() {
    console.log('\nCreating accessible form document...');

    const document = await PDFDocument.create();
    const page = document.addPage([612, 792]);

    const accessibilityEngine = createPDFAccessibilityEngine();

    // Define form structure
    const formStructure: StructureElement[] = [
        {
            type: StructureElementType.DOCUMENT,
            metadata: {
                title: 'Accessible Contact Form',
                language: 'en-US'
            },
            children: [
                {
                    type: StructureElementType.FORM,
                    metadata: {
                        title: 'Contact Information Form',
                        role: 'form'
                    },
                    children: [
                        {
                            type: StructureElementType.HEADING_1,
                            metadata: {
                                actualText: 'Contact Information',
                                title: 'Form Title'
                            }
                        },
                        {
                            type: StructureElementType.PARAGRAPH,
                            metadata: {
                                actualText: 'Please fill out all required fields marked with an asterisk (*)',
                                title: 'Form Instructions'
                            }
                        },
                        // Form fields would be added here with proper labels
                        {
                            type: StructureElementType.PARAGRAPH,
                            metadata: {
                                actualText: 'First Name *',
                                title: 'First Name Field Label',
                                role: 'label'
                            }
                        },
                        {
                            type: StructureElementType.PARAGRAPH,
                            metadata: {
                                actualText: 'Email Address *',
                                title: 'Email Field Label',
                                role: 'label'
                            }
                        }
                    ]
                }
            ]
        }
    ];

    const options: TaggedPDFOptions = {
        title: 'Accessible Contact Form',
        language: 'en-US',
        marked: true
    };

    const taggedFormDocument = await accessibilityEngine.createTaggedPDF(
        document,
        formStructure,
        options
    );

    // Optimize specifically for form accessibility
    const formOptimizationOptions: ScreenReaderOptions = {
        optimizeReadingOrder: true,
        addNavigationAids: true,
        enhanceFormLabels: true, // Important for forms
        improveTableStructure: false,
        addLandmarkRoles: true
    };

    const optimizedFormDocument = await accessibilityEngine.optimizeForScreenReaders(
        taggedFormDocument,
        formOptimizationOptions
    );

    console.log('✓ Accessible form document created');

    return optimizedFormDocument;
}

/**
 * Main example execution
 */
async function runAccessibilityExamples() {
    try {
        console.log('=== PDF Accessibility Engine Examples ===\n');

        // Example 1: Create accessible business report
        const accessibleDocument = await createAccessibleDocument();

        // Example 2: Validate accessibility compliance
        await validateDocumentAccessibility(accessibleDocument);

        // Example 3: Create accessible form
        const accessibleForm = await createAccessibleFormDocument();
        await validateDocumentAccessibility(accessibleForm);

        console.log('\n✓ All accessibility examples completed successfully!');
        console.log('\nKey Benefits of PDF Accessibility:');
        console.log('• Screen reader compatibility for visually impaired users');
        console.log('• Proper document structure for navigation');
        console.log('• Alternative text for images and graphics');
        console.log('• WCAG 2.1 AA compliance for legal requirements');
        console.log('• Enhanced user experience for all users');
        console.log('• Better SEO and searchability');

    } catch (error) {
        console.error('Error in accessibility examples:', error);
        throw error;
    }
}

// Export for use in other modules
export {
    createAccessibleDocument,
    validateDocumentAccessibility,
    createAccessibleFormDocument,
    runAccessibilityExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAccessibilityExamples().catch(console.error);
}