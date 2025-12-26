import { z } from 'zod';

// Supported locales
export enum SupportedLocale {
    // English variants
    EN_US = 'en-US',
    EN_GB = 'en-GB',
    EN_CA = 'en-CA',
    EN_AU = 'en-AU',

    // Spanish variants
    ES_ES = 'es-ES',
    ES_MX = 'es-MX',
    ES_AR = 'es-AR',
    ES_CO = 'es-CO',

    // French variants
    FR_FR = 'fr-FR',
    FR_CA = 'fr-CA',
    FR_BE = 'fr-BE',
    FR_CH = 'fr-CH',

    // German variants
    DE_DE = 'de-DE',
    DE_AT = 'de-AT',
    DE_CH = 'de-CH',

    // Italian
    IT_IT = 'it-IT',

    // Portuguese variants
    PT_BR = 'pt-BR',
    PT_PT = 'pt-PT',

    // Asian languages
    ZH_CN = 'zh-CN', // Simplified Chinese
    ZH_TW = 'zh-TW', // Traditional Chinese
    JA_JP = 'ja-JP', // Japanese
    KO_KR = 'ko-KR', // Korean

    // Other European languages
    NL_NL = 'nl-NL', // Dutch
    SV_SE = 'sv-SE', // Swedish
    DA_DK = 'da-DK', // Danish
    NO_NO = 'no-NO', // Norwegian
    FI_FI = 'fi-FI', // Finnish
    PL_PL = 'pl-PL', // Polish
    RU_RU = 'ru-RU', // Russian

    // Middle Eastern and RTL languages
    AR_SA = 'ar-SA', // Arabic (Saudi Arabia)
    AR_EG = 'ar-EG', // Arabic (Egypt)
    HE_IL = 'he-IL', // Hebrew
    FA_IR = 'fa-IR', // Persian/Farsi

    // Indian subcontinent
    HI_IN = 'hi-IN', // Hindi
    BN_BD = 'bn-BD', // Bengali
    UR_PK = 'ur-PK', // Urdu

    // Southeast Asian
    TH_TH = 'th-TH', // Thai
    VI_VN = 'vi-VN', // Vietnamese
    ID_ID = 'id-ID', // Indonesian
    MS_MY = 'ms-MY', // Malay

    // African languages
    SW_KE = 'sw-KE', // Swahili
    AF_ZA = 'af-ZA', // Afrikaans
}

// Text direction
export enum TextDirection {
    LTR = 'ltr', // Left-to-right
    RTL = 'rtl', // Right-to-left
}

// Number format styles
export enum NumberFormatStyle {
    DECIMAL = 'decimal',
    CURRENCY = 'currency',
    PERCENT = 'percent',
    UNIT = 'unit',
}

// Date format styles
export enum DateFormatStyle {
    FULL = 'full',
    LONG = 'long',
    MEDIUM = 'medium',
    SHORT = 'short',
}

// Translation status
export enum TranslationStatus {
    DRAFT = 'draft',
    IN_REVIEW = 'in_review',
    APPROVED = 'approved',
    PUBLISHED = 'published',
    DEPRECATED = 'deprecated',
}

// Translation priority
export enum TranslationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

// Locale configuration schema
export const LocaleConfigSchema = z.object({
    code: z.nativeEnum(SupportedLocale),
    name: z.string(),
    nativeName: z.string(),
    direction: z.nativeEnum(TextDirection),
    currency: z.string().optional(),
    dateFormat: z.string(),
    timeFormat: z.string(),
    numberFormat: z.object({
        decimal: z.string(),
        thousands: z.string(),
        grouping: z.array(z.number()),
    }),
    pluralRules: z.array(z.string()),
    fallback: z.nativeEnum(SupportedLocale).optional(),
    enabled: z.boolean().default(true),
});

export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;

// Translation key schema
export const TranslationKeySchema = z.object({
    id: z.string(),
    key: z.string(),
    namespace: z.string(),
    description: z.string().optional(),
    context: z.string().optional(),
    maxLength: z.number().optional(),
    pluralizable: z.boolean().default(false),
    variables: z.array(z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'date', 'currency']),
        required: z.boolean().default(true),
        description: z.string().optional(),
    })).default([]),
    tags: z.array(z.string()).default([]),
    priority: z.nativeEnum(TranslationPriority).default(TranslationPriority.MEDIUM),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string(),
});

export type TranslationKey = z.infer<typeof TranslationKeySchema>;

// Translation value schema
export const TranslationValueSchema = z.object({
    id: z.string(),
    keyId: z.string(),
    locale: z.nativeEnum(SupportedLocale),
    value: z.string(),
    pluralForms: z.record(z.string(), z.string()).optional(),
    status: z.nativeEnum(TranslationStatus),
    version: z.number().default(1),
    translatedBy: z.string().optional(),
    reviewedBy: z.string().optional(),
    approvedBy: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type TranslationValue = z.infer<typeof TranslationValueSchema>;

// Translation project schema
export const TranslationProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    sourceLocale: z.nativeEnum(SupportedLocale),
    targetLocales: z.array(z.nativeEnum(SupportedLocale)),
    organizationId: z.string(),
    settings: z.object({
        autoTranslate: z.boolean().default(false),
        requireReview: z.boolean().default(true),
        allowMachineTranslation: z.boolean().default(false),
        qualityThreshold: z.number().min(0).max(100).default(80),
    }),
    progress: z.record(z.string(), z.number()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string(),
});

export type TranslationProject = z.infer<typeof TranslationProjectSchema>;

// Additional type aliases for compatibility
export type SupportedLanguage = SupportedLocale;
export type TranslationNamespace = string;
export type TranslationContent = {
    id: string;
    key: string;
    value: string;
    namespace: string;
    language: SupportedLocale;
    status: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
};
export type TranslationWorkflow = {
    id: string;
    projectId: string;
    organizationId: string;
    status: TranslationStatus;
    assignedTo?: string;
    dueDate?: Date;
    createdAt: Date;
    steps: Array<{
        id: string;
        name: string;
        status: 'pending' | 'in_progress' | 'completed';
        assignedTo?: string;
        completedAt?: Date;
    }>;
};
export type TranslationMemory = TranslationMemoryEntry[];
export type TranslationServiceProvider = TranslationProvider & {
    id: string;
    supportedLanguages: SupportedLocale[];
};

// Cultural adaptation settings
export const CulturalAdaptationSchema = z.object({
    locale: z.nativeEnum(SupportedLocale),
    dateFormats: z.object({
        short: z.string(),
        medium: z.string(),
        long: z.string(),
        full: z.string(),
    }),
    timeFormats: z.object({
        short: z.string(),
        medium: z.string(),
        long: z.string(),
        full: z.string(),
    }),
    numberFormats: z.object({
        decimal: z.object({
            minimumFractionDigits: z.number().default(0),
            maximumFractionDigits: z.number().default(3),
        }),
        currency: z.object({
            currency: z.string(),
            currencyDisplay: z.enum(['symbol', 'code', 'name']).default('symbol'),
        }),
        percent: z.object({
            minimumFractionDigits: z.number().default(0),
            maximumFractionDigits: z.number().default(2),
        }),
    }),
    addressFormat: z.object({
        format: z.string(),
        requiredFields: z.array(z.string()),
        postalCodePattern: z.string().optional(),
    }),
    phoneFormat: z.object({
        format: z.string(),
        countryCode: z.string(),
        nationalPrefix: z.string().optional(),
    }),
    culturalNotes: z.array(z.object({
        category: z.string(),
        note: z.string(),
        importance: z.enum(['low', 'medium', 'high']),
    })).default([]),
});

export type CulturalAdaptation = z.infer<typeof CulturalAdaptationSchema>;

// Translation memory entry
export const TranslationMemoryEntrySchema = z.object({
    id: z.string(),
    sourceText: z.string(),
    targetText: z.string(),
    sourceLocale: z.nativeEnum(SupportedLocale),
    targetLocale: z.nativeEnum(SupportedLocale),
    context: z.string().optional(),
    domain: z.string().optional(),
    quality: z.number().min(0).max(100),
    usage: z.number().default(0),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type TranslationMemoryEntry = z.infer<typeof TranslationMemoryEntrySchema>;

// Export schemas as values for runtime use
export const I18nSchemas = {
    LocaleConfig: LocaleConfigSchema,
    TranslationKey: TranslationKeySchema,
    TranslationValue: TranslationValueSchema,
    TranslationProject: TranslationProjectSchema,
    CulturalAdaptation: CulturalAdaptationSchema,
    TranslationMemoryEntry: TranslationMemoryEntrySchema,
    TranslationValidation: z.object({
        key: z.string(),
        value: z.string(),
        namespace: z.string(),
        language: z.nativeEnum(SupportedLocale),
    }),
};

// Language metadata type
export type LanguageMetadata = {
    code: SupportedLocale;
    name: string;
    nativeName: string;
    direction: TextDirection;
    rtl: boolean;
    region?: string;
    script?: string;
    flag?: string;
    currency?: string;
    dateFormat?: string;
    timeFormat?: string;
    numberFormat?: {
        decimal: string;
        thousands: string;
        currency: string;
    };
    pluralRules?: string[];
};

// RTL Configuration type
export type RTLConfiguration = {
    locale: SupportedLocale;
    direction: TextDirection;
    mirrorLayout: boolean;
    textAlign: 'left' | 'right' | 'center';
    iconDirection: 'normal' | 'mirrored';
};

// Localization context type
export type LocalizationContext = {
    locale: SupportedLocale;
    direction: TextDirection;
    currency?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    numberFormat?: any;
};

// Internationalization service interface
export interface I18nService {
    // Locale management
    getSupportedLocales(): Promise<LocaleConfig[]>;
    getLocaleConfig(locale: SupportedLocale): Promise<LocaleConfig>;
    setUserLocale(userId: string, locale: SupportedLocale): Promise<void>;
    getUserLocale(userId: string): Promise<SupportedLocale>;
    detectLocale(request: any): Promise<SupportedLocale>;

    // Translation management
    getTranslation(key: string, locale: SupportedLocale, variables?: Record<string, any>): Promise<string>;
    getTranslations(namespace: string, locale: SupportedLocale): Promise<Record<string, string>>;
    setTranslation(key: string, locale: SupportedLocale, value: string): Promise<void>;
    bulkSetTranslations(translations: Array<{ key: string; locale: SupportedLocale; value: string }>): Promise<void>;

    // Translation projects
    createProject(project: Omit<TranslationProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<TranslationProject>;
    getProject(projectId: string): Promise<TranslationProject>;
    updateProject(projectId: string, updates: Partial<TranslationProject>): Promise<TranslationProject>;
    deleteProject(projectId: string): Promise<void>;

    // Translation workflow
    submitForTranslation(keyId: string, targetLocales: SupportedLocale[]): Promise<void>;
    reviewTranslation(translationId: string, approved: boolean, notes?: string): Promise<void>;
    publishTranslations(projectId: string, locale: SupportedLocale): Promise<void>;

    // Cultural adaptation
    getCulturalAdaptation(locale: SupportedLocale): Promise<CulturalAdaptation>;
    formatDate(date: Date, locale: SupportedLocale, style?: DateFormatStyle): Promise<string>;
    formatNumber(number: number, locale: SupportedLocale, style?: NumberFormatStyle, options?: any): Promise<string>;
    formatCurrency(amount: number, locale: SupportedLocale, currency?: string): Promise<string>;
    formatRelativeTime(date: Date, locale: SupportedLocale): Promise<string>;

    // Translation memory
    searchTranslationMemory(text: string, sourceLocale: SupportedLocale, targetLocale: SupportedLocale): Promise<TranslationMemoryEntry[]>;
    addToTranslationMemory(entry: Omit<TranslationMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
}

// Translation provider interface
export interface TranslationProvider {
    name: string;
    translate(text: string, sourceLocale: SupportedLocale, targetLocale: SupportedLocale): Promise<string>;
    translateBatch(texts: string[], sourceLocale: SupportedLocale, targetLocale: SupportedLocale): Promise<string[]>;
    getSupportedLocales(): Promise<SupportedLocale[]>;
    getQualityScore(translation: string, sourceText: string): Promise<number>;
}

// Locale detector interface
export interface LocaleDetector {
    detect(request: any): Promise<SupportedLocale>;
    detectFromAcceptLanguage(acceptLanguage: string): Promise<SupportedLocale>;
    detectFromUserAgent(userAgent: string): Promise<SupportedLocale>;
    detectFromIP(ipAddress: string): Promise<SupportedLocale>;
}

// Translation cache interface
export interface TranslationCache {
    get(key: string, locale: SupportedLocale): Promise<string | null>;
    set(key: string, locale: SupportedLocale, value: string, ttl?: number): Promise<void>;
    delete(key: string, locale?: SupportedLocale): Promise<void>;
    clear(): Promise<void>;
    getStats(): Promise<{ hits: number; misses: number; size: number }>;
}

// I18n errors
export class I18nError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'I18nError';
    }
}

export class LocaleNotSupportedError extends I18nError {
    constructor(locale: string) {
        super(`Locale not supported: ${locale}`, 'LOCALE_NOT_SUPPORTED');
    }
}

export class TranslationNotFoundError extends I18nError {
    constructor(key: string, locale: string) {
        super(`Translation not found for key '${key}' in locale '${locale}'`, 'TRANSLATION_NOT_FOUND');
    }
}

export class TranslationProviderError extends I18nError {
    constructor(provider: string, message: string) {
        super(`Translation provider '${provider}' error: ${message}`, 'TRANSLATION_PROVIDER_ERROR');
    }
}