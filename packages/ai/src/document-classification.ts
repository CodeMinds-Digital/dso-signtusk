import natural from 'natural';
import { Matrix } from 'ml-matrix';
import type { DocumentClassificationResult, DocumentCategory } from './types';
import { DocumentClassificationResultSchema } from './types';

/**
 * Document Classification Service using machine learning models
 */
export class DocumentClassificationService {
    private classifier: natural.BayesClassifier;
    private tfidf: natural.TfIdf;
    private stemmer = natural.PorterStemmer;
    private wordTokenizer: natural.WordTokenizer;

    constructor(
        private db: any,
        private storageService: any
    ) {
        this.classifier = new natural.BayesClassifier();
        this.tfidf = new natural.TfIdf();
        this.wordTokenizer = new natural.WordTokenizer();
        this.initializeClassifier();
    }

    /**
     * Classify document using machine learning models
     */
    async classifyDocument(documentId: string, organizationId: string): Promise<DocumentClassificationResult> {
        const startTime = Date.now();

        try {
            // Get document content
            const document = await this.getDocument(documentId, organizationId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Extract text content
            const textContent = await this.extractTextContent(document);

            // Preprocess text
            const preprocessedText = this.preprocessText(textContent);

            // Extract features
            const features = this.extractFeatures(preprocessedText);

            // Classify using multiple approaches
            const bayesResult = this.classifyWithBayes(preprocessedText);
            const keywordResult = this.classifyWithKeywords(preprocessedText);
            const structureResult = this.classifyWithStructure(textContent);

            // Combine results
            const categories = this.combineClassificationResults([
                bayesResult,
                keywordResult,
                structureResult,
            ]);

            // Determine primary category
            const primaryCategory = categories.length > 0
                ? categories.reduce((prev, current) =>
                    prev.confidence > current.confidence ? prev : current
                ).name
                : 'Unknown';

            const overallConfidence = categories.length > 0
                ? categories.reduce((sum, cat) => sum + cat.confidence, 0) / categories.length
                : 0.5;

            const processingTime = Date.now() - startTime;

            const result: DocumentClassificationResult = {
                documentId,
                categories,
                primaryCategory,
                confidence: overallConfidence,
                processingTime,
                metadata: {
                    algorithm: 'ensemble_classification_v1',
                    version: '1.0.0',
                    features: features.slice(0, 10), // Top 10 features
                    textLength: textContent.length,
                },
            };

            // Validate result
            const validatedResult = DocumentClassificationResultSchema.parse(result);

            // Store result in database
            await this.storeClassificationResult(validatedResult, organizationId);

            return validatedResult;

        } catch (error) {
            console.error('Document classification failed:', error);
            throw error;
        }
    }

    /**
     * Initialize the classifier with training data
     */
    private initializeClassifier(): void {
        // Training data for common document types
        const trainingData = [
            // Contracts
            { text: 'agreement contract terms conditions parties obligations', category: 'Contract' },
            { text: 'service agreement provider client terms payment', category: 'Service Agreement' },
            { text: 'employment contract employee employer salary benefits', category: 'Employment Contract' },
            { text: 'lease agreement tenant landlord rent property', category: 'Lease Agreement' },
            { text: 'purchase agreement buyer seller property sale', category: 'Purchase Agreement' },

            // Legal Documents
            { text: 'legal document court case lawsuit plaintiff defendant', category: 'Legal Document' },
            { text: 'power attorney legal authority representative', category: 'Power of Attorney' },
            { text: 'will testament beneficiary executor estate', category: 'Will/Testament' },
            { text: 'affidavit sworn statement notary witness', category: 'Affidavit' },

            // Financial Documents
            { text: 'invoice payment due amount billing customer', category: 'Invoice' },
            { text: 'receipt payment received transaction amount', category: 'Receipt' },
            { text: 'loan agreement borrower lender interest rate', category: 'Loan Agreement' },
            { text: 'financial statement assets liabilities equity', category: 'Financial Statement' },
            { text: 'tax document income deduction filing', category: 'Tax Document' },

            // HR Documents
            { text: 'job offer position salary benefits start date', category: 'Job Offer' },
            { text: 'performance review employee evaluation rating', category: 'Performance Review' },
            { text: 'resignation letter employee leaving notice', category: 'Resignation Letter' },
            { text: 'policy handbook employee guidelines rules', category: 'Policy Document' },

            // Insurance Documents
            { text: 'insurance policy coverage premium deductible', category: 'Insurance Policy' },
            { text: 'insurance claim damage coverage payment', category: 'Insurance Claim' },

            // Real Estate
            { text: 'property deed ownership title transfer', category: 'Property Deed' },
            { text: 'mortgage loan property interest rate', category: 'Mortgage Document' },

            // Business Documents
            { text: 'business plan strategy market analysis', category: 'Business Plan' },
            { text: 'partnership agreement partners business terms', category: 'Partnership Agreement' },
            { text: 'non disclosure agreement confidential information', category: 'NDA' },
            { text: 'terms service user agreement website', category: 'Terms of Service' },

            // Personal Documents
            { text: 'medical record patient treatment diagnosis', category: 'Medical Record' },
            { text: 'consent form permission medical treatment', category: 'Consent Form' },
            { text: 'application form personal information request', category: 'Application Form' },
        ];

        // Train the classifier
        trainingData.forEach(item => {
            this.classifier.addDocument(item.text, item.category);
        });

        this.classifier.train();
    }

    /**
     * Extract text content from document
     */
    private async extractTextContent(document: any): Promise<string> {
        // This would extract text from the document file
        // For now, return mock content based on document name/type
        return `Sample document content for ${document.name}. This is a contract agreement between parties with terms and conditions.`;
    }

    /**
     * Preprocess text for classification
     */
    private preprocessText(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Extract features from text
     */
    private extractFeatures(text: string): string[] {
        // Tokenize
        const tokens = this.wordTokenizer.tokenize(text) || [];

        // Remove stop words
        const stopWords = natural.stopwords;
        const filteredTokens = tokens.filter((token: string) =>
            !stopWords.includes(token) && token.length > 2
        );

        // Stem words
        const stemmedTokens = filteredTokens.map((token: string) =>
            this.stemmer.stem(token)
        );

        // Get unique features
        return [...new Set(stemmedTokens)] as string[];
    }

    /**
     * Classify using Naive Bayes
     */
    private classifyWithBayes(text: string): DocumentCategory[] {
        const classifications = this.classifier.getClassifications(text);

        return classifications.map(classification => ({
            name: classification.label,
            confidence: classification.value,
            characteristics: this.getCharacteristics(classification.label, text),
        }));
    }

    /**
     * Classify using keyword matching
     */
    private classifyWithKeywords(text: string): DocumentCategory[] {
        const keywordCategories = {
            'Contract': [
                'agreement', 'contract', 'terms', 'conditions', 'parties',
                'obligations', 'breach', 'termination', 'effective date'
            ],
            'Invoice': [
                'invoice', 'payment', 'due', 'amount', 'billing', 'total',
                'tax', 'subtotal', 'customer', 'vendor'
            ],
            'Legal Document': [
                'legal', 'court', 'lawsuit', 'plaintiff', 'defendant',
                'jurisdiction', 'statute', 'law', 'regulation'
            ],
            'Employment Contract': [
                'employment', 'employee', 'employer', 'salary', 'benefits',
                'position', 'job', 'work', 'compensation'
            ],
            'Lease Agreement': [
                'lease', 'rent', 'tenant', 'landlord', 'property',
                'premises', 'monthly', 'deposit', 'utilities'
            ],
            'Insurance Policy': [
                'insurance', 'policy', 'coverage', 'premium', 'deductible',
                'claim', 'beneficiary', 'insured', 'insurer'
            ],
            'NDA': [
                'non-disclosure', 'confidential', 'proprietary', 'trade secret',
                'confidentiality', 'disclosure', 'information'
            ],
            'Power of Attorney': [
                'power of attorney', 'attorney-in-fact', 'principal',
                'authority', 'legal representative', 'agent'
            ],
        };

        const results: DocumentCategory[] = [];

        Object.entries(keywordCategories).forEach(([category, keywords]) => {
            let matchCount = 0;
            let totalKeywords = keywords.length;

            keywords.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) {
                    matchCount++;
                }
            });

            const confidence = matchCount / totalKeywords;

            if (confidence > 0.1) { // Minimum threshold
                results.push({
                    name: category,
                    confidence,
                    characteristics: keywords.filter(keyword =>
                        text.includes(keyword.toLowerCase())
                    ),
                });
            }
        });

        return results.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Classify based on document structure
     */
    private classifyWithStructure(text: string): DocumentCategory[] {
        const results: DocumentCategory[] = [];

        // Check for invoice structure
        if (this.hasInvoiceStructure(text)) {
            results.push({
                name: 'Invoice',
                confidence: 0.8,
                characteristics: ['structured_billing', 'line_items', 'totals'],
            });
        }

        // Check for contract structure
        if (this.hasContractStructure(text)) {
            results.push({
                name: 'Contract',
                confidence: 0.7,
                characteristics: ['sections', 'clauses', 'signatures'],
            });
        }

        // Check for legal document structure
        if (this.hasLegalStructure(text)) {
            results.push({
                name: 'Legal Document',
                confidence: 0.6,
                characteristics: ['formal_language', 'citations', 'clauses'],
            });
        }

        return results;
    }

    /**
     * Check if document has invoice structure
     */
    private hasInvoiceStructure(text: string): boolean {
        const invoiceIndicators = [
            /invoice\s*#?\s*\d+/i,
            /total\s*amount/i,
            /due\s*date/i,
            /bill\s*to/i,
            /quantity|qty/i,
            /unit\s*price/i,
        ];

        let matches = 0;
        invoiceIndicators.forEach(pattern => {
            if (pattern.test(text)) matches++;
        });

        return matches >= 3;
    }

    /**
     * Check if document has contract structure
     */
    private hasContractStructure(text: string): boolean {
        const contractIndicators = [
            /whereas/i,
            /party\s+of\s+the\s+first\s+part/i,
            /party\s+of\s+the\s+second\s+part/i,
            /in\s+consideration\s+of/i,
            /hereby\s+agree/i,
            /terms\s+and\s+conditions/i,
            /signature/i,
        ];

        let matches = 0;
        contractIndicators.forEach(pattern => {
            if (pattern.test(text)) matches++;
        });

        return matches >= 3;
    }

    /**
     * Check if document has legal structure
     */
    private hasLegalStructure(text: string): boolean {
        const legalIndicators = [
            /pursuant\s+to/i,
            /heretofore/i,
            /hereinafter/i,
            /notwithstanding/i,
            /jurisdiction/i,
            /statute/i,
            /section\s+\d+/i,
        ];

        let matches = 0;
        legalIndicators.forEach(pattern => {
            if (pattern.test(text)) matches++;
        });

        return matches >= 2;
    }

    /**
     * Combine classification results from different methods
     */
    private combineClassificationResults(results: DocumentCategory[][]): DocumentCategory[] {
        const categoryMap = new Map<string, DocumentCategory>();

        // Combine results with weighted averaging
        results.forEach((resultSet, index) => {
            const weight = index === 0 ? 0.5 : 0.25; // Bayes gets higher weight

            resultSet.forEach(category => {
                if (categoryMap.has(category.name)) {
                    const existing = categoryMap.get(category.name)!;
                    existing.confidence = (existing.confidence + category.confidence * weight) / 2;
                    existing.characteristics = [
                        ...new Set([...existing.characteristics, ...category.characteristics])
                    ];
                } else {
                    categoryMap.set(category.name, {
                        ...category,
                        confidence: category.confidence * weight,
                    });
                }
            });
        });

        // Convert to array and sort by confidence
        return Array.from(categoryMap.values())
            .filter(category => category.confidence > 0.1)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5); // Top 5 categories
    }

    /**
     * Get characteristics for a category
     */
    private getCharacteristics(category: string, text: string): string[] {
        const categoryCharacteristics: Record<string, string[]> = {
            'Contract': ['legal_language', 'parties_defined', 'terms_specified'],
            'Invoice': ['billing_information', 'line_items', 'payment_terms'],
            'Legal Document': ['formal_structure', 'legal_citations', 'official_language'],
            'Employment Contract': ['job_description', 'compensation_details', 'employment_terms'],
            'Lease Agreement': ['property_details', 'rental_terms', 'tenant_obligations'],
            'Insurance Policy': ['coverage_details', 'premium_information', 'policy_terms'],
            'NDA': ['confidentiality_clauses', 'disclosure_restrictions', 'penalty_terms'],
        };

        return categoryCharacteristics[category] || ['general_document'];
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

    private async storeClassificationResult(
        result: DocumentClassificationResult,
        organizationId: string
    ): Promise<void> {
        await this.db.aiAnalysisResult.create({
            data: {
                id: `classification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                documentId: result.documentId,
                organizationId,
                analysisType: 'classification',
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