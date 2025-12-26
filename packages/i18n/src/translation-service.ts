import { z } from 'zod';
import {
    SupportedLocale,
    TranslationNamespace,
    TranslationContent,
    TranslationProject,
    TranslationWorkflow,
    TranslationMemory,
    TranslationServiceProvider,
    I18nSchemas,
    TranslationMemoryEntry,
} from './types';

// Translation service for managing translations
export class TranslationService {
    private translations: Map<string, TranslationContent> = new Map();
    private translationMemory: Map<string, TranslationMemoryEntry[]> = new Map();
    private projects: Map<string, TranslationProject> = new Map();
    private workflows: Map<string, TranslationWorkflow> = new Map();
    private providers: Map<string, TranslationServiceProvider> = new Map();

    // Translation CRUD operations
    async createTranslation(translation: Omit<TranslationContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<TranslationContent> {
        // Validate translation data
        const validationResult = I18nSchemas.TranslationValidation.safeParse({
            key: translation.key,
            value: translation.value,
            namespace: translation.namespace,
            language: translation.language,
        });

        if (!validationResult.success) {
            throw new Error(`Translation validation failed: ${validationResult.error.message}`);
        }

        const id = this.generateId();
        const now = new Date();

        const newTranslation: TranslationContent = {
            ...translation,
            id,
            createdAt: now,
            updatedAt: now,
            version: 1,
            status: 'draft',
        };

        const key = this.getTranslationKey(translation.namespace, translation.language, translation.key);
        this.translations.set(key, newTranslation);

        return newTranslation;
    }

    async updateTranslation(id: string, updates: Partial<TranslationContent>): Promise<TranslationContent> {
        const existing = this.getTranslationById(id);
        if (!existing) {
            throw new Error(`Translation with id ${id} not found`);
        }

        const updated: TranslationContent = {
            ...existing,
            ...updates,
            id: existing.id, // Prevent ID changes
            createdAt: existing.createdAt, // Prevent creation date changes
            updatedAt: new Date(),
            version: existing.version + 1,
        };

        // Validate updated translation
        if (updates.key || updates.value || updates.namespace || updates.language) {
            const validationResult = I18nSchemas.TranslationValidation.safeParse({
                key: updated.key,
                value: updated.value,
                namespace: updated.namespace,
                language: updated.language,
            });

            if (!validationResult.success) {
                throw new Error(`Translation validation failed: ${validationResult.error.message}`);
            }
        }

        const key = this.getTranslationKey(updated.namespace, updated.language, updated.key);
        this.translations.set(key, updated);

        return updated;
    }

    async deleteTranslation(id: string): Promise<boolean> {
        const existing = this.getTranslationById(id);
        if (!existing) {
            return false;
        }

        const key = this.getTranslationKey(existing.namespace, existing.language, existing.key);
        return this.translations.delete(key);
    }

    // Translation retrieval
    getTranslation(namespace: TranslationNamespace, language: SupportedLocale, key: string): TranslationContent | undefined {
        const translationKey = this.getTranslationKey(namespace, language, key);
        return this.translations.get(translationKey);
    }

    getTranslationsByNamespace(namespace: TranslationNamespace, language: SupportedLocale): TranslationContent[] {
        const results: TranslationContent[] = [];
        for (const [key, translation] of this.translations.entries()) {
            if (key.startsWith(`${namespace}:${language}:`)) {
                results.push(translation);
            }
        }
        return results;
    }

    getTranslationsByLanguage(language: SupportedLocale): TranslationContent[] {
        const results: TranslationContent[] = [];
        for (const [key, translation] of this.translations.entries()) {
            if (key.includes(`:${language}:`)) {
                results.push(translation);
            }
        }
        return results;
    }

    // Translation memory operations
    async addTranslationMemory(memory: Omit<TranslationMemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Promise<void> {
        const now = new Date();

        const entry: TranslationMemoryEntry = {
            ...memory,
            id: this.generateId(),
            createdAt: now,
            updatedAt: now,
            usage: 0,
        };

        const key = `${memory.sourceLocale}-${memory.targetLocale}-${this.hashText(memory.sourceText)}`;
        if (!this.translationMemory.has(key)) {
            this.translationMemory.set(key, []);
        }
        this.translationMemory.get(key)!.push(entry);
    }

    searchTranslationMemory(
        sourceLanguage: SupportedLocale,
        targetLanguage: SupportedLocale,
        sourceText: string
    ): TranslationMemoryEntry[] {
        const results: Array<TranslationMemoryEntry & { similarity: number }> = [];

        for (const [key, memories] of this.translationMemory.entries()) {
            for (const memory of memories) {
                if (memory.sourceLocale === sourceLanguage && memory.targetLocale === targetLanguage) {
                    results.push({
                        ...memory,
                        similarity: this.calculateSimilarity(sourceText, memory.sourceText),
                    });
                }
            }
        }

        return results
            .filter(result => result.similarity > 0.5)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);
    }

    // Translation workflow operations
    async createWorkflow(workflow: Omit<TranslationWorkflow, 'id' | 'createdAt'>): Promise<TranslationWorkflow> {
        const id = this.generateId();
        const now = new Date();

        const newWorkflow: TranslationWorkflow = {
            ...workflow,
            id,
            createdAt: now,
        };

        this.workflows.set(id, newWorkflow);
        return newWorkflow;
    }

    getWorkflowsByOrganization(organizationId: string): TranslationWorkflow[] {
        return Array.from(this.workflows.values()).filter(w => w.organizationId === organizationId);
    }

    // Translation provider operations
    registerProvider(provider: TranslationServiceProvider): void {
        this.providers.set(provider.id, provider);
    }

    getProvider(providerId: string): TranslationServiceProvider | undefined {
        return this.providers.get(providerId);
    }

    getProviders(): TranslationServiceProvider[] {
        return Array.from(this.providers.values());
    }

    getServiceProvidersByLanguage(sourceLanguage: SupportedLocale, targetLanguage: SupportedLocale): TranslationServiceProvider[] {
        return Array.from(this.providers.values()).filter(
            p => p.supportedLanguages.includes(sourceLanguage) && p.supportedLanguages.includes(targetLanguage)
        );
    }

    // Translation statistics and analytics
    getTranslationStats(
        organizationId?: string,
        projectId?: string,
        language?: SupportedLocale,
        dateRange?: { start: Date; end: Date }
    ): any {
        // Implementation for translation statistics
        return {
            totalTranslations: this.translations.size,
            completedTranslations: 0,
            pendingTranslations: 0,
            languages: Object.values(SupportedLocale).length,
        };
    }

    // Helper methods
    private getTranslationKey(namespace: TranslationNamespace, language: SupportedLocale, key: string): string {
        return `${namespace}:${language}:${key}`;
    }

    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getTranslationById(id: string): TranslationContent | undefined {
        for (const translation of this.translations.values()) {
            if (translation.id === id) {
                return translation;
            }
        }
        return undefined;
    }

    private hashText(text: string): string {
        // Simple hash function for demonstration
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    private calculateSimilarity(text1: string, text2: string): number {
        // Simple similarity calculation using Levenshtein distance
        const len1 = text1.length;
        const len2 = text2.length;

        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;

        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const indicator = text1[i - 1] === text2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,     // deletion
                    matrix[j - 1][i] + 1,     // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        return (maxLen - distance) / maxLen;
    }
}