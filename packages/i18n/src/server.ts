import { SupportedLanguage, SupportedLocale, TranslationNamespace, LocalizationContext } from './types';
import { initializeServerI18n } from './config';
import { culturalAdaptationService } from './cultural-adaptation';
import { rtlManager } from './rtl';
import { TranslationService } from './translation-service';

// Export a default instance for convenience
export const translationService = new TranslationService();

// Server-side i18n utilities
export class ServerI18n {
    private static instance: ServerI18n;
    private initialized = false;

    private constructor() { }

    static getInstance(): ServerI18n {
        if (!ServerI18n.instance) {
            ServerI18n.instance = new ServerI18n();
        }
        return ServerI18n.instance;
    }

    // Initialize server-side i18n
    async initialize(options?: {
        defaultLanguage?: SupportedLanguage;
        supportedLanguages?: SupportedLanguage[];
        resourcePath?: string;
    }): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await initializeServerI18n({
                defaultLanguage: options?.defaultLanguage,
                supportedLanguages: options?.supportedLanguages,
            });

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize server i18n:', error);
            throw error;
        }
    }

    // Get translation function for a specific language
    getTranslationFunction(language: SupportedLanguage, namespace?: TranslationNamespace) {
        if (!this.initialized) {
            throw new Error('ServerI18n not initialized. Call initialize() first.');
        }

        const i18n = require('i18next').default;
        return i18n.getFixedT(language, namespace);
    }

    // Translate a key for a specific language
    translate(
        key: string,
        language: SupportedLanguage,
        options?: {
            namespace?: TranslationNamespace;
            defaultValue?: string;
            interpolation?: Record<string, any>;
            count?: number;
        }
    ): string {
        const t = this.getTranslationFunction(language, options?.namespace);

        return t(key, {
            defaultValue: options?.defaultValue,
            ...options?.interpolation,
            count: options?.count,
        });
    }

    // Get localization context for server-side rendering
    async getLocalizationContext(
        language: SupportedLanguage,
        options?: {
            timezone?: string;
            currency?: string;
            region?: string;
        }
    ): Promise<LocalizationContext> {
        return await culturalAdaptationService.createLocalizationContext(language, options);
    }

    // Format date on server
    async formatDate(
        date: Date | string,
        language: SupportedLanguage,
        options?: { format?: string; timezone?: string }
    ): Promise<string> {
        return await culturalAdaptationService.formatDate(date as Date, language, options);
    }

    // Format number on server
    async formatNumber(
        number: number,
        language: SupportedLanguage,
        options?: {
            style?: 'decimal' | 'currency' | 'percent';
            currency?: string;
            minimumFractionDigits?: number;
            maximumFractionDigits?: number;
        }
    ): Promise<string> {
        return await culturalAdaptationService.formatNumber(number, language, options);
    }

    // Format currency on server
    async formatCurrency(amount: number, language: SupportedLanguage, currency?: string): Promise<string> {
        return await culturalAdaptationService.formatCurrency(amount, language, currency);
    }

    // Check if language is RTL
    isRTL(language: SupportedLanguage): boolean {
        return rtlManager.isRTL(language);
    }

    // Get RTL CSS for server-side rendering
    getRTLCSS(language: SupportedLanguage): string {
        return rtlManager.generateRTLCSS(language);
    }

    // Get HTML attributes for server-side rendering
    getHTMLAttributes(language: SupportedLanguage): { dir: string; lang: string } {
        return {
            dir: rtlManager.getLayoutDirection(language),
            lang: language,
        };
    }

    // Detect language from request headers
    detectLanguageFromRequest(
        request: {
            headers: Record<string, string | string[] | undefined>;
            query?: Record<string, string | string[] | undefined>;
            cookies?: Record<string, string>;
        },
        supportedLanguages: SupportedLanguage[] = Object.keys(require('./languages').LANGUAGE_METADATA) as SupportedLanguage[],
        defaultLanguage: SupportedLanguage = SupportedLocale.EN_US
    ): SupportedLanguage {
        // 1. Check query parameter
        const queryLang = request.query?.lng || request.query?.lang;
        if (queryLang && typeof queryLang === 'string' && supportedLanguages.includes(queryLang as SupportedLanguage)) {
            return queryLang as SupportedLanguage;
        }

        // 2. Check cookie
        const cookieLang = request.cookies?.i18next || request.cookies?.language;
        if (cookieLang && supportedLanguages.includes(cookieLang as SupportedLanguage)) {
            return cookieLang as SupportedLanguage;
        }

        // 3. Check Accept-Language header
        const acceptLanguage = request.headers['accept-language'];
        if (acceptLanguage && typeof acceptLanguage === 'string') {
            const languages = this.parseAcceptLanguage(acceptLanguage);

            for (const lang of languages) {
                // Check exact match
                if (supportedLanguages.includes(lang.code as SupportedLanguage)) {
                    return lang.code as SupportedLanguage;
                }

                // Check language without region (e.g., 'en' from 'en-US')
                const langWithoutRegion = lang.code.split('-')[0];
                if (supportedLanguages.includes(langWithoutRegion as SupportedLanguage)) {
                    return langWithoutRegion as SupportedLanguage;
                }
            }
        }

        return defaultLanguage;
    }

    // Parse Accept-Language header
    private parseAcceptLanguage(acceptLanguage: string): Array<{ code: string; quality: number }> {
        return acceptLanguage
            .split(',')
            .map(lang => {
                const [code, q] = lang.trim().split(';q=');
                return {
                    code: code.trim(),
                    quality: q ? parseFloat(q) : 1.0,
                };
            })
            .sort((a, b) => b.quality - a.quality);
    }

    // Generate translation resources for client-side hydration
    async generateClientResources(
        languages: SupportedLanguage[],
        namespaces: TranslationNamespace[]
    ): Promise<Record<SupportedLanguage, Record<TranslationNamespace, Record<string, any>>>> {
        const resources: Record<SupportedLanguage, Record<TranslationNamespace, Record<string, any>>> = {} as Record<SupportedLanguage, Record<TranslationNamespace, Record<string, any>>>;

        for (const language of languages) {
            resources[language] = {};

            for (const namespace of namespaces) {
                const translations = translationService.getTranslationsByNamespace(namespace, language);
                const translationMap: Record<string, any> = {};

                translations.forEach(translation => {
                    translationMap[translation.key] = translation.value;
                });

                resources[language][namespace] = translationMap;
            }
        }

        return resources;
    }

    // Validate translation completeness
    validateTranslationCompleteness(
        sourceLanguage: SupportedLanguage,
        targetLanguages: SupportedLanguage[],
        namespaces: TranslationNamespace[]
    ): {
        language: SupportedLanguage;
        namespace: TranslationNamespace;
        missingKeys: string[];
        completeness: number;
    }[] {
        const results: {
            language: SupportedLanguage;
            namespace: TranslationNamespace;
            missingKeys: string[];
            completeness: number;
        }[] = [];

        for (const namespace of namespaces) {
            const sourceTranslations = translationService.getTranslationsByNamespace(namespace, sourceLanguage);
            const sourceKeys = new Set(sourceTranslations.map(t => t.key));

            for (const targetLanguage of targetLanguages) {
                const targetTranslations = translationService.getTranslationsByNamespace(namespace, targetLanguage);
                const targetKeys = new Set(targetTranslations.map(t => t.key));

                const missingKeys = Array.from(sourceKeys).filter(key => !targetKeys.has(key));
                const completeness = sourceKeys.size > 0 ? (targetKeys.size / sourceKeys.size) * 100 : 100;

                results.push({
                    language: targetLanguage,
                    namespace,
                    missingKeys,
                    completeness,
                });
            }
        }

        return results;
    }

    // Generate translation report
    generateTranslationReport(
        languages: SupportedLanguage[],
        namespaces: TranslationNamespace[]
    ): {
        totalKeys: number;
        translatedKeys: Record<SupportedLanguage, number>;
        completeness: Record<SupportedLanguage, number>;
        missingTranslations: Record<SupportedLanguage, string[]>;
    } {
        const allKeys = new Set<string>();
        const translatedKeys: Record<SupportedLanguage, number> = {} as Record<SupportedLanguage, number>;
        const missingTranslations: Record<SupportedLanguage, string[]> = {} as Record<SupportedLanguage, string[]>;

        // Collect all unique keys across all languages and namespaces
        for (const language of languages) {
            for (const namespace of namespaces) {
                const translations = translationService.getTranslationsByNamespace(namespace, language);
                translations.forEach(t => allKeys.add(`${namespace}:${t.key}`));
            }
        }

        const totalKeys = allKeys.size;

        // Calculate completeness for each language
        for (const language of languages) {
            const languageKeys = new Set<string>();
            const missing: string[] = [];

            for (const namespace of namespaces) {
                const translations = translationService.getTranslationsByNamespace(namespace, language);
                translations.forEach(t => languageKeys.add(`${namespace}:${t.key}`));
            }

            // Find missing keys
            for (const key of allKeys) {
                if (!languageKeys.has(key)) {
                    missing.push(key);
                }
            }

            translatedKeys[language] = languageKeys.size;
            missingTranslations[language] = missing;
        }

        // Calculate completeness percentages
        const completeness: Record<SupportedLanguage, number> = {} as Record<SupportedLanguage, number>;
        for (const language of languages) {
            completeness[language] = totalKeys > 0 ? (translatedKeys[language] / totalKeys) * 100 : 100;
        }

        return {
            totalKeys,
            translatedKeys,
            completeness,
            missingTranslations,
        };
    }
}

// Singleton instance
export const serverI18n = ServerI18n.getInstance();

// Utility functions for server-side usage
export async function initializeServerI18nInstance(options?: {
    defaultLanguage?: SupportedLanguage;
    supportedLanguages?: SupportedLanguage[];
    resourcePath?: string;
}): Promise<void> {
    await serverI18n.initialize(options);
}

export function translateServer(
    key: string,
    language: SupportedLanguage,
    options?: {
        namespace?: TranslationNamespace;
        defaultValue?: string;
        interpolation?: Record<string, any>;
        count?: number;
    }
): string {
    return serverI18n.translate(key, language, options);
}

export function detectLanguage(
    request: {
        headers: Record<string, string | string[] | undefined>;
        query?: Record<string, string | string[] | undefined>;
        cookies?: Record<string, string>;
    },
    supportedLanguages?: SupportedLanguage[],
    defaultLanguage?: SupportedLanguage
): SupportedLanguage {
    return serverI18n.detectLanguageFromRequest(request, supportedLanguages, defaultLanguage);
}

export function getServerLocalizationContext(
    language: SupportedLanguage,
    options?: {
        timezone?: string;
        currency?: string;
        region?: string;
    }
): Promise<LocalizationContext> {
    return serverI18n.getLocalizationContext(language, options);
}

export async function formatDateServer(
    date: Date | string,
    language: SupportedLanguage,
    options?: { format?: string; timezone?: string }
): Promise<string> {
    return serverI18n.formatDate(date, language, options);
}

export async function formatNumberServer(
    number: number,
    language: SupportedLanguage,
    options?: {
        style?: 'decimal' | 'currency' | 'percent';
        currency?: string;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
    }
): Promise<string> {
    return serverI18n.formatNumber(number, language, options);
}

export async function formatCurrencyServer(amount: number, language: SupportedLanguage, currency?: string): Promise<string> {
    return serverI18n.formatCurrency(amount, language, currency);
}

export function getHTMLAttributes(language: SupportedLanguage): { dir: string; lang: string } {
    return serverI18n.getHTMLAttributes(language);
}

export function getRTLCSSServer(language: SupportedLanguage): string {
    return serverI18n.getRTLCSS(language);
}