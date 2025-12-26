import { I18nServiceImpl } from './i18n-service';
import { InMemoryTranslationCache, RedisTranslationCache } from './cache';
import { LocaleDetectorImpl } from './locale-detector';
import { CulturalAdaptationService } from './cultural-adaptation';
import {
    I18nService,
    SupportedLocale,
    TranslationKey,
    TranslationValue,
    TranslationCache,
    LocaleDetector
} from './types';

// Factory function for creating I18n service with custom configuration
export function createI18nService(options: {
    cache?: TranslationCache;
    localeDetector?: LocaleDetector;
    culturalAdaptation?: CulturalAdaptationService;
    redisClient?: any;
    supportedLocales?: SupportedLocale[];
    fallbackLocale?: SupportedLocale;
}): I18nService {
    const {
        cache,
        localeDetector,
        culturalAdaptation,
        redisClient,
        supportedLocales,
        fallbackLocale = SupportedLocale.EN_US,
    } = options;

    // Create cache
    let translationCache: TranslationCache;
    if (cache) {
        translationCache = cache;
    } else if (redisClient) {
        translationCache = new RedisTranslationCache(redisClient);
    } else {
        translationCache = new InMemoryTranslationCache();
    }

    // Create locale detector
    const detector = localeDetector || new LocaleDetectorImpl();

    // Create cultural adaptation service
    const cultural = culturalAdaptation || new CulturalAdaptationService();

    return new I18nServiceImpl(translationCache, detector as LocaleDetectorImpl, cultural);
}

// Default factory function
export function createDefaultI18nService(): I18nService {
    return createI18nService({});
}

// Load translations from JSON object
export async function loadTranslationsFromJSON(
    i18nService: I18nService,
    translations: Record<string, Record<SupportedLocale, string>>,
    namespace?: string
): Promise<void> {
    const translationEntries: Array<{ key: string; locale: SupportedLocale; value: string }> = [];

    for (const [key, localeTranslations] of Object.entries(translations)) {
        const fullKey = namespace ? `${namespace}.${key}` : key;

        for (const [locale, value] of Object.entries(localeTranslations)) {
            if (Object.values(SupportedLocale).includes(locale as SupportedLocale)) {
                translationEntries.push({
                    key: fullKey,
                    locale: locale as SupportedLocale,
                    value,
                });
            }
        }
    }

    await i18nService.bulkSetTranslations(translationEntries);
}

// Load translations from multiple JSON files
export async function loadTranslationsFromFiles(
    i18nService: I18nService,
    files: Array<{ path: string; locale: SupportedLocale; namespace?: string }>
): Promise<void> {
    for (const { path, locale, namespace } of files) {
        try {
            // In a real implementation, you would read the file from the filesystem
            // For now, we'll simulate loading
            console.log(`Loading translations from ${path} for locale ${locale}`);

            // Mock translation data
            const mockTranslations = {
                'welcome': 'Welcome',
                'hello': 'Hello {name}',
                'goodbye': 'Goodbye',
            };

            const translationEntries = Object.entries(mockTranslations).map(([key, value]) => ({
                key: namespace ? `${namespace}.${key}` : key,
                locale,
                value,
            }));

            await i18nService.bulkSetTranslations(translationEntries);
        } catch (error) {
            console.error(`Failed to load translations from ${path}:`, error);
        }
    }
}

// Validate translation keys for consistency
export function validateTranslationKeys(
    translations: Record<string, Record<SupportedLocale, string>>,
    requiredLocales: SupportedLocale[]
): {
    valid: boolean;
    errors: Array<{ key: string; issue: string; locales?: SupportedLocale[] }>;
} {
    const errors: Array<{ key: string; issue: string; locales?: SupportedLocale[] }> = [];

    for (const [key, localeTranslations] of Object.entries(translations)) {
        const availableLocales = Object.keys(localeTranslations) as SupportedLocale[];

        // Check for missing locales
        const missingLocales = requiredLocales.filter(locale => !availableLocales.includes(locale));
        if (missingLocales.length > 0) {
            errors.push({
                key,
                issue: 'Missing translations',
                locales: missingLocales,
            });
        }

        // Check for empty translations
        for (const [locale, value] of Object.entries(localeTranslations)) {
            if (!value || value.trim() === '') {
                errors.push({
                    key,
                    issue: `Empty translation for locale ${locale}`,
                });
            }
        }

        // Check for variable consistency
        const variables = extractVariables(Object.values(localeTranslations)[0] || '');
        for (const [locale, value] of Object.entries(localeTranslations)) {
            const localeVariables = extractVariables(value);
            if (!arraysEqual(variables.sort(), localeVariables.sort())) {
                errors.push({
                    key,
                    issue: `Variable mismatch in locale ${locale}. Expected: ${variables.join(', ')}, Found: ${localeVariables.join(', ')}`,
                });
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Generate translation report
export function generateTranslationReport(
    translations: Record<string, Record<SupportedLocale, string>>,
    supportedLocales: SupportedLocale[]
): {
    totalKeys: number;
    totalTranslations: number;
    completionRate: Record<SupportedLocale, number>;
    missingTranslations: Record<SupportedLocale, string[]>;
    emptyTranslations: Record<SupportedLocale, string[]>;
    summary: string;
} {
    const totalKeys = Object.keys(translations).length;
    let totalTranslations = 0;
    const completionRate: Record<SupportedLocale, number> = {} as any;
    const missingTranslations: Record<SupportedLocale, string[]> = {} as any;
    const emptyTranslations: Record<SupportedLocale, string[]> = {} as any;

    // Initialize tracking objects
    for (const locale of supportedLocales) {
        missingTranslations[locale] = [];
        emptyTranslations[locale] = [];
    }

    // Analyze translations
    for (const [key, localeTranslations] of Object.entries(translations)) {
        for (const locale of supportedLocales) {
            const translation = localeTranslations[locale];

            if (!translation) {
                missingTranslations[locale].push(key);
            } else if (translation.trim() === '') {
                emptyTranslations[locale].push(key);
            } else {
                totalTranslations++;
            }
        }
    }

    // Calculate completion rates
    for (const locale of supportedLocales) {
        const completed = totalKeys - missingTranslations[locale].length - emptyTranslations[locale].length;
        completionRate[locale] = totalKeys > 0 ? (completed / totalKeys) * 100 : 0;
    }

    // Generate summary
    const avgCompletionRate = Object.values(completionRate).reduce((sum, rate) => sum + rate, 0) / supportedLocales.length;
    const summary = `Translation Report: ${totalKeys} keys, ${totalTranslations} translations, ${avgCompletionRate.toFixed(1)}% average completion rate`;

    return {
        totalKeys,
        totalTranslations,
        completionRate,
        missingTranslations,
        emptyTranslations,
        summary,
    };
}

// Extract variables from translation string
function extractVariables(text: string): string[] {
    const variableRegex = /{([^}]+)}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(text)) !== null) {
        variables.push(match[1]);
    }

    return variables;
}

// Check if two arrays are equal
function arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
}

// Utility for detecting locale from various sources
export async function detectLocaleFromSources(
    sources: {
        acceptLanguage?: string;
        userAgent?: string;
        ipAddress?: string;
        cookie?: string;
        query?: string;
    },
    supportedLocales: SupportedLocale[] = Object.values(SupportedLocale),
    fallback: SupportedLocale = SupportedLocale.EN_US
): Promise<SupportedLocale> {
    const detector = new LocaleDetectorImpl(supportedLocales, fallback);

    // Try different detection methods
    if (sources.query) {
        const queryLocale = sources.query as SupportedLocale;
        if (supportedLocales.includes(queryLocale)) {
            return queryLocale;
        }
    }

    if (sources.cookie) {
        const cookieLocale = sources.cookie as SupportedLocale;
        if (supportedLocales.includes(cookieLocale)) {
            return cookieLocale;
        }
    }

    if (sources.acceptLanguage) {
        try {
            const detected = await detector.detectFromAcceptLanguage(sources.acceptLanguage);
            if (supportedLocales.includes(detected)) {
                return detected;
            }
        } catch (error) {
            console.warn('Failed to detect from Accept-Language:', error);
        }
    }

    if (sources.userAgent) {
        try {
            const detected = await detector.detectFromUserAgent(sources.userAgent);
            if (supportedLocales.includes(detected)) {
                return detected;
            }
        } catch (error) {
            console.warn('Failed to detect from User-Agent:', error);
        }
    }

    if (sources.ipAddress) {
        try {
            const detected = await detector.detectFromIP(sources.ipAddress);
            if (supportedLocales.includes(detected)) {
                return detected;
            }
        } catch (error) {
            console.warn('Failed to detect from IP:', error);
        }
    }

    return fallback;
}

// Utility for formatting messages with ICU syntax
export function formatICUMessage(
    template: string,
    variables: Record<string, any> = {},
    locale: SupportedLocale = SupportedLocale.EN_US
): string {
    try {
        // Simple variable replacement for now
        // In a real implementation, you'd use a proper ICU message formatter
        let formatted = template;

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`;
            formatted = formatted.replace(new RegExp(placeholder, 'g'), String(value));
        }

        return formatted;
    } catch (error) {
        console.warn('Failed to format ICU message:', error);
        return template;
    }
}

// Utility for pluralization
export function pluralize(
    count: number,
    forms: {
        zero?: string;
        one: string;
        two?: string;
        few?: string;
        many?: string;
        other: string;
    },
    locale: SupportedLocale = SupportedLocale.EN_US
): string {
    // Simple English pluralization rules
    // In a real implementation, you'd use Intl.PluralRules
    if (count === 0 && forms.zero) {
        return forms.zero;
    } else if (count === 1) {
        return forms.one;
    } else if (count === 2 && forms.two) {
        return forms.two;
    } else {
        return forms.other;
    }
}

// Utility for RTL detection
export function isRTLLocale(locale: SupportedLocale): boolean {
    const rtlLocales = [
        SupportedLocale.AR_SA,
        SupportedLocale.AR_EG,
        SupportedLocale.HE_IL,
        SupportedLocale.FA_IR,
        SupportedLocale.UR_PK,
    ];
    return rtlLocales.includes(locale);
}

// Utility for getting text direction
export function getTextDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
    return isRTLLocale(locale) ? 'rtl' : 'ltr';
}

// Utility for normalizing locale codes
export function normalizeLocale(locale: string): SupportedLocale | null {
    const normalized = locale.toLowerCase().replace('_', '-');

    // Try exact match first
    for (const supportedLocale of Object.values(SupportedLocale)) {
        if (supportedLocale.toLowerCase() === normalized) {
            return supportedLocale;
        }
    }

    // Try language-only match
    const language = normalized.split('-')[0];
    const languageDefaults: Record<string, SupportedLocale> = {
        'en': SupportedLocale.EN_US,
        'es': SupportedLocale.ES_ES,
        'fr': SupportedLocale.FR_FR,
        'de': SupportedLocale.DE_DE,
        'it': SupportedLocale.IT_IT,
        'pt': SupportedLocale.PT_BR,
        'zh': SupportedLocale.ZH_CN,
        'ja': SupportedLocale.JA_JP,
        'ko': SupportedLocale.KO_KR,
        'ar': SupportedLocale.AR_SA,
        'he': SupportedLocale.HE_IL,
        'fa': SupportedLocale.FA_IR,
        'hi': SupportedLocale.HI_IN,
        'ru': SupportedLocale.RU_RU,
    };

    return languageDefaults[language] || null;
}