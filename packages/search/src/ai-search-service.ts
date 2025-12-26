import pino from 'pino';
import {
    SearchQuery,
    SearchResult,
    SearchSuggestion,
    SearchPersonalizationProfile,
    SearchDocument,
    SearchEntityType,
    AISearchFeatures
} from './types';

const logger = pino({ name: 'ai-search-service' });

// Optional imports with fallbacks
let natural: any;
let compromise: any;
let Fuse: any;

try {
    natural = require('natural');
} catch (e) {
    logger.warn('Natural library not available, using fallback implementations');
    natural = {
        PorterStemmer: { stem: (word: string) => word.toLowerCase() },
        WordTokenizer: function () {
            return { tokenize: (text: string) => text.toLowerCase().split(/\s+/) };
        },
        Spellcheck: function () {
            return { getCorrections: (word: string) => [word] };
        }
    };
}

try {
    compromise = require('compromise');
} catch (e) {
    logger.warn('Compromise library not available, using fallback implementations');
    compromise = (text: string) => ({
        people: () => ({ out: () => [] }),
        dates: () => ({ out: () => [] })
    });
}

try {
    Fuse = require('fuse.js').default || require('fuse.js');
} catch (e) {
    logger.warn('Fuse.js library not available, using fallback implementations');
    Fuse = class {
        constructor() { }
        search() { return []; }
    };
}

export interface AISearchConfig {
    features: AISearchFeatures;
    semanticSearch: {
        enabled: boolean;
        embeddingModel: string;
        similarityThreshold: number;
    };
    intentRecognition: {
        enabled: boolean;
        confidenceThreshold: number;
    };
    queryExpansion: {
        enabled: boolean;
        synonyms: Record<string, string[]>;
        maxExpansions: number;
    };
    personalizedRanking: {
        enabled: boolean;
        userWeightFactor: number;
        recencyWeightFactor: number;
        popularityWeightFactor: number;
    };
    autoComplete: {
        enabled: boolean;
        maxSuggestions: number;
        minQueryLength: number;
    };
    spellCorrection: {
        enabled: boolean;
        maxDistance: number;
        suggestions: number;
    };
}

export interface SearchIntent {
    type: 'find_document' | 'find_template' | 'find_user' | 'find_recent' | 'find_by_author' | 'find_by_type' | 'unknown';
    confidence: number;
    entities: Array<{
        type: 'document_type' | 'person' | 'date' | 'organization' | 'tag';
        value: string;
        confidence: number;
    }>;
    parameters: Record<string, any>;
}

export class AISearchService {
    private config: AISearchConfig;
    private stemmer: any;
    private tokenizer: any;
    private spellChecker: any;
    private synonymDict: Record<string, string[]> = {};

    constructor(config: Partial<AISearchConfig> = {}) {
        this.config = {
            features: {
                semanticSearch: true,
                intentRecognition: true,
                queryExpansion: true,
                personalizedRanking: true,
                autoComplete: true,
                spellCorrection: true
            },
            semanticSearch: {
                enabled: true,
                embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
                similarityThreshold: 0.7
            },
            intentRecognition: {
                enabled: true,
                confidenceThreshold: 0.6
            },
            queryExpansion: {
                enabled: true,
                synonyms: this.getDefaultSynonyms(),
                maxExpansions: 5
            },
            personalizedRanking: {
                enabled: true,
                userWeightFactor: 0.3,
                recencyWeightFactor: 0.2,
                popularityWeightFactor: 0.1
            },
            autoComplete: {
                enabled: true,
                maxSuggestions: 10,
                minQueryLength: 2
            },
            spellCorrection: {
                enabled: true,
                maxDistance: 2,
                suggestions: 5
            },
            ...config
        };

        this.initializeNLP();
    }

    /**
     * Initialize NLP components
     */
    private initializeNLP(): void {
        this.stemmer = natural.PorterStemmer;
        this.tokenizer = new natural.WordTokenizer();
        this.spellChecker = new natural.Spellcheck(['english']);
        this.synonymDict = this.config.queryExpansion.synonyms;
    }

    /**
     * Enhance search query with AI features
     */
    async enhanceQuery(
        query: SearchQuery,
        personalizationProfile?: SearchPersonalizationProfile
    ): Promise<SearchQuery> {
        try {
            let enhancedQuery = { ...query };

            // Intent recognition
            if (this.config.features.intentRecognition && query.query) {
                const intent = await this.recognizeIntent(query.query);
                enhancedQuery = this.applyIntentToQuery(enhancedQuery, intent);
            }

            // Query expansion
            if (this.config.features.queryExpansion && query.query) {
                enhancedQuery.query = await this.expandQuery(query.query);
            }

            // Spell correction
            if (this.config.features.spellCorrection && query.query) {
                enhancedQuery.query = await this.correctSpelling(query.query);
            }

            // Personalization
            if (this.config.features.personalizedRanking && personalizationProfile) {
                enhancedQuery = this.applyPersonalization(enhancedQuery, personalizationProfile);
            }

            logger.debug({ original: query.query, enhanced: enhancedQuery.query }, 'Query enhanced');
            return enhancedQuery;
        } catch (error) {
            logger.error({ error }, 'Failed to enhance query');
            return query;
        }
    }

    /**
     * Enhance search results with AI-powered ranking and suggestions
     */
    async enhanceResults(
        results: SearchResult,
        query: SearchQuery,
        personalizationProfile?: SearchPersonalizationProfile
    ): Promise<SearchResult> {
        try {
            let enhancedResults = { ...results };

            // Personalized ranking
            if (this.config.features.personalizedRanking && personalizationProfile) {
                enhancedResults.documents = await this.personalizeRanking(
                    results.documents,
                    query,
                    personalizationProfile
                );
            }

            // Semantic search enhancement
            if (this.config.features.semanticSearch && query.query) {
                enhancedResults.documents = await this.enhanceSemanticRelevance(
                    enhancedResults.documents,
                    query.query
                );
            }

            // Generate AI suggestions
            enhancedResults.suggestions = await this.generateSuggestions(
                query,
                results,
                personalizationProfile
            );

            return enhancedResults;
        } catch (error) {
            logger.error({ error }, 'Failed to enhance results');
            return results;
        }
    }

    /**
     * Recognize search intent from query text
     */
    async recognizeIntent(queryText: string): Promise<SearchIntent> {
        try {
            const doc = compromise(queryText);
            const tokens = this.tokenizer.tokenize(queryText.toLowerCase());

            let intent: SearchIntent = {
                type: 'unknown',
                confidence: 0,
                entities: [],
                parameters: {}
            };

            // Pattern matching for common intents
            const intentPatterns = [
                {
                    pattern: /find|search|look for|show me/i,
                    type: 'find_document' as const,
                    confidence: 0.8
                },
                {
                    pattern: /template|form/i,
                    type: 'find_template' as const,
                    confidence: 0.9
                },
                {
                    pattern: /user|person|author|created by/i,
                    type: 'find_by_author' as const,
                    confidence: 0.85
                },
                {
                    pattern: /recent|latest|new|today|yesterday/i,
                    type: 'find_recent' as const,
                    confidence: 0.8
                },
                {
                    pattern: /pdf|doc|docx|document|file/i,
                    type: 'find_by_type' as const,
                    confidence: 0.75
                }
            ];

            // Find matching patterns
            for (const patternDef of intentPatterns) {
                if (patternDef.pattern.test(queryText)) {
                    if (patternDef.confidence > intent.confidence) {
                        intent.type = patternDef.type;
                        intent.confidence = patternDef.confidence;
                    }
                }
            }

            // Extract entities
            intent.entities = this.extractEntities(doc, tokens);

            // Extract parameters based on intent
            intent.parameters = this.extractParameters(intent.type, doc, tokens);

            logger.debug({ queryText, intent }, 'Intent recognized');
            return intent;
        } catch (error) {
            logger.error({ error, queryText }, 'Failed to recognize intent');
            return {
                type: 'unknown',
                confidence: 0,
                entities: [],
                parameters: {}
            };
        }
    }

    /**
     * Extract entities from query
     */
    private extractEntities(doc: any, tokens: string[]): SearchIntent['entities'] {
        const entities: SearchIntent['entities'] = [];

        // Extract people names
        const people = doc.people().out('array');
        people.forEach((person: string) => {
            entities.push({
                type: 'person',
                value: person,
                confidence: 0.8
            });
        });

        // Extract dates
        const dates = doc.dates().out('array');
        dates.forEach((date: string) => {
            entities.push({
                type: 'date',
                value: date,
                confidence: 0.9
            });
        });

        // Extract document types
        const documentTypes = ['pdf', 'doc', 'docx', 'contract', 'invoice', 'template', 'form'];
        tokens.forEach((token: string) => {
            if (documentTypes.includes(token.toLowerCase())) {
                entities.push({
                    type: 'document_type',
                    value: token,
                    confidence: 0.85
                });
            }
        });

        return entities;
    }

    /**
     * Extract parameters based on intent type
     */
    private extractParameters(intentType: SearchIntent['type'], doc: any, tokens: string[]): Record<string, any> {
        const parameters: Record<string, any> = {};

        switch (intentType) {
            case 'find_recent':
                // Extract time range
                const timeWords = ['today', 'yesterday', 'week', 'month', 'year'];
                const timeToken = tokens.find(token => timeWords.includes(token));
                if (timeToken) {
                    parameters.timeRange = timeToken;
                }
                break;

            case 'find_by_type':
                // Extract file type
                const fileTypes = ['pdf', 'doc', 'docx', 'txt', 'xlsx'];
                const fileType = tokens.find(token => fileTypes.includes(token));
                if (fileType) {
                    parameters.fileType = fileType;
                }
                break;

            case 'find_by_author':
                // Extract author name
                const people = doc.people().out('array');
                if (people.length > 0) {
                    parameters.author = people[0];
                }
                break;
        }

        return parameters;
    }

    /**
     * Apply intent to modify search query
     */
    private applyIntentToQuery(query: SearchQuery, intent: SearchIntent): SearchQuery {
        const enhancedQuery = { ...query };

        if (intent.confidence < this.config.intentRecognition.confidenceThreshold) {
            return enhancedQuery;
        }

        // Apply intent-specific modifications
        switch (intent.type) {
            case 'find_template':
                enhancedQuery.entityTypes = [SearchEntityType.TEMPLATE];
                break;

            case 'find_recent':
                enhancedQuery.sort = { field: 'createdAt', order: 'desc' };
                if (intent.parameters.timeRange) {
                    const timeFilter = this.getTimeRangeFilter(intent.parameters.timeRange);
                    enhancedQuery.filters = { ...enhancedQuery.filters, ...timeFilter };
                }
                break;

            case 'find_by_type':
                if (intent.parameters.fileType) {
                    enhancedQuery.filters = {
                        ...enhancedQuery.filters,
                        'metadata.fileType': intent.parameters.fileType
                    };
                }
                break;

            case 'find_by_author':
                if (intent.parameters.author) {
                    enhancedQuery.filters = {
                        ...enhancedQuery.filters,
                        'metadata.author': intent.parameters.author
                    };
                }
                break;
        }

        return enhancedQuery;
    }

    /**
     * Expand query with synonyms and related terms
     */
    async expandQuery(queryText: string): Promise<string> {
        if (!this.config.queryExpansion.enabled) {
            return queryText;
        }

        try {
            const tokens = this.tokenizer.tokenize(queryText.toLowerCase());
            const expandedTerms: string[] = [];

            tokens.forEach((token: string) => {
                expandedTerms.push(token);

                // Add synonyms
                const synonyms = this.synonymDict[token];
                if (synonyms) {
                    expandedTerms.push(...synonyms.slice(0, this.config.queryExpansion.maxExpansions));
                }

                // Add stemmed variations
                const stemmed = this.stemmer.stem(token);
                if (stemmed !== token) {
                    expandedTerms.push(stemmed);
                }
            });

            const expandedQuery = [...new Set(expandedTerms)].join(' ');
            logger.debug({ original: queryText, expanded: expandedQuery }, 'Query expanded');

            return expandedQuery;
        } catch (error) {
            logger.error({ error, queryText }, 'Failed to expand query');
            return queryText;
        }
    }

    /**
     * Correct spelling in query text
     */
    async correctSpelling(queryText: string): Promise<string> {
        if (!this.config.spellCorrection.enabled) {
            return queryText;
        }

        try {
            const tokens = this.tokenizer.tokenize(queryText);
            const correctedTokens: string[] = [];

            tokens.forEach((token: string) => {
                const corrections = this.spellChecker.getCorrections(token, this.config.spellCorrection.maxDistance);
                if (corrections.length > 0) {
                    correctedTokens.push(corrections[0]);
                } else {
                    correctedTokens.push(token);
                }
            });

            const correctedQuery = correctedTokens.join(' ');

            if (correctedQuery !== queryText) {
                logger.debug({ original: queryText, corrected: correctedQuery }, 'Query spelling corrected');
            }

            return correctedQuery;
        } catch (error) {
            logger.error({ error, queryText }, 'Failed to correct spelling');
            return queryText;
        }
    }

    /**
     * Apply personalization to query
     */
    private applyPersonalization(
        query: SearchQuery,
        profile: SearchPersonalizationProfile
    ): SearchQuery {
        const personalizedQuery = { ...query };

        // Apply preferred entity types
        if (!personalizedQuery.entityTypes || personalizedQuery.entityTypes.length === 0) {
            personalizedQuery.entityTypes = profile.preferences.entityTypes;
        }

        // Apply preferred sort
        if (!personalizedQuery.sort) {
            personalizedQuery.sort = {
                field: profile.preferences.sortPreference === 'date' ? 'createdAt' : '_score',
                order: 'desc'
            };
        }

        // Apply preferred facets
        if (!personalizedQuery.facets || personalizedQuery.facets.length === 0) {
            personalizedQuery.facets = profile.preferences.facetPreferences;
        }

        return personalizedQuery;
    }

    /**
     * Personalize result ranking based on user behavior
     */
    async personalizeRanking(
        documents: SearchDocument[],
        query: SearchQuery,
        profile: SearchPersonalizationProfile
    ): Promise<SearchDocument[]> {
        try {
            return documents.map(doc => {
                if (!doc.score) {
                    doc.score = {
                        total: 0,
                        textMatch: 0,
                        fieldMatch: 0,
                        recency: 0,
                        popularity: 0,
                        personalization: 0
                    };
                }

                // Calculate personalization score
                let personalizationScore = 0;

                // Boost documents user has interacted with before
                if (profile.behavior.clickPatterns[doc.id]) {
                    personalizationScore += profile.behavior.clickPatterns[doc.id] * 0.3;
                }

                // Boost documents from frequent collaborators
                if (doc.userId && profile.contextual.collaborators.includes(doc.userId)) {
                    personalizationScore += 0.2;
                }

                // Boost recent documents
                if (profile.contextual.recentDocuments.includes(doc.id)) {
                    personalizationScore += 0.4;
                }

                // Boost documents of preferred types
                if (profile.preferences.entityTypes.includes(doc.type)) {
                    personalizationScore += 0.1;
                }

                doc.score.personalization = personalizationScore;
                doc.score.total = (doc.score.total || 0) +
                    (personalizationScore * this.config.personalizedRanking.userWeightFactor);

                return doc;
            }).sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
        } catch (error) {
            logger.error({ error }, 'Failed to personalize ranking');
            return documents;
        }
    }

    /**
     * Enhance semantic relevance using embeddings
     */
    async enhanceSemanticRelevance(
        documents: SearchDocument[],
        queryText: string
    ): Promise<SearchDocument[]> {
        if (!this.config.semanticSearch.enabled) {
            return documents;
        }

        try {
            // This would use actual embedding models in production
            // For now, use fuzzy matching as a proxy for semantic similarity
            const fuse = new Fuse(documents, {
                keys: ['title', 'content', 'tags'],
                threshold: 0.4,
                includeScore: true
            });

            const semanticResults = fuse.search(queryText);

            // Enhance scores with semantic similarity
            return documents.map(doc => {
                const semanticResult = semanticResults.find((r: any) => r.item.id === doc.id);
                if (semanticResult && doc.score) {
                    const semanticScore = 1 - (semanticResult.score || 0);
                    doc.score.total = (doc.score.total || 0) + (semanticScore * 0.2);
                }
                return doc;
            }).sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
        } catch (error) {
            logger.error({ error }, 'Failed to enhance semantic relevance');
            return documents;
        }
    }

    /**
     * Generate AI-powered search suggestions
     */
    async generateSuggestions(
        query: SearchQuery,
        results: SearchResult,
        profile?: SearchPersonalizationProfile
    ): Promise<SearchSuggestion[]> {
        try {
            const suggestions: SearchSuggestion[] = [];

            // Query completion suggestions
            if (this.config.features.autoComplete && query.query) {
                const completions = await this.generateCompletions(query.query, profile);
                suggestions.push(...completions);
            }

            // Spell correction suggestions
            if (this.config.features.spellCorrection && query.query) {
                const corrections = await this.generateSpellingSuggestions(query.query);
                suggestions.push(...corrections);
            }

            // Related query suggestions
            const relatedQueries = await this.generateRelatedQueries(query, results, profile);
            suggestions.push(...relatedQueries);

            // Filter and sort suggestions
            return suggestions
                .filter(s => s.score > 0.3)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        } catch (error) {
            logger.error({ error }, 'Failed to generate suggestions');
            return [];
        }
    }

    /**
     * Generate query completions
     */
    private async generateCompletions(
        queryText: string,
        profile?: SearchPersonalizationProfile
    ): Promise<SearchSuggestion[]> {
        if (queryText.length < this.config.autoComplete.minQueryLength) {
            return [];
        }

        const suggestions: SearchSuggestion[] = [];

        // Common completions based on query patterns
        const commonCompletions = [
            'contract template',
            'invoice template',
            'NDA agreement',
            'employment contract',
            'service agreement'
        ];

        commonCompletions
            .filter(completion => completion.toLowerCase().startsWith(queryText.toLowerCase()))
            .forEach(completion => {
                suggestions.push({
                    text: completion,
                    type: 'completion',
                    score: 0.8,
                    highlight: `<mark>${queryText}</mark>${completion.substring(queryText.length)}`
                });
            });

        return suggestions;
    }

    /**
     * Generate spelling correction suggestions
     */
    private async generateSpellingSuggestions(queryText: string): Promise<SearchSuggestion[]> {
        const suggestions: SearchSuggestion[] = [];
        const tokens = this.tokenizer.tokenize(queryText);

        let hasCorrections = false;
        const correctedTokens: string[] = [];

        tokens.forEach((token: string) => {
            const corrections = this.spellChecker.getCorrections(token, this.config.spellCorrection.maxDistance);
            if (corrections.length > 0 && corrections[0] !== token) {
                correctedTokens.push(corrections[0]);
                hasCorrections = true;
            } else {
                correctedTokens.push(token);
            }
        });

        if (hasCorrections) {
            suggestions.push({
                text: correctedTokens.join(' '),
                type: 'correction',
                score: 0.9,
                highlight: `Did you mean: <mark>${correctedTokens.join(' ')}</mark>?`
            });
        }

        return suggestions;
    }

    /**
     * Generate related query suggestions
     */
    private async generateRelatedQueries(
        query: SearchQuery,
        results: SearchResult,
        profile?: SearchPersonalizationProfile
    ): Promise<SearchSuggestion[]> {
        const suggestions: SearchSuggestion[] = [];

        // Generate suggestions based on search results
        if (results.documents.length > 0) {
            const commonTags = this.extractCommonTags(results.documents);
            commonTags.forEach(tag => {
                if (query.query && !query.query.toLowerCase().includes(tag.toLowerCase())) {
                    suggestions.push({
                        text: `${query.query} ${tag}`,
                        type: 'phrase',
                        score: 0.6
                    });
                }
            });
        }

        // Generate suggestions based on user history
        if (profile?.behavior.searchHistory) {
            profile.behavior.searchHistory
                .slice(0, 5)
                .forEach(historyItem => {
                    if (query.query && historyItem.query !== query.query) {
                        suggestions.push({
                            text: historyItem.query,
                            type: 'phrase',
                            score: 0.5
                        });
                    }
                });
        }

        return suggestions;
    }

    /**
     * Extract common tags from search results
     */
    private extractCommonTags(documents: SearchDocument[]): string[] {
        const tagCounts: Record<string, number> = {};

        documents.forEach(doc => {
            doc.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);
    }

    /**
     * Get time range filter for intent parameters
     */
    private getTimeRangeFilter(timeRange: string): Record<string, any> {
        const now = new Date();
        let startDate: Date;

        switch (timeRange.toLowerCase()) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'yesterday':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        return {
            createdAt: {
                gte: startDate.toISOString()
            }
        };
    }

    /**
     * Get default synonyms dictionary
     */
    private getDefaultSynonyms(): Record<string, string[]> {
        return {
            'contract': ['agreement', 'deal', 'pact'],
            'document': ['file', 'paper', 'record'],
            'template': ['form', 'format', 'pattern'],
            'invoice': ['bill', 'receipt', 'statement'],
            'user': ['person', 'individual', 'member'],
            'create': ['make', 'generate', 'build'],
            'find': ['search', 'locate', 'discover'],
            'recent': ['latest', 'new', 'current'],
            'old': ['previous', 'past', 'former']
        };
    }
}