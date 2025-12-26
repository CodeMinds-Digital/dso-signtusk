import {
    I18nService,
    SupportedLocale,
    LocaleConfig,
    TranslationProject,
    CulturalAdaptation,
    TranslationMemoryEntry,
    DateFormatStyle,
    NumberFormatStyle,
    TextDirection,
    TranslationStatus,
    TranslationPriority,
    I18nError,
    LocaleNotSupportedError,
    TranslationNotFoundError
} from './types';
import { TranslationCache } from './cache';
import { LocaleDetectorImpl } from './locale-detector';
import { CulturalAdaptationService } from './cultural-adaptation';

export class I18nServiceImpl implements I18nService {
    private cache: TranslationCache;
    private localeDetector: LocaleDetectorImpl;
    private culturalAdaptation: CulturalAdaptationService;
    private supportedLocales: Map<SupportedLocale, LocaleConfig>;
    private translations: Map<string, Map<SupportedLocale, string>>;
    private translationMemory: Map<string, TranslationMemoryEntry[]>;

    constructor(
        cache: TranslationCache,
        localeDetector?: LocaleDetectorImpl,
        culturalAdaptation?: CulturalAdaptationService
    ) {
        this.cache = cache;
        this.localeDetector = localeDetector || new LocaleDetectorImpl();
        this.culturalAdaptation = culturalAdaptation || new CulturalAdaptationService();
        this.supportedLocales = new Map();
        this.translations = new Map();
        this.translationMemory = new Map();

        this.initializeDefaultLocales();
    }

    // Locale management
    async getSupportedLocales(): Promise<LocaleConfig[]> {
        return Array.from(this.supportedLocales.values()).filter(locale => locale.enabled);
    }

    async getLocaleConfig(locale: SupportedLocale): Promise<LocaleConfig> {
        const config = this.supportedLocales.get(locale);
        if (!config) {
            throw new LocaleNotSupportedError(locale);
        }
        return config;
    }

    async setUserLocale(userId: string, locale: SupportedLocale): Promise<void> {
        // Validate locale is supported
        await this.getLocaleConfig(locale);

        // In a real implementation, this would save to database
        // For now, we'll use a simple in-memory store
        await this.cache.set(`user:${userId}:locale`, locale, locale, 86400); // 24 hours TTL
    }

    async getUserLocale(userId: string): Promise<SupportedLocale> {
        const cached = await this.cache.get(`user:${userId}:locale`, SupportedLocale.EN_US);
        if (cached && Object.values(SupportedLocale).includes(cached as SupportedLocale)) {
            return cached as SupportedLocale;
        }
        return SupportedLocale.EN_US; // Default fallback
    }

    async detectLocale(request: any): Promise<SupportedLocale> {
        return this.localeDetector.detect(request);
    }

    // Translation management
    async getTranslation(
        key: string,
        locale: SupportedLocale,
        variables?: Record<string, any>
    ): Promise<string> {
        // Check cache first
        const cacheKey = `${key}:${locale}`;
        const cached = await this.cache.get(cacheKey, locale);
        if (cached) {
            return this.formatMessage(cached, variables);
        }

        // Get from translations store
        const localeTranslations = this.translations.get(key);
        if (!localeTranslations) {
            throw new TranslationNotFoundError(key, locale);
        }

        let translation = localeTranslations.get(locale);

        // Try fallback locale if translation not found
        if (!translation) {
            const localeConfig = await this.getLocaleConfig(locale);
            if (localeConfig.fallback) {
                translation = localeTranslations.get(localeConfig.fallback);
            }
        }

        // Final fallback to English
        if (!translation) {
            translation = localeTranslations.get(SupportedLocale.EN_US);
        }

        if (!translation) {
            throw new TranslationNotFoundError(key, locale);
        }

        // Cache the result
        await this.cache.set(cacheKey, locale, translation, 3600); // 1 hour TTL

        return this.formatMessage(translation, variables);
    }

    async getTranslations(namespace: string, locale: SupportedLocale): Promise<Record<string, string>> {
        const result: Record<string, string> = {};

        for (const [key, localeTranslations] of this.translations.entries()) {
            if (key.startsWith(`${namespace}.`)) {
                const translation = localeTranslations.get(locale);
                if (translation) {
                    // Remove namespace prefix from key
                    const shortKey = key.substring(namespace.length + 1);
                    result[shortKey] = translation;
                }
            }
        }

        return result;
    }

    async setTranslation(key: string, locale: SupportedLocale, value: string): Promise<void> {
        if (!this.translations.has(key)) {
            this.translations.set(key, new Map());
        }

        const localeTranslations = this.translations.get(key)!;
        localeTranslations.set(locale, value);

        // Clear cache for this key
        const cacheKey = `${key}:${locale}`;
        await this.cache.delete(cacheKey, locale);
    }

    async bulkSetTranslations(
        translations: Array<{ key: string; locale: SupportedLocale; value: string }>
    ): Promise<void> {
        const cacheKeysToDelete: string[] = [];

        for (const { key, locale, value } of translations) {
            if (!this.translations.has(key)) {
                this.translations.set(key, new Map());
            }

            const localeTranslations = this.translations.get(key)!;
            localeTranslations.set(locale, value);

            cacheKeysToDelete.push(`${key}:${locale}`);
        }

        // Clear cache for all updated keys
        for (const cacheKey of cacheKeysToDelete) {
            const [key, locale] = cacheKey.split(':');
            await this.cache.delete(key, locale as SupportedLocale);
        }
    }

    // Translation projects (simplified implementation)
    async createProject(
        project: Omit<TranslationProject, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<TranslationProject> {
        const now = new Date();
        const newProject: TranslationProject = {
            ...project,
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now,
        };

        // In a real implementation, this would save to database
        return newProject;
    }

    async getProject(projectId: string): Promise<TranslationProject> {
        // In a real implementation, this would fetch from database
        throw new I18nError('Project not found', 'PROJECT_NOT_FOUND');
    }

    async updateProject(
        projectId: string,
        updates: Partial<TranslationProject>
    ): Promise<TranslationProject> {
        // In a real implementation, this would update in database
        throw new I18nError('Project not found', 'PROJECT_NOT_FOUND');
    }

    async deleteProject(projectId: string): Promise<void> {
        // In a real implementation, this would delete from database
        throw new I18nError('Project not found', 'PROJECT_NOT_FOUND');
    }

    // Translation workflow (simplified implementation)
    async submitForTranslation(keyId: string, targetLocales: SupportedLocale[]): Promise<void> {
        // In a real implementation, this would create translation jobs
        console.log(`Submitting key ${keyId} for translation to locales:`, targetLocales);
    }

    async reviewTranslation(translationId: string, approved: boolean, notes?: string): Promise<void> {
        // In a real implementation, this would update translation status
        console.log(`Translation ${translationId} ${approved ? 'approved' : 'rejected'}`, notes);
    }

    async publishTranslations(projectId: string, locale: SupportedLocale): Promise<void> {
        // In a real implementation, this would publish translations
        console.log(`Publishing translations for project ${projectId} in locale ${locale}`);
    }

    // Cultural adaptation
    async getCulturalAdaptation(locale: SupportedLocale): Promise<CulturalAdaptation> {
        return this.culturalAdaptation.getAdaptation(locale);
    }

    async formatDate(
        date: Date,
        locale: SupportedLocale,
        style: DateFormatStyle = DateFormatStyle.MEDIUM
    ): Promise<string> {
        const options = this.getDateFormatOptions(style);
        return new Intl.DateTimeFormat(locale, options).format(date);
    }

    async formatNumber(
        number: number,
        locale: SupportedLocale,
        style: NumberFormatStyle = NumberFormatStyle.DECIMAL,
        options: any = {}
    ): Promise<string> {
        const formatOptions = { style, ...options };
        return new Intl.NumberFormat(locale, formatOptions).format(number);
    }

    async formatCurrency(
        amount: number,
        locale: SupportedLocale,
        currency?: string
    ): Promise<string> {
        const localeConfig = await this.getLocaleConfig(locale);
        const currencyCode = currency || localeConfig.currency || 'USD';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    }

    async formatRelativeTime(date: Date, locale: SupportedLocale): Promise<string> {
        const now = new Date();
        const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

        const intervals = [
            { unit: 'year' as const, seconds: 31536000 },
            { unit: 'month' as const, seconds: 2628000 },
            { unit: 'day' as const, seconds: 86400 },
            { unit: 'hour' as const, seconds: 3600 },
            { unit: 'minute' as const, seconds: 60 },
            { unit: 'second' as const, seconds: 1 },
        ];

        for (const interval of intervals) {
            const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
            if (count >= 1) {
                return rtf.format(diffInSeconds < 0 ? -count : count, interval.unit);
            }
        }

        return rtf.format(0, 'second');
    }

    // Translation memory
    async searchTranslationMemory(
        text: string,
        sourceLocale: SupportedLocale,
        targetLocale: SupportedLocale
    ): Promise<TranslationMemoryEntry[]> {
        const key = `${sourceLocale}-${targetLocale}`;
        const entries = this.translationMemory.get(key) || [];

        return entries
            .filter(entry =>
                entry.sourceText.toLowerCase().includes(text.toLowerCase()) ||
                text.toLowerCase().includes(entry.sourceText.toLowerCase())
            )
            .sort((a, b) => b.quality - a.quality)
            .slice(0, 10); // Return top 10 matches
    }

    async addToTranslationMemory(
        entry: Omit<TranslationMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<void> {
        const key = `${entry.sourceLocale}-${entry.targetLocale}`;
        if (!this.translationMemory.has(key)) {
            this.translationMemory.set(key, []);
        }

        const now = new Date();
        const newEntry: TranslationMemoryEntry = {
            ...entry,
            id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now,
        };

        this.translationMemory.get(key)!.push(newEntry);
    }

    // Helper methods
    private formatMessage(template: string, variables?: Record<string, any>): string {
        if (!variables || Object.keys(variables).length === 0) {
            return template;
        }

        try {
            // Simple variable replacement
            let formatted = template;
            for (const [key, value] of Object.entries(variables)) {
                const placeholder = `{${key}}`;
                formatted = formatted.replace(new RegExp(placeholder, 'g'), String(value));
            }
            return formatted;
        } catch (error) {
            console.warn('Failed to format message:', error);
            return template;
        }
    }

    private getDateFormatOptions(style: DateFormatStyle): Intl.DateTimeFormatOptions {
        switch (style) {
            case DateFormatStyle.FULL:
                return {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                };
            case DateFormatStyle.LONG:
                return {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                };
            case DateFormatStyle.MEDIUM:
                return {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                };
            case DateFormatStyle.SHORT:
                return {
                    year: '2-digit',
                    month: 'numeric',
                    day: 'numeric'
                };
            default:
                return {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                };
        }
    }

    private initializeDefaultLocales(): void {
        // Initialize with common locales
        const defaultLocales: LocaleConfig[] = [
            {
                code: SupportedLocale.EN_US,
                name: 'English (United States)',
                nativeName: 'English (United States)',
                direction: TextDirection.LTR,
                currency: 'USD',
                dateFormat: 'MM/dd/yyyy',
                timeFormat: 'h:mm a',
                numberFormat: {
                    decimal: '.',
                    thousands: ',',
                    grouping: [3],
                },
                pluralRules: ['one', 'other'],
                enabled: true,
            },
            {
                code: SupportedLocale.ES_ES,
                name: 'Spanish (Spain)',
                nativeName: 'Español (España)',
                direction: TextDirection.LTR,
                currency: 'EUR',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: 'HH:mm',
                numberFormat: {
                    decimal: ',',
                    thousands: '.',
                    grouping: [3],
                },
                pluralRules: ['one', 'other'],
                fallback: SupportedLocale.EN_US,
                enabled: true,
            },
            {
                code: SupportedLocale.FR_FR,
                name: 'French (France)',
                nativeName: 'Français (France)',
                direction: TextDirection.LTR,
                currency: 'EUR',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: 'HH:mm',
                numberFormat: {
                    decimal: ',',
                    thousands: ' ',
                    grouping: [3],
                },
                pluralRules: ['one', 'other'],
                fallback: SupportedLocale.EN_US,
                enabled: true,
            },
            {
                code: SupportedLocale.DE_DE,
                name: 'German (Germany)',
                nativeName: 'Deutsch (Deutschland)',
                direction: TextDirection.LTR,
                currency: 'EUR',
                dateFormat: 'dd.MM.yyyy',
                timeFormat: 'HH:mm',
                numberFormat: {
                    decimal: ',',
                    thousands: '.',
                    grouping: [3],
                },
                pluralRules: ['one', 'other'],
                fallback: SupportedLocale.EN_US,
                enabled: true,
            },
            {
                code: SupportedLocale.AR_SA,
                name: 'Arabic (Saudi Arabia)',
                nativeName: 'العربية (المملكة العربية السعودية)',
                direction: TextDirection.RTL,
                currency: 'SAR',
                dateFormat: 'dd/MM/yyyy',
                timeFormat: 'HH:mm',
                numberFormat: {
                    decimal: '.',
                    thousands: ',',
                    grouping: [3],
                },
                pluralRules: ['zero', 'one', 'two', 'few', 'many', 'other'],
                fallback: SupportedLocale.EN_US,
                enabled: true,
            },
            {
                code: SupportedLocale.ZH_CN,
                name: 'Chinese (Simplified)',
                nativeName: '中文（简体）',
                direction: TextDirection.LTR,
                currency: 'CNY',
                dateFormat: 'yyyy/MM/dd',
                timeFormat: 'HH:mm',
                numberFormat: {
                    decimal: '.',
                    thousands: ',',
                    grouping: [3],
                },
                pluralRules: ['other'],
                fallback: SupportedLocale.EN_US,
                enabled: true,
            },
        ];

        for (const locale of defaultLocales) {
            this.supportedLocales.set(locale.code, locale);
        }
    }

    // Utility methods for getting locale information
    isRTL(locale: SupportedLocale): boolean {
        const config = this.supportedLocales.get(locale);
        return config?.direction === TextDirection.RTL || false;
    }

    getTextDirection(locale: SupportedLocale): TextDirection {
        const config = this.supportedLocales.get(locale);
        return config?.direction || TextDirection.LTR;
    }

    async loadTranslationsFromFile(filePath: string, locale: SupportedLocale): Promise<void> {
        // In a real implementation, this would load translations from a file
        // For now, we'll add some sample translations
        const sampleTranslations = {
            'common.welcome': 'Welcome',
            'common.hello': 'Hello {name}',
            'common.goodbye': 'Goodbye',
            'auth.login': 'Log In',
            'auth.logout': 'Log Out',
            'auth.register': 'Register',
            'document.upload': 'Upload Document',
            'document.sign': 'Sign Document',
            'document.download': 'Download Document',
        };

        const translations = Object.entries(sampleTranslations).map(([key, value]) => ({
            key,
            locale,
            value,
        }));

        await this.bulkSetTranslations(translations);
    }
}