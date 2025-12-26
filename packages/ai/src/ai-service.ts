import { FieldDetectionService } from './field-detection';
import { DocumentClassificationService } from './document-classification';
import { RecipientSuggestionService } from './recipient-suggestion';
import { ContentAnalysisService } from './content-analysis';
import type {
    AIAnalysisResult,
    FieldDetectionResult,
    DocumentClassificationResult,
    RecipientSuggestion,
    ContentAnalysisResult,
} from './types';

/**
 * Main AI Service that orchestrates all AI-powered features
 */
export class AIService {
    private fieldDetection: FieldDetectionService;
    private documentClassification: DocumentClassificationService;
    private recipientSuggestion: RecipientSuggestionService;
    private contentAnalysis: ContentAnalysisService;

    constructor(
        private db: any,
        private storageService: any,
        private pdfService: any
    ) {
        this.fieldDetection = new FieldDetectionService(db, storageService, pdfService);
        this.documentClassification = new DocumentClassificationService(db, storageService);
        this.recipientSuggestion = new RecipientSuggestionService(db);
        this.contentAnalysis = new ContentAnalysisService(db, storageService);
    }

    /**
     * Perform comprehensive AI analysis on a document
     */
    async analyzeDocument(
        documentId: string,
        organizationId: string,
        options?: {
            includeFieldDetection?: boolean;
            includeClassification?: boolean;
            includeRecipientSuggestion?: boolean;
            includeContentAnalysis?: boolean;
        }
    ): Promise<{
        fieldDetection?: FieldDetectionResult;
        classification?: DocumentClassificationResult;
        recipientSuggestion?: RecipientSuggestion;
        contentAnalysis?: ContentAnalysisResult;
    }> {
        const results: any = {};
        const startTime = Date.now();

        try {
            // Run analyses in parallel for better performance
            const promises: Promise<any>[] = [];

            if (options?.includeFieldDetection !== false) {
                promises.push(
                    this.fieldDetection.detectFields(documentId, organizationId)
                        .then(result => ({ type: 'fieldDetection', result }))
                        .catch(error => ({ type: 'fieldDetection', error }))
                );
            }

            if (options?.includeClassification !== false) {
                promises.push(
                    this.documentClassification.classifyDocument(documentId, organizationId)
                        .then(result => ({ type: 'classification', result }))
                        .catch(error => ({ type: 'classification', error }))
                );
            }

            if (options?.includeRecipientSuggestion !== false) {
                promises.push(
                    this.recipientSuggestion.suggestRecipients(documentId, organizationId)
                        .then(result => ({ type: 'recipientSuggestion', result }))
                        .catch(error => ({ type: 'recipientSuggestion', error }))
                );
            }

            if (options?.includeContentAnalysis !== false) {
                promises.push(
                    this.contentAnalysis.analyzeContent(documentId, organizationId)
                        .then(result => ({ type: 'contentAnalysis', result }))
                        .catch(error => ({ type: 'contentAnalysis', error }))
                );
            }

            const analysisResults = await Promise.all(promises);

            // Process results
            for (const analysisResult of analysisResults) {
                if (analysisResult.error) {
                    console.error(`AI analysis failed for ${analysisResult.type}:`, analysisResult.error);
                } else {
                    results[analysisResult.type] = analysisResult.result;
                }
            }

            const totalProcessingTime = Date.now() - startTime;

            // Store comprehensive analysis result
            await this.storeAnalysisResult({
                id: `ai_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                documentId,
                organizationId,
                analysisType: 'comprehensive' as any,
                status: 'completed',
                result: results,
                confidence: this.calculateOverallConfidence(results),
                processingTime: totalProcessingTime,
                createdAt: new Date(),
                completedAt: new Date(),
            });

            return results;

        } catch (error) {
            console.error('Comprehensive AI analysis failed:', error);
            throw error;
        }
    }

    /**
     * Detect form fields automatically using computer vision
     */
    async detectFields(documentId: string, organizationId: string): Promise<FieldDetectionResult> {
        return this.fieldDetection.detectFields(documentId, organizationId);
    }

    /**
     * Classify document using machine learning models
     */
    async classifyDocument(documentId: string, organizationId: string): Promise<DocumentClassificationResult> {
        return this.documentClassification.classifyDocument(documentId, organizationId);
    }

    /**
     * Suggest recipients based on usage patterns and document content
     */
    async suggestRecipients(documentId: string, organizationId: string): Promise<RecipientSuggestion> {
        return this.recipientSuggestion.suggestRecipients(documentId, organizationId);
    }

    /**
     * Analyze document content using natural language processing
     */
    async analyzeContent(documentId: string, organizationId: string): Promise<ContentAnalysisResult> {
        return this.contentAnalysis.analyzeContent(documentId, organizationId);
    }

    /**
     * Get AI analysis history for a document
     */
    async getAnalysisHistory(
        documentId: string,
        organizationId: string,
        analysisType?: string
    ): Promise<AIAnalysisResult[]> {
        const whereClause: any = {
            documentId,
            organizationId,
        };

        if (analysisType) {
            whereClause.analysisType = analysisType;
        }

        const results = await this.db.aiAnalysisResult.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return results.map((result: any) => ({
            id: result.id,
            documentId: result.documentId,
            organizationId: result.organizationId,
            analysisType: result.analysisType,
            status: result.status,
            result: result.result ? JSON.parse(result.result) : undefined,
            confidence: result.confidence,
            processingTime: result.processingTime,
            error: result.error,
            createdAt: result.createdAt,
            completedAt: result.completedAt,
        }));
    }

    /**
     * Get AI insights and recommendations for an organization
     */
    async getAIInsights(
        organizationId: string,
        options?: {
            timeRange?: { start: Date; end: Date };
            analysisTypes?: string[];
            limit?: number;
        }
    ): Promise<Array<{
        type: string;
        title: string;
        description: string;
        confidence: number;
        impact: 'low' | 'medium' | 'high';
        recommendations: string[];
        data: any;
    }>> {
        const insights: any[] = [];

        // Get recent analysis results
        const whereClause: any = { organizationId };

        if (options?.timeRange) {
            whereClause.createdAt = {
                gte: options.timeRange.start,
                lte: options.timeRange.end,
            };
        }

        if (options?.analysisTypes && options.analysisTypes.length > 0) {
            whereClause.analysisType = {
                in: options.analysisTypes,
            };
        }

        const analysisResults = await this.db.aiAnalysisResult.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
        });

        // Analyze field detection patterns
        const fieldDetectionResults = analysisResults.filter((r: any) => r.analysisType === 'field_detection');
        if (fieldDetectionResults.length > 0) {
            const fieldInsights = this.analyzeFieldDetectionPatterns(fieldDetectionResults);
            insights.push(...fieldInsights);
        }

        // Analyze document classification patterns
        const classificationResults = analysisResults.filter((r: any) => r.analysisType === 'classification');
        if (classificationResults.length > 0) {
            const classificationInsights = this.analyzeClassificationPatterns(classificationResults);
            insights.push(...classificationInsights);
        }

        // Analyze content analysis patterns
        const contentResults = analysisResults.filter((r: any) => r.analysisType === 'content_analysis');
        if (contentResults.length > 0) {
            const contentInsights = this.analyzeContentPatterns(contentResults);
            insights.push(...contentInsights);
        }

        return insights.slice(0, options?.limit || 20);
    }

    // Private helper methods

    private calculateOverallConfidence(results: any): number {
        const confidenceValues: number[] = [];

        if (results.fieldDetection?.confidence) {
            confidenceValues.push(results.fieldDetection.confidence);
        }
        if (results.classification?.confidence) {
            confidenceValues.push(results.classification.confidence);
        }
        if (results.contentAnalysis?.metadata?.confidence) {
            confidenceValues.push(results.contentAnalysis.metadata.confidence);
        }

        if (confidenceValues.length === 0) return 0.5;

        return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    }

    private async storeAnalysisResult(result: AIAnalysisResult): Promise<void> {
        await this.db.aiAnalysisResult.create({
            data: {
                id: result.id,
                documentId: result.documentId,
                organizationId: result.organizationId,
                analysisType: result.analysisType,
                status: result.status,
                result: result.result ? JSON.stringify(result.result) : null,
                confidence: result.confidence,
                processingTime: result.processingTime,
                error: result.error,
                createdAt: result.createdAt,
                completedAt: result.completedAt,
            },
        });
    }

    private analyzeFieldDetectionPatterns(results: any[]): any[] {
        const insights: any[] = [];

        // Analyze field detection accuracy trends
        const accuracyTrend = results.map(r => ({
            date: r.createdAt,
            confidence: r.confidence,
        }));

        const avgConfidence = accuracyTrend.reduce((sum, item) => sum + item.confidence, 0) / accuracyTrend.length;

        if (avgConfidence < 0.7) {
            insights.push({
                type: 'field_detection_accuracy',
                title: 'Field Detection Accuracy Below Optimal',
                description: `Average field detection confidence is ${(avgConfidence * 100).toFixed(1)}%, which is below the recommended 70% threshold.`,
                confidence: 0.85,
                impact: 'medium' as const,
                recommendations: [
                    'Review document quality and ensure high-resolution scans',
                    'Consider manual field placement for critical documents',
                    'Update field detection models with organization-specific training data',
                ],
                data: { avgConfidence, trend: accuracyTrend },
            });
        }

        return insights;
    }

    private analyzeClassificationPatterns(results: any[]): any[] {
        const insights: any[] = [];

        // Analyze document type distribution
        const categoryDistribution: Record<string, number> = {};

        results.forEach(result => {
            if (result.result) {
                const parsed = JSON.parse(result.result);
                const category = parsed.primaryCategory;
                categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
            }
        });

        const totalDocs = results.length;
        const dominantCategory = Object.entries(categoryDistribution)
            .sort(([, a], [, b]) => b - a)[0];

        if (dominantCategory && dominantCategory[1] / totalDocs > 0.6) {
            insights.push({
                type: 'document_type_pattern',
                title: 'Document Type Concentration Detected',
                description: `${((dominantCategory[1] / totalDocs) * 100).toFixed(1)}% of documents are classified as "${dominantCategory[0]}".`,
                confidence: 0.90,
                impact: 'low' as const,
                recommendations: [
                    'Consider creating specialized templates for this document type',
                    'Optimize workflows for the most common document category',
                    'Review if document classification is meeting business needs',
                ],
                data: { categoryDistribution, dominantCategory: dominantCategory[0] },
            });
        }

        return insights;
    }

    private analyzeContentPatterns(results: any[]): any[] {
        const insights: any[] = [];

        // Analyze content complexity trends
        const complexityData = results
            .map(r => {
                if (r.result) {
                    const parsed = JSON.parse(r.result);
                    return {
                        date: r.createdAt,
                        complexity: parsed.textAnalysis?.complexity,
                        readabilityScore: parsed.textAnalysis?.readabilityScore,
                    };
                }
                return null;
            })
            .filter(Boolean);

        const complexDocs = complexityData.filter((d: any) =>
            d && (d.complexity === 'complex' || d.complexity === 'very_complex')
        ).length;

        const complexityRatio = complexDocs / complexityData.length;

        if (complexityRatio > 0.4) {
            insights.push({
                type: 'content_complexity',
                title: 'High Document Complexity Detected',
                description: `${(complexityRatio * 100).toFixed(1)}% of documents have high complexity, which may impact user experience.`,
                confidence: 0.80,
                impact: 'medium' as const,
                recommendations: [
                    'Consider simplifying document language where possible',
                    'Provide additional guidance for complex documents',
                    'Implement progressive disclosure for lengthy documents',
                ],
                data: { complexityRatio, complexDocs, totalDocs: complexityData.length },
            });
        }

        return insights;
    }
}