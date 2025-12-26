import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { SupportedLanguage, SupportedLocale, TranslationNamespace } from './types';
import { LANGUAGE_METADATA } from './languages';

// Default configuration
export const DEFAULT_LANGUAGE: SupportedLanguage = SupportedLocale.EN_US;
export const DEFAULT_NAMESPACE: TranslationNamespace = 'common';

// Fallback languages for better user experience
export const FALLBACK_LANGUAGES: Record<SupportedLanguage, SupportedLanguage[]> = {
    [SupportedLocale.EN_US]: [],
    [SupportedLocale.EN_GB]: [SupportedLocale.EN_US],
    [SupportedLocale.EN_CA]: [SupportedLocale.EN_US],
    [SupportedLocale.EN_AU]: [SupportedLocale.EN_US],
    [SupportedLocale.ES_ES]: [SupportedLocale.EN_US],
    [SupportedLocale.ES_MX]: [SupportedLocale.ES_ES, SupportedLocale.EN_US],
    [SupportedLocale.ES_AR]: [SupportedLocale.ES_ES, SupportedLocale.EN_US],
    [SupportedLocale.ES_CO]: [SupportedLocale.ES_ES, SupportedLocale.EN_US],
    [SupportedLocale.FR_FR]: [SupportedLocale.EN_US],
    [SupportedLocale.FR_CA]: [SupportedLocale.FR_FR, SupportedLocale.EN_US],
    [SupportedLocale.FR_BE]: [SupportedLocale.FR_FR, SupportedLocale.EN_US],
    [SupportedLocale.FR_CH]: [SupportedLocale.FR_FR, SupportedLocale.EN_US],
    [SupportedLocale.DE_DE]: [SupportedLocale.EN_US],
    [SupportedLocale.DE_AT]: [SupportedLocale.DE_DE, SupportedLocale.EN_US],
    [SupportedLocale.DE_CH]: [SupportedLocale.DE_DE, SupportedLocale.EN_US],
    [SupportedLocale.IT_IT]: [SupportedLocale.EN_US],
    [SupportedLocale.PT_BR]: [SupportedLocale.EN_US],
    [SupportedLocale.PT_PT]: [SupportedLocale.PT_BR, SupportedLocale.EN_US],
    [SupportedLocale.ZH_CN]: [SupportedLocale.EN_US],
    [SupportedLocale.ZH_TW]: [SupportedLocale.ZH_CN, SupportedLocale.EN_US],
    [SupportedLocale.JA_JP]: [SupportedLocale.EN_US],
    [SupportedLocale.KO_KR]: [SupportedLocale.EN_US],
    [SupportedLocale.NL_NL]: [SupportedLocale.EN_US],
    [SupportedLocale.SV_SE]: [SupportedLocale.EN_US],
    [SupportedLocale.DA_DK]: [SupportedLocale.EN_US],
    [SupportedLocale.NO_NO]: [SupportedLocale.EN_US],
    [SupportedLocale.FI_FI]: [SupportedLocale.EN_US],
    [SupportedLocale.PL_PL]: [SupportedLocale.EN_US],
    [SupportedLocale.RU_RU]: [SupportedLocale.EN_US],
    [SupportedLocale.AR_SA]: [SupportedLocale.EN_US],
    [SupportedLocale.AR_EG]: [SupportedLocale.AR_SA, SupportedLocale.EN_US],
    [SupportedLocale.HE_IL]: [SupportedLocale.EN_US],
    [SupportedLocale.FA_IR]: [SupportedLocale.EN_US],
    [SupportedLocale.HI_IN]: [SupportedLocale.EN_US],
    [SupportedLocale.BN_BD]: [SupportedLocale.EN_US],
    [SupportedLocale.UR_PK]: [SupportedLocale.EN_US],
    [SupportedLocale.TH_TH]: [SupportedLocale.EN_US],
    [SupportedLocale.VI_VN]: [SupportedLocale.EN_US],
    [SupportedLocale.ID_ID]: [SupportedLocale.EN_US],
    [SupportedLocale.MS_MY]: [SupportedLocale.EN_US],
    [SupportedLocale.SW_KE]: [SupportedLocale.EN_US],
    [SupportedLocale.AF_ZA]: [SupportedLocale.EN_US],
};

// i18next configuration
export interface I18nConfig {
    defaultLanguage: SupportedLanguage;
    supportedLanguages: SupportedLanguage[];
    defaultNamespace: TranslationNamespace;
    namespaces: TranslationNamespace[];
    fallbackLanguages: Record<SupportedLanguage, SupportedLanguage[]>;
    backend?: {
        loadPath: string;
        addPath?: string;
        allowMultiLoading?: boolean;
    };
    detection?: {
        order: string[];
        caches: string[];
        lookupQuerystring?: string;
        lookupCookie?: string;
        lookupLocalStorage?: string;
        lookupSessionStorage?: string;
    };
    interpolation?: {
        escapeValue: boolean;
        format?: (value: any, format?: string, lng?: string) => string;
    };
    debug?: boolean;
}

export const defaultI18nConfig: I18nConfig = {
    defaultLanguage: DEFAULT_LANGUAGE,
    supportedLanguages: Object.keys(LANGUAGE_METADATA) as SupportedLanguage[],
    defaultNamespace: DEFAULT_NAMESPACE,
    namespaces: [
        'common',
        'auth',
        'dashboard',
        'documents',
        'templates',
        'signatures',
        'organizations',
        'users',
        'billing',
        'settings',
        'notifications',
        'errors',
        'validation',
        'emails',
        'legal',
        'help',
        'onboarding',
        'analytics',
        'integrations',
        'api',
        'mobile',
    ],
    fallbackLanguages: FALLBACK_LANGUAGES,
    backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        allowMultiLoading: false,
    },
    detection: {
        order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage', 'cookie'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng',
        lookupSessionStorage: 'i18nextLng',
    },
    interpolation: {
        escapeValue: false, // React already escapes values
    },
    debug: process.env.NODE_ENV === 'development',
};

// Initialize i18next
export async function initializeI18n(config: Partial<I18nConfig> = {}): Promise<typeof i18n> {
    const finalConfig = { ...defaultI18nConfig, ...config };

    await i18n
        .use(Backend)
        .use(LanguageDetector)
        .use(ICU)
        .use(initReactI18next)
        .init({
            lng: finalConfig.defaultLanguage,
            fallbackLng: finalConfig.fallbackLanguages,
            supportedLngs: finalConfig.supportedLanguages,

            defaultNS: finalConfig.defaultNamespace,
            ns: finalConfig.namespaces,

            backend: finalConfig.backend,
            detection: finalConfig.detection,
            interpolation: finalConfig.interpolation,

            debug: finalConfig.debug,

            // Additional options
            load: 'languageOnly', // Don't load country-specific variants unless explicitly defined
            cleanCode: true,

            // React-specific options
            react: {
                useSuspense: false, // We'll handle loading states manually
                bindI18n: 'languageChanged loaded',
                bindI18nStore: 'added removed',
                transEmptyNodeValue: '',
                transSupportBasicHtmlNodes: true,
                transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
            },

            // ICU message format options
            // icu: {
            //     memoize: true,
            //     memoizeFallback: true,
            // },
        });

    return i18n;
}

// Server-side initialization (without browser-specific features)
export async function initializeServerI18n(config: Partial<I18nConfig> = {}): Promise<typeof i18n> {
    const finalConfig = { ...defaultI18nConfig, ...config };

    await i18n
        .use(ICU)
        .init({
            lng: finalConfig.defaultLanguage,
            fallbackLng: finalConfig.fallbackLanguages,
            supportedLngs: finalConfig.supportedLanguages,

            defaultNS: finalConfig.defaultNamespace,
            ns: finalConfig.namespaces,

            interpolation: finalConfig.interpolation,

            debug: finalConfig.debug,

            // Server-specific options
            load: 'languageOnly',
            cleanCode: true,

            // ICU message format options
            // icu: {
            //     memoize: true,
            //     memoizeFallback: true,
            // },

            // Preload resources for server-side rendering
            preload: finalConfig.supportedLanguages,

            // Resources can be loaded synchronously on server
            resources: {}, // Will be populated by the translation loader
        });

    return i18n;
}

export { i18n };
export default i18n;