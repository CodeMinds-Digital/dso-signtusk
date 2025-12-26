import natural from 'natural';
import compromise from 'compromise';
import type {
    ContentAnalysisResult,
    TextAnalysis,
    LanguageDetection,
    SentimentAnalysis,
    EntityExtraction,
    KeywordExtraction,
    ContentInsight,
} from './types';
import { ContentAnalysisResultSchema } from './types';

/**
 * Content Analysis Service using natural language processing
 */
export class ContentAnalysisService {
    private sentimentAnalyzer: natural.SentimentAnalyzer;
    private stemmer = natural.PorterStemmer;
    private tfidf: natural.TfIdf;
    private wordTokenizer: natural.WordTokenizer;
    private sentenceTokenizer: natural.SentenceTokenizer;

    constructor(
        private db: any,
        private storageService: any
    ) {
        this.sentimentAnalyzer = new natural.SentimentAnalyzer(
            'English',
            natural.PorterStemmer,
            'afinn'
        );
        this.tfidf = new natural.TfIdf();
        this.wordTokenizer = new natural.WordTokenizer();
        this.sentenceTokenizer = new natural.SentenceTokenizer();
    }

    /**
     * Analyze document content using natural language processing
     */
    async analyzeContent(documentId: string, organizationId: string): Promise<ContentAnalysisResult> {
        const startTime = Date.now();

        try {
            // Get document content
            const document = await this.getDocument(documentId, organizationId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Extract text content
            const textContent = await this.extractTextContent(document);

            if (!textContent || textContent.trim().length === 0) {
                throw new Error('No text content found in document');
            }

            // Perform various analyses
            const textAnalysis = this.analyzeText(textContent);
            const languageDetection = this.detectLanguage(textContent);
            const sentimentAnalysis = this.analyzeSentiment(textContent);
            const entityExtraction = this.extractEntities(textContent);
            const keywordExtraction = this.extractKeywords(textContent);
            const insights = this.generateInsights(textContent, {
                textAnalysis,
                sentimentAnalysis,
                entityExtraction,
                keywordExtraction,
            });

            const processingTime = Date.now() - startTime;
            const overallConfidence = this.calculateOverallConfidence({
                languageDetection,
                sentimentAnalysis,
                entityExtraction,
                keywordExtraction,
            });

            const result: ContentAnalysisResult = {
                documentId,
                textAnalysis,
                languageDetection,
                sentimentAnalysis,
                entityExtraction,
                keywordExtraction,
                insights,
                processingTime,
                metadata: {
                    algorithm: 'nlp_content_analysis_v1',
                    version: '1.0.0',
                    textLength: textContent.length,
                    confidence: overallConfidence,
                },
            };

            // Validate result
            const validatedResult = ContentAnalysisResultSchema.parse(result);

            // Store result in database
            await this.storeContentAnalysisResult(validatedResult, organizationId);

            return validatedResult;

        } catch (error) {
            console.error('Content analysis failed:', error);
            throw error;
        }
    }

    /**
     * Analyze text structure and readability
     */
    private analyzeText(text: string): TextAnalysis {
        // Basic text statistics
        const words = this.wordTokenizer.tokenize(text) || [];
        const sentences = this.sentenceTokenizer.tokenize(text) || [];
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

        // Calculate readability score (Flesch Reading Ease)
        const readabilityScore = this.calculateReadabilityScore(text, words.length, sentences.length);

        // Determine complexity
        const complexity = this.determineComplexity(readabilityScore, words.length);

        // Estimate reading time (average 200 words per minute)
        const estimatedReadingTime = Math.ceil(words.length / 200);

        // Analyze structure
        const structure = this.analyzeStructure(text);

        return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            readabilityScore,
            complexity,
            estimatedReadingTime,
            structure,
        };
    }

    /**
     * Detect document language
     */
    private detectLanguage(text: string): LanguageDetection {
        // Simple language detection based on common words
        const languages = {
            'en': ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
            'es': ['el', 'la', 'y', 'o', 'pero', 'en', 'con', 'por', 'para', 'de', 'que', 'se'],
            'fr': ['le', 'la', 'et', 'ou', 'mais', 'dans', 'sur', 'à', 'pour', 'de', 'avec', 'par'],
            'de': ['der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'auf', 'zu', 'für', 'von', 'mit'],
        };

        const words = text.toLowerCase().split(/\s+/);
        const scores: Record<string, number> = {};

        Object.entries(languages).forEach(([lang, commonWords]) => {
            let matches = 0;
            commonWords.forEach(word => {
                matches += words.filter(w => w === word).length;
            });
            scores[lang] = matches / words.length;
        });

        const sortedLanguages = Object.entries(scores)
            .sort(([, a], [, b]) => b - a);

        const primaryLanguage = sortedLanguages[0][0];
        const confidence = sortedLanguages[0][1];

        const alternativeLanguages = sortedLanguages
            .slice(1, 3)
            .filter(([, score]) => score > 0.01)
            .map(([language, score]) => ({ language, confidence: score }));

        return {
            primaryLanguage,
            confidence: Math.min(confidence * 10, 1), // Scale up confidence
            alternativeLanguages: alternativeLanguages.length > 0 ? alternativeLanguages : undefined,
            isMultilingual: alternativeLanguages.length > 0 && alternativeLanguages[0].confidence > 0.1,
        };
    }

    /**
     * Analyze sentiment of the text
     */
    private analyzeSentiment(text: string): SentimentAnalysis {
        // Tokenize and analyze overall sentiment
        const tokens = this.wordTokenizer.tokenize(text.toLowerCase()) || [];
        const score = this.sentimentAnalyzer.getSentiment(tokens);

        // Determine sentiment category
        let sentiment: 'positive' | 'negative' | 'neutral';
        if (score > 0.1) {
            sentiment = 'positive';
        } else if (score < -0.1) {
            sentiment = 'negative';
        } else {
            sentiment = 'neutral';
        }

        // Analyze sections (paragraphs)
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const sections = paragraphs.map(paragraph => {
            const paragraphTokens = this.wordTokenizer.tokenize(paragraph.toLowerCase()) || [];
            const paragraphScore = this.sentimentAnalyzer.getSentiment(paragraphTokens);

            let paragraphSentiment: 'positive' | 'negative' | 'neutral';
            if (paragraphScore > 0.1) {
                paragraphSentiment = 'positive';
            } else if (paragraphScore < -0.1) {
                paragraphSentiment = 'negative';
            } else {
                paragraphSentiment = 'neutral';
            }

            return {
                text: paragraph.substring(0, 100) + (paragraph.length > 100 ? '...' : ''),
                sentiment: paragraphSentiment,
                score: paragraphScore,
                confidence: Math.abs(paragraphScore),
            };
        });

        return {
            overall: {
                sentiment,
                score,
                confidence: Math.abs(score),
            },
            sections: sections.length > 1 ? sections : undefined,
        };
    }

    /**
     * Extract entities from text
     */
    private extractEntities(text: string): EntityExtraction {
        const doc = compromise(text);

        // Extract persons
        const persons = doc.people().out('array').map((name: string) => ({
            name,
            confidence: 0.8,
            context: this.getEntityContext(name, text),
            type: 'individual' as const,
        }));

        // Extract organizations
        const organizations = doc.organizations().out('array').map((name: string) => ({
            name,
            confidence: 0.7,
            context: this.getEntityContext(name, text),
            type: 'company' as const,
        }));

        // Extract places
        const locations = doc.places().out('array').map((name: string) => ({
            name,
            confidence: 0.7,
            context: this.getEntityContext(name, text),
            type: 'city' as const,
        }));

        // Extract dates
        const dates = this.extractDates(text);

        // Extract amounts
        const amounts = this.extractAmounts(text);

        // Extract custom entities
        const custom = this.extractCustomEntities(text);

        return {
            persons,
            organizations,
            locations,
            dates,
            amounts,
            custom,
        };
    }

    /**
     * Extract keywords and phrases
     */
    private extractKeywords(text: string): KeywordExtraction {
        // Add document to TF-IDF
        this.tfidf.addDocument(text);

        // Get TF-IDF scores
        const tfidfScores: Array<{ term: string; tfidf: number }> = [];
        this.tfidf.listTerms(0).forEach((item: any) => {
            tfidfScores.push({ term: item.term, tfidf: item.tfidf });
        });

        // Extract keywords
        const keywords = tfidfScores
            .filter(item => item.term.length > 2)
            .slice(0, 20)
            .map(item => ({
                term: item.term,
                frequency: this.countOccurrences(text, item.term),
                importance: item.tfidf,
                category: this.categorizeKeyword(item.term),
            }));

        // Extract phrases using n-grams
        const phrases = this.extractPhrases(text);

        // Extract topics using keyword clustering
        const topics = this.extractTopics(keywords);

        return {
            keywords,
            phrases,
            topics,
        };
    }

    /**
     * Generate content insights
     */
    private generateInsights(
        text: string,
        analyses: {
            textAnalysis: TextAnalysis;
            sentimentAnalysis: SentimentAnalysis;
            entityExtraction: EntityExtraction;
            keywordExtraction: KeywordExtraction;
        }
    ): ContentInsight[] {
        const insights: ContentInsight[] = [];

        // Urgency insights
        const urgencyKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'expires', 'due'];
        const urgencyCount = urgencyKeywords.reduce((count, keyword) =>
            count + this.countOccurrences(text.toLowerCase(), keyword), 0
        );

        if (urgencyCount > 0) {
            insights.push({
                type: 'urgency',
                title: 'Urgent Content Detected',
                description: `Document contains ${urgencyCount} urgency indicators`,
                confidence: Math.min(urgencyCount / 3, 1),
                impact: urgencyCount > 2 ? 'high' : 'medium',
                actionable: true,
                suggestions: [
                    'Prioritize this document for immediate attention',
                    'Set up automated reminders for deadlines',
                    'Notify relevant parties about urgency',
                ],
            });
        }

        // Complexity insights
        if (analyses.textAnalysis.complexity === 'very_complex' || analyses.textAnalysis.complexity === 'complex') {
            insights.push({
                type: 'complexity',
                title: 'High Document Complexity',
                description: `Document has ${analyses.textAnalysis.complexity} readability (score: ${analyses.textAnalysis.readabilityScore.toFixed(1)})`,
                confidence: 0.9,
                impact: 'medium',
                actionable: true,
                suggestions: [
                    'Consider simplifying language for better understanding',
                    'Add explanatory notes for complex terms',
                    'Provide additional context or glossary',
                ],
            });
        }

        // Legal terms insights
        const legalTerms = ['contract', 'agreement', 'liability', 'indemnify', 'whereas', 'heretofore', 'jurisdiction'];
        const legalTermCount = legalTerms.reduce((count, term) =>
            count + this.countOccurrences(text.toLowerCase(), term), 0
        );

        if (legalTermCount > 3) {
            insights.push({
                type: 'legal_terms',
                title: 'Legal Document Detected',
                description: `Document contains ${legalTermCount} legal terms`,
                confidence: Math.min(legalTermCount / 5, 1),
                impact: 'high',
                actionable: true,
                suggestions: [
                    'Consider legal review before signing',
                    'Ensure all parties understand legal implications',
                    'Verify compliance with applicable laws',
                ],
            });
        }

        // Missing information insights
        const missingInfoIndicators = ['tbd', 'to be determined', '___', '[blank]', 'fill in'];
        const missingInfoCount = missingInfoIndicators.reduce((count, indicator) =>
            count + this.countOccurrences(text.toLowerCase(), indicator), 0
        );

        if (missingInfoCount > 0) {
            insights.push({
                type: 'missing_info',
                title: 'Incomplete Information Detected',
                description: `Document has ${missingInfoCount} placeholders or missing information`,
                confidence: 0.95,
                impact: 'high',
                actionable: true,
                suggestions: [
                    'Complete all required information before sending',
                    'Review document for accuracy and completeness',
                    'Verify all placeholders are filled',
                ],
            });
        }

        // Sentiment-based insights
        if (analyses.sentimentAnalysis.overall.sentiment === 'negative' &&
            analyses.sentimentAnalysis.overall.confidence > 0.6) {
            insights.push({
                type: 'recommendation',
                title: 'Negative Tone Detected',
                description: 'Document has a negative sentiment that may affect recipient response',
                confidence: analyses.sentimentAnalysis.overall.confidence,
                impact: 'medium',
                actionable: true,
                suggestions: [
                    'Consider revising language to be more neutral or positive',
                    'Add explanatory context for negative aspects',
                    'Ensure professional and respectful tone throughout',
                ],
            });
        }

        return insights;
    }

    // Helper methods

    private calculateReadabilityScore(text: string, wordCount: number, sentenceCount: number): number {
        if (sentenceCount === 0) return 0;

        // Simplified Flesch Reading Ease formula
        const avgWordsPerSentence = wordCount / sentenceCount;
        const avgSyllablesPerWord = this.estimateAverageSyllables(text);

        return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    }

    private estimateAverageSyllables(text: string): number {
        const words = this.wordTokenizer.tokenize(text) || [];
        if (words.length === 0) return 1;

        const totalSyllables = words.reduce((total: number, word: string) => {
            return total + this.countSyllables(word);
        }, 0);

        return totalSyllables / words.length;
    }

    private countSyllables(word: string): number {
        // Simple syllable counting
        const vowels = 'aeiouy';
        let count = 0;
        let previousWasVowel = false;

        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i].toLowerCase());
            if (isVowel && !previousWasVowel) {
                count++;
            }
            previousWasVowel = isVowel;
        }

        // Handle silent e
        if (word.endsWith('e') && count > 1) {
            count--;
        }

        return Math.max(1, count);
    }

    private determineComplexity(readabilityScore: number, wordCount: number): 'simple' | 'moderate' | 'complex' | 'very_complex' {
        if (readabilityScore >= 80 && wordCount < 500) return 'simple';
        if (readabilityScore >= 60 && wordCount < 1000) return 'moderate';
        if (readabilityScore >= 30 || wordCount < 2000) return 'complex';
        return 'very_complex';
    }

    private analyzeStructure(text: string): TextAnalysis['structure'] {
        const hasHeaders = /^#+\s/.test(text) || /^[A-Z][A-Z\s]+$/m.test(text);
        const hasBulletPoints = /^\s*[•\-\*]\s/m.test(text);
        const hasNumberedLists = /^\s*\d+\.\s/m.test(text);
        const hasTable = /\|.*\|/.test(text) || /\t.*\t/.test(text);

        // Extract sections
        const sections: Array<{
            title?: string;
            type: 'header' | 'paragraph' | 'list' | 'table';
            wordCount: number;
        }> = [];

        const paragraphs = text.split(/\n\s*\n/);

        paragraphs.forEach(paragraph => {
            const trimmed = paragraph.trim();
            if (trimmed.length === 0) return;

            const words = this.wordTokenizer.tokenize(trimmed) || [];

            if (/^#+\s/.test(trimmed) || /^[A-Z][A-Z\s]+$/.test(trimmed)) {
                sections.push({
                    title: trimmed.replace(/^#+\s/, ''),
                    type: 'header',
                    wordCount: words.length,
                });
            } else if (/^\s*[•\-\*\d+\.]\s/m.test(trimmed)) {
                sections.push({
                    type: 'list',
                    wordCount: words.length,
                });
            } else if (/\|.*\|/.test(trimmed)) {
                sections.push({
                    type: 'table',
                    wordCount: words.length,
                });
            } else {
                sections.push({
                    type: 'paragraph',
                    wordCount: words.length,
                });
            }
        });

        return {
            hasHeaders,
            hasBulletPoints,
            hasNumberedLists,
            hasTable,
            sections,
        };
    }

    private getEntityContext(entity: string, text: string): string {
        const index = text.toLowerCase().indexOf(entity.toLowerCase());
        if (index === -1) return '';

        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + entity.length + 50);

        return text.substring(start, end);
    }

    private extractDates(text: string): EntityExtraction['dates'] {
        const datePatterns = [
            /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
            /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
            /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
        ];

        const dates: EntityExtraction['dates'] = [];

        datePatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => {
                dates.push({
                    date: match,
                    confidence: 0.9,
                    context: this.getEntityContext(match, text),
                    type: this.classifyDateType(match, text),
                });
            });
        });

        return dates;
    }

    private extractAmounts(text: string): EntityExtraction['amounts'] {
        const amountPatterns = [
            /\$[\d,]+\.?\d*/g,
            /\b\d+\.\d{2}\s*(dollars?|USD|usd)\b/gi,
            /\b(USD|usd)\s*\d+\.?\d*/gi,
        ];

        const amounts: EntityExtraction['amounts'] = [];

        amountPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => {
                amounts.push({
                    amount: match,
                    confidence: 0.85,
                    context: this.getEntityContext(match, text),
                    currency: 'USD',
                    type: this.classifyAmountType(match, text),
                });
            });
        });

        return amounts;
    }

    private extractCustomEntities(text: string): EntityExtraction['custom'] {
        const custom: EntityExtraction['custom'] = [];

        // Extract email addresses
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailPattern) || [];

        emails.forEach(email => {
            custom.push({
                type: 'email',
                value: email,
                confidence: 0.95,
                context: this.getEntityContext(email, text),
            });
        });

        // Extract phone numbers
        const phonePattern = /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b/g;
        const phones = text.match(phonePattern) || [];

        phones.forEach(phone => {
            custom.push({
                type: 'phone',
                value: phone,
                confidence: 0.9,
                context: this.getEntityContext(phone, text),
            });
        });

        return custom;
    }

    private classifyDateType(date: string, text: string): 'deadline' | 'effective_date' | 'expiration' | undefined {
        const context = this.getEntityContext(date, text).toLowerCase();

        if (context.includes('deadline') || context.includes('due')) return 'deadline';
        if (context.includes('effective') || context.includes('start')) return 'effective_date';
        if (context.includes('expir') || context.includes('end')) return 'expiration';

        return undefined;
    }

    private classifyAmountType(amount: string, text: string): 'payment' | 'fee' | 'penalty' | undefined {
        const context = this.getEntityContext(amount, text).toLowerCase();

        if (context.includes('payment') || context.includes('pay')) return 'payment';
        if (context.includes('fee') || context.includes('charge')) return 'fee';
        if (context.includes('penalty') || context.includes('fine')) return 'penalty';

        return undefined;
    }

    private extractPhrases(text: string): KeywordExtraction['phrases'] {
        // Extract 2-3 word phrases using n-grams
        const words = this.wordTokenizer.tokenize(text.toLowerCase()) || [];
        const phrases: Record<string, number> = {};

        // 2-grams
        for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`;
            if (phrase.length > 5) { // Filter out very short phrases
                phrases[phrase] = (phrases[phrase] || 0) + 1;
            }
        }

        // 3-grams
        for (let i = 0; i < words.length - 2; i++) {
            const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
            if (phrase.length > 8) { // Filter out very short phrases
                phrases[phrase] = (phrases[phrase] || 0) + 1;
            }
        }

        return Object.entries(phrases)
            .filter(([, frequency]) => frequency > 1)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([phrase, frequency]) => ({
                phrase,
                frequency,
                importance: frequency / words.length,
                category: this.categorizePhrase(phrase),
            }));
    }

    private extractTopics(keywords: KeywordExtraction['keywords']): KeywordExtraction['topics'] {
        // Simple topic extraction by grouping related keywords
        const topicGroups: Record<string, string[]> = {
            'Legal': [],
            'Financial': [],
            'Business': [],
            'Personal': [],
            'Technical': [],
        };

        const categoryKeywords = {
            'Legal': ['contract', 'agreement', 'legal', 'law', 'court', 'liability'],
            'Financial': ['payment', 'money', 'cost', 'price', 'fee', 'invoice'],
            'Business': ['company', 'business', 'service', 'client', 'customer', 'project'],
            'Personal': ['name', 'address', 'phone', 'email', 'personal', 'individual'],
            'Technical': ['system', 'software', 'technical', 'specification', 'requirement'],
        };

        keywords.forEach(keyword => {
            Object.entries(categoryKeywords).forEach(([topic, topicKeywords]) => {
                if (topicKeywords.some(tk => keyword.term.includes(tk) || tk.includes(keyword.term))) {
                    topicGroups[topic].push(keyword.term);
                }
            });
        });

        return Object.entries(topicGroups)
            .filter(([, keywords]) => keywords.length > 0)
            .map(([topic, topicKeywords]) => ({
                topic,
                relevance: topicKeywords.length / keywords.length,
                keywords: topicKeywords,
            }))
            .sort((a, b) => b.relevance - a.relevance);
    }

    private categorizeKeyword(keyword: string): string | undefined {
        const categories = {
            'legal': ['contract', 'agreement', 'legal', 'law', 'court'],
            'financial': ['payment', 'money', 'cost', 'price', 'fee'],
            'business': ['company', 'business', 'service', 'client'],
            'personal': ['name', 'address', 'phone', 'email'],
            'temporal': ['date', 'time', 'deadline', 'schedule'],
        };

        for (const [category, words] of Object.entries(categories)) {
            if (words.some(word => keyword.includes(word) || word.includes(keyword))) {
                return category;
            }
        }

        return undefined;
    }

    private categorizePhrase(phrase: string): string | undefined {
        return this.categorizeKeyword(phrase);
    }

    private countOccurrences(text: string, term: string): number {
        const regex = new RegExp(term, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }

    private calculateOverallConfidence(analyses: {
        languageDetection: LanguageDetection;
        sentimentAnalysis: SentimentAnalysis;
        entityExtraction: EntityExtraction;
        keywordExtraction: KeywordExtraction;
    }): number {
        const confidenceValues = [
            analyses.languageDetection.confidence,
            analyses.sentimentAnalysis.overall.confidence,
        ];

        // Add entity extraction confidence (average of all entities)
        const allEntities = [
            ...analyses.entityExtraction.persons,
            ...analyses.entityExtraction.organizations,
            ...analyses.entityExtraction.locations,
            ...analyses.entityExtraction.dates,
            ...analyses.entityExtraction.amounts,
            ...analyses.entityExtraction.custom,
        ];

        if (allEntities.length > 0) {
            const entityConfidence = allEntities.reduce((sum, entity) => sum + entity.confidence, 0) / allEntities.length;
            confidenceValues.push(entityConfidence);
        }

        return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    }

    private async extractTextContent(document: any): Promise<string> {
        // Mock implementation - would extract actual text from document
        return `This is a sample contract agreement between the parties. The effective date is January 1, 2024. 
        Payment of $1,000 is due within 30 days. Please contact john.doe@example.com for any questions. 
        This agreement is legally binding and subject to the jurisdiction of California courts.`;
    }

    private async getDocument(documentId: string, organizationId: string): Promise<any> {
        return this.db.document.findFirst({
            where: {
                id: documentId,
                organizationId,
            },
        });
    }

    private async storeContentAnalysisResult(
        result: ContentAnalysisResult,
        organizationId: string
    ): Promise<void> {
        await this.db.aiAnalysisResult.create({
            data: {
                id: `content_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                documentId: result.documentId,
                organizationId,
                analysisType: 'content_analysis',
                status: 'completed',
                result: JSON.stringify(result),
                confidence: result.metadata.confidence,
                processingTime: result.processingTime,
                createdAt: new Date(),
                completedAt: new Date(),
            },
        });
    }
}