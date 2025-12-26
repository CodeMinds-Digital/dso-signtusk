// AI-Powered Features Package
// Comprehensive AI capabilities for document processing and analysis

export { AIService } from './ai-service';
export { FieldDetectionService } from './field-detection';
export { DocumentClassificationService } from './document-classification';
export { RecipientSuggestionService } from './recipient-suggestion';
export { ContentAnalysisService } from './content-analysis';

export type {
    AIAnalysisResult,
    FieldDetectionResult,
    DetectedField,
    DocumentClassificationResult,
    DocumentCategory,
    RecipientSuggestion,
    ContentAnalysisResult,
    TextAnalysis,
    LanguageDetection,
    SentimentAnalysis,
    EntityExtraction,
    KeywordExtraction,
} from './types';

export {
    AIAnalysisResultSchema,
    FieldDetectionResultSchema,
    DetectedFieldSchema,
    DocumentClassificationResultSchema,
    RecipientSuggestionSchema,
    ContentAnalysisResultSchema,
} from './types';