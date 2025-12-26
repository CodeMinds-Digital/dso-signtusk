import { z } from 'zod';

// ============================================================================
// AI ANALYSIS TYPES
// ============================================================================

export interface AIAnalysisResult {
    id: string;
    documentId: string;
    organizationId: string;
    analysisType: 'field_detection' | 'classification' | 'content_analysis' | 'recipient_suggestion';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    confidence: number;
    processingTime: number;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

// ============================================================================
// FIELD DETECTION TYPES
// ============================================================================

export interface FieldDetectionResult {
    documentId: string;
    fields: DetectedField[];
    confidence: number;
    processingTime: number;
    metadata: {
        algorithm: string;
        version: string;
        pageCount: number;
        imageResolution?: { width: number; height: number };
    };
}

export interface DetectedField {
    id: string;
    type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox' | 'radio' | 'dropdown';
    label?: string;
    coordinates: {
        x: number;
        y: number;
        width: number;
        height: number;
        page: number;
    };
    confidence: number;
    suggestedProperties?: {
        required?: boolean;
        placeholder?: string;
        validation?: string;
        options?: string[]; // for dropdown/radio
    };
    context?: {
        surroundingText: string;
        semanticMeaning: string;
    };
}

// ============================================================================
// DOCUMENT CLASSIFICATION TYPES
// ============================================================================

export interface DocumentClassificationResult {
    documentId: string;
    categories: DocumentCategory[];
    primaryCategory: string;
    confidence: number;
    processingTime: number;
    metadata: {
        algorithm: string;
        version: string;
        features: string[];
        textLength: number;
    };
}

export interface DocumentCategory {
    name: string;
    confidence: number;
    subcategories?: Array<{
        name: string;
        confidence: number;
    }>;
    characteristics: string[];
}

// ============================================================================
// RECIPIENT SUGGESTION TYPES
// ============================================================================

export interface RecipientSuggestion {
    documentId: string;
    suggestions: Array<{
        email: string;
        name?: string;
        role: 'signer' | 'approver' | 'reviewer' | 'cc';
        confidence: number;
        reasoning: string;
        source: 'document_content' | 'historical_data' | 'organization_directory' | 'email_patterns';
        metadata?: {
            frequency?: number;
            lastUsed?: Date;
            relationship?: string;
        };
    }>;
    processingTime: number;
    metadata: {
        algorithm: string;
        version: string;
        analysisDepth: 'basic' | 'advanced' | 'comprehensive';
    };
}

// ============================================================================
// CONTENT ANALYSIS TYPES
// ============================================================================

export interface ContentAnalysisResult {
    documentId: string;
    textAnalysis: TextAnalysis;
    languageDetection: LanguageDetection;
    sentimentAnalysis: SentimentAnalysis;
    entityExtraction: EntityExtraction;
    keywordExtraction: KeywordExtraction;
    insights: ContentInsight[];
    processingTime: number;
    metadata: {
        algorithm: string;
        version: string;
        textLength: number;
        confidence: number;
    };
}

export interface TextAnalysis {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    readabilityScore: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    estimatedReadingTime: number; // in minutes
    structure: {
        hasHeaders: boolean;
        hasBulletPoints: boolean;
        hasNumberedLists: boolean;
        hasTable: boolean;
        sections: Array<{
            title?: string;
            type: 'header' | 'paragraph' | 'list' | 'table';
            wordCount: number;
        }>;
    };
}

export interface LanguageDetection {
    primaryLanguage: string;
    confidence: number;
    alternativeLanguages?: Array<{
        language: string;
        confidence: number;
    }>;
    isMultilingual: boolean;
}

export interface SentimentAnalysis {
    overall: {
        sentiment: 'positive' | 'negative' | 'neutral';
        score: number; // -1 to 1
        confidence: number;
    };
    sections?: Array<{
        text: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        score: number;
        confidence: number;
    }>;
}

export interface EntityExtraction {
    persons: Array<{
        name: string;
        confidence: number;
        context: string;
        type?: 'individual' | 'organization_member';
    }>;
    organizations: Array<{
        name: string;
        confidence: number;
        context: string;
        type?: 'company' | 'government' | 'nonprofit';
    }>;
    locations: Array<{
        name: string;
        confidence: number;
        context: string;
        type?: 'city' | 'state' | 'country' | 'address';
    }>;
    dates: Array<{
        date: string;
        confidence: number;
        context: string;
        type?: 'deadline' | 'effective_date' | 'expiration';
    }>;
    amounts: Array<{
        amount: string;
        confidence: number;
        context: string;
        currency?: string;
        type?: 'payment' | 'fee' | 'penalty';
    }>;
    custom: Array<{
        type: string;
        value: string;
        confidence: number;
        context: string;
    }>;
}

export interface KeywordExtraction {
    keywords: Array<{
        term: string;
        frequency: number;
        importance: number;
        category?: string;
    }>;
    phrases: Array<{
        phrase: string;
        frequency: number;
        importance: number;
        category?: string;
    }>;
    topics: Array<{
        topic: string;
        relevance: number;
        keywords: string[];
    }>;
}

export interface ContentInsight {
    type: 'urgency' | 'complexity' | 'legal_terms' | 'missing_info' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    suggestions?: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const DetectedFieldSchema = z.object({
    id: z.string(),
    type: z.enum(['signature', 'initial', 'date', 'text', 'checkbox', 'radio', 'dropdown']),
    label: z.string().optional(),
    coordinates: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        page: z.number(),
    }),
    confidence: z.number().min(0).max(1),
    suggestedProperties: z.object({
        required: z.boolean().optional(),
        placeholder: z.string().optional(),
        validation: z.string().optional(),
        options: z.array(z.string()).optional(),
    }).optional(),
    context: z.object({
        surroundingText: z.string(),
        semanticMeaning: z.string(),
    }).optional(),
});

export const FieldDetectionResultSchema = z.object({
    documentId: z.string(),
    fields: z.array(DetectedFieldSchema),
    confidence: z.number().min(0).max(1),
    processingTime: z.number(),
    metadata: z.object({
        algorithm: z.string(),
        version: z.string(),
        pageCount: z.number(),
        imageResolution: z.object({
            width: z.number(),
            height: z.number(),
        }).optional(),
    }),
});

export const DocumentClassificationResultSchema = z.object({
    documentId: z.string(),
    categories: z.array(z.object({
        name: z.string(),
        confidence: z.number().min(0).max(1),
        subcategories: z.array(z.object({
            name: z.string(),
            confidence: z.number().min(0).max(1),
        })).optional(),
        characteristics: z.array(z.string()),
    })),
    primaryCategory: z.string(),
    confidence: z.number().min(0).max(1),
    processingTime: z.number(),
    metadata: z.object({
        algorithm: z.string(),
        version: z.string(),
        features: z.array(z.string()),
        textLength: z.number(),
    }),
});

export const RecipientSuggestionSchema = z.object({
    documentId: z.string(),
    suggestions: z.array(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        role: z.enum(['signer', 'approver', 'reviewer', 'cc']),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
        source: z.enum(['document_content', 'historical_data', 'organization_directory', 'email_patterns']),
        metadata: z.object({
            frequency: z.number().optional(),
            lastUsed: z.date().optional(),
            relationship: z.string().optional(),
        }).optional(),
    })),
    processingTime: z.number(),
    metadata: z.object({
        algorithm: z.string(),
        version: z.string(),
        analysisDepth: z.enum(['basic', 'advanced', 'comprehensive']),
    }),
});

export const ContentAnalysisResultSchema = z.object({
    documentId: z.string(),
    textAnalysis: z.object({
        wordCount: z.number(),
        sentenceCount: z.number(),
        paragraphCount: z.number(),
        readabilityScore: z.number(),
        complexity: z.enum(['simple', 'moderate', 'complex', 'very_complex']),
        estimatedReadingTime: z.number(),
        structure: z.object({
            hasHeaders: z.boolean(),
            hasBulletPoints: z.boolean(),
            hasNumberedLists: z.boolean(),
            hasTable: z.boolean(),
            sections: z.array(z.object({
                title: z.string().optional(),
                type: z.enum(['header', 'paragraph', 'list', 'table']),
                wordCount: z.number(),
            })),
        }),
    }),
    languageDetection: z.object({
        primaryLanguage: z.string(),
        confidence: z.number().min(0).max(1),
        alternativeLanguages: z.array(z.object({
            language: z.string(),
            confidence: z.number().min(0).max(1),
        })).optional(),
        isMultilingual: z.boolean(),
    }),
    sentimentAnalysis: z.object({
        overall: z.object({
            sentiment: z.enum(['positive', 'negative', 'neutral']),
            score: z.number().min(-1).max(1),
            confidence: z.number().min(0).max(1),
        }),
        sections: z.array(z.object({
            text: z.string(),
            sentiment: z.enum(['positive', 'negative', 'neutral']),
            score: z.number().min(-1).max(1),
            confidence: z.number().min(0).max(1),
        })).optional(),
    }),
    entityExtraction: z.object({
        persons: z.array(z.object({
            name: z.string(),
            confidence: z.number().min(0).max(1),
            context: z.string(),
            type: z.enum(['individual', 'organization_member']).optional(),
        })),
        organizations: z.array(z.object({
            name: z.string(),
            confidence: z.number().min(0).max(1),
            context: z.string(),
            type: z.enum(['company', 'government', 'nonprofit']).optional(),
        })),
        locations: z.array(z.object({
            name: z.string(),
            confidence: z.number().min(0).max(1),
            context: z.string(),
            type: z.enum(['city', 'state', 'country', 'address']).optional(),
        })),
        dates: z.array(z.object({
            date: z.string(),
            confidence: z.number().min(0).max(1),
            context: z.string(),
            type: z.enum(['deadline', 'effective_date', 'expiration']).optional(),
        })),
        amounts: z.array(z.object({
            amount: z.string(),
            confidence: z.number().min(0).max(1),
            context: z.string(),
            currency: z.string().optional(),
            type: z.enum(['payment', 'fee', 'penalty']).optional(),
        })),
        custom: z.array(z.object({
            type: z.string(),
            value: z.string(),
            confidence: z.number().min(0).max(1),
            context: z.string(),
        })),
    }),
    keywordExtraction: z.object({
        keywords: z.array(z.object({
            term: z.string(),
            frequency: z.number(),
            importance: z.number(),
            category: z.string().optional(),
        })),
        phrases: z.array(z.object({
            phrase: z.string(),
            frequency: z.number(),
            importance: z.number(),
            category: z.string().optional(),
        })),
        topics: z.array(z.object({
            topic: z.string(),
            relevance: z.number(),
            keywords: z.array(z.string()),
        })),
    }),
    insights: z.array(z.object({
        type: z.enum(['urgency', 'complexity', 'legal_terms', 'missing_info', 'recommendation']),
        title: z.string(),
        description: z.string(),
        confidence: z.number().min(0).max(1),
        impact: z.enum(['low', 'medium', 'high']),
        actionable: z.boolean(),
        suggestions: z.array(z.string()).optional(),
    })),
    processingTime: z.number(),
    metadata: z.object({
        algorithm: z.string(),
        version: z.string(),
        textLength: z.number(),
        confidence: z.number().min(0).max(1),
    }),
});

export const AIAnalysisResultSchema = z.object({
    id: z.string(),
    documentId: z.string(),
    organizationId: z.string(),
    analysisType: z.enum(['field_detection', 'classification', 'content_analysis', 'recipient_suggestion']),
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    result: z.any().optional(),
    confidence: z.number().min(0).max(1),
    processingTime: z.number(),
    error: z.string().optional(),
    createdAt: z.date(),
    completedAt: z.date().optional(),
});