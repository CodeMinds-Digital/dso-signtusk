import { LanguageMetadata, SupportedLanguage, SupportedLocale, TextDirection } from './types';

// Comprehensive language metadata configuration
export const LANGUAGE_METADATA: Record<SupportedLanguage, LanguageMetadata> = {
    [SupportedLocale.EN_US]: {
        code: SupportedLocale.EN_US,
        name: 'English (United States)',
        nativeName: 'English (United States)',
        flag: '🇺🇸',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'US',
        currency: 'USD',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'h:mm a',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: '$',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.EN_GB]: {
        code: SupportedLocale.EN_GB,
        name: 'English (United Kingdom)',
        nativeName: 'English (United Kingdom)',
        flag: '🇬🇧',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'GB',
        currency: 'GBP',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: '£',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.ES_ES]: {
        code: SupportedLocale.ES_ES,
        name: 'Spanish (Spain)',
        nativeName: 'Español (España)',
        flag: '🇪🇸',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'ES',
        currency: 'EUR',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: ',',
            thousands: '.',
            currency: '€',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.FR_FR]: {
        code: SupportedLocale.FR_FR,
        name: 'French (France)',
        nativeName: 'Français (France)',
        flag: '🇫🇷',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'FR',
        currency: 'EUR',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: ',',
            thousands: ' ',
            currency: '€',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.DE_DE]: {
        code: SupportedLocale.DE_DE,
        name: 'German (Germany)',
        nativeName: 'Deutsch (Deutschland)',
        flag: '🇩🇪',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'DE',
        currency: 'EUR',
        dateFormat: 'dd.MM.yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: ',',
            thousands: '.',
            currency: '€',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.IT_IT]: {
        code: SupportedLocale.IT_IT,
        name: 'Italian (Italy)',
        nativeName: 'Italiano (Italia)',
        flag: '🇮🇹',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'IT',
        currency: 'EUR',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: ',',
            thousands: '.',
            currency: '€',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.PT_BR]: {
        code: SupportedLocale.PT_BR,
        name: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        flag: '🇧🇷',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'BR',
        currency: 'BRL',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: ',',
            thousands: '.',
            currency: 'R$',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.NL_NL]: {
        code: SupportedLocale.NL_NL,
        name: 'Dutch (Netherlands)',
        nativeName: 'Nederlands (Nederland)',
        flag: '🇳🇱',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'NL',
        currency: 'EUR',
        dateFormat: 'dd-MM-yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: ',',
            thousands: '.',
            currency: '€',
        },
        pluralRules: ['one', 'other'],
    },
    [SupportedLocale.AR_SA]: {
        code: SupportedLocale.AR_SA,
        name: 'Arabic (Saudi Arabia)',
        nativeName: 'العربية (المملكة العربية السعودية)',
        flag: '🇸🇦',
        rtl: true,
        direction: TextDirection.RTL,
        region: 'SA',
        currency: 'SAR',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: 'ر.س',
        },
        pluralRules: ['zero', 'one', 'two', 'few', 'many', 'other'],
    },
    [SupportedLocale.HE_IL]: {
        code: SupportedLocale.HE_IL,
        name: 'Hebrew (Israel)',
        nativeName: 'עברית (ישראל)',
        flag: '🇮🇱',
        rtl: true,
        direction: TextDirection.RTL,
        region: 'IL',
        currency: 'ILS',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: '₪',
        },
        pluralRules: ['one', 'two', 'many', 'other'],
    },
    [SupportedLocale.ZH_CN]: {
        code: SupportedLocale.ZH_CN,
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        flag: '🇨🇳',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'CN',
        currency: 'CNY',
        dateFormat: 'yyyy/MM/dd',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: '¥',
        },
        pluralRules: ['other'],
    },
    [SupportedLocale.ZH_TW]: {
        code: SupportedLocale.ZH_TW,
        name: 'Chinese (Traditional)',
        nativeName: '繁體中文',
        flag: '🇹🇼',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'TW',
        currency: 'TWD',
        dateFormat: 'yyyy/MM/dd',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: 'NT$',
        },
        pluralRules: ['other'],
    },
    [SupportedLocale.JA_JP]: {
        code: SupportedLocale.JA_JP,
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'JP',
        currency: 'JPY',
        dateFormat: 'yyyy/MM/dd',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: '¥',
        },
        pluralRules: ['other'],
    },
    [SupportedLocale.KO_KR]: {
        code: SupportedLocale.KO_KR,
        name: 'Korean',
        nativeName: '한국어',
        flag: '🇰🇷',
        rtl: false,
        direction: TextDirection.LTR,
        region: 'KR',
        currency: 'KRW',
        dateFormat: 'yyyy. MM. dd.',
        timeFormat: 'HH:mm',
        numberFormat: {
            decimal: '.',
            thousands: ',',
            currency: '₩',
        },
        pluralRules: ['other'],
    },
    // Add more basic entries for other supported locales
    [SupportedLocale.EN_CA]: { code: SupportedLocale.EN_CA, name: 'English (Canada)', nativeName: 'English (Canada)', flag: '🇨🇦', rtl: false, direction: TextDirection.LTR, region: 'CA', currency: 'CAD', dateFormat: 'dd/MM/yyyy', timeFormat: 'h:mm a', numberFormat: { decimal: '.', thousands: ',', currency: 'C$' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.EN_AU]: { code: SupportedLocale.EN_AU, name: 'English (Australia)', nativeName: 'English (Australia)', flag: '🇦🇺', rtl: false, direction: TextDirection.LTR, region: 'AU', currency: 'AUD', dateFormat: 'dd/MM/yyyy', timeFormat: 'h:mm a', numberFormat: { decimal: '.', thousands: ',', currency: 'A$' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.ES_MX]: { code: SupportedLocale.ES_MX, name: 'Spanish (Mexico)', nativeName: 'Español (México)', flag: '🇲🇽', rtl: false, direction: TextDirection.LTR, region: 'MX', currency: 'MXN', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: '$' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.ES_AR]: { code: SupportedLocale.ES_AR, name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', flag: '🇦🇷', rtl: false, direction: TextDirection.LTR, region: 'AR', currency: 'ARS', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', currency: '$' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.ES_CO]: { code: SupportedLocale.ES_CO, name: 'Spanish (Colombia)', nativeName: 'Español (Colombia)', flag: '🇨🇴', rtl: false, direction: TextDirection.LTR, region: 'CO', currency: 'COP', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', currency: '$' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.FR_CA]: { code: SupportedLocale.FR_CA, name: 'French (Canada)', nativeName: 'Français (Canada)', flag: '🇨🇦', rtl: false, direction: TextDirection.LTR, region: 'CA', currency: 'CAD', dateFormat: 'yyyy-MM-dd', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', currency: 'C$' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.FR_BE]: { code: SupportedLocale.FR_BE, name: 'French (Belgium)', nativeName: 'Français (Belgique)', flag: '🇧🇪', rtl: false, direction: TextDirection.LTR, region: 'BE', currency: 'EUR', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', currency: '€' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.FR_CH]: { code: SupportedLocale.FR_CH, name: 'French (Switzerland)', nativeName: 'Français (Suisse)', flag: '🇨🇭', rtl: false, direction: TextDirection.LTR, region: 'CH', currency: 'CHF', dateFormat: 'dd.MM.yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: "'", currency: 'CHF' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.DE_AT]: { code: SupportedLocale.DE_AT, name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', flag: '🇦🇹', rtl: false, direction: TextDirection.LTR, region: 'AT', currency: 'EUR', dateFormat: 'dd.MM.yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', currency: '€' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.DE_CH]: { code: SupportedLocale.DE_CH, name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', flag: '🇨🇭', rtl: false, direction: TextDirection.LTR, region: 'CH', currency: 'CHF', dateFormat: 'dd.MM.yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: "'", currency: 'CHF' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.PT_PT]: { code: SupportedLocale.PT_PT, name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', flag: '🇵🇹', rtl: false, direction: TextDirection.LTR, region: 'PT', currency: 'EUR', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', currency: '€' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.AR_EG]: { code: SupportedLocale.AR_EG, name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)', flag: '🇪🇬', rtl: true, direction: TextDirection.RTL, region: 'EG', currency: 'EGP', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: 'ج.م' }, pluralRules: ['zero', 'one', 'two', 'few', 'many', 'other'] },
    [SupportedLocale.FA_IR]: { code: SupportedLocale.FA_IR, name: 'Persian (Iran)', nativeName: 'فارسی (ایران)', flag: '🇮🇷', rtl: true, direction: TextDirection.RTL, region: 'IR', currency: 'IRR', dateFormat: 'yyyy/MM/dd', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: '﷼' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.HI_IN]: { code: SupportedLocale.HI_IN, name: 'Hindi (India)', nativeName: 'हिन्दी (भारत)', flag: '🇮🇳', rtl: false, direction: TextDirection.LTR, region: 'IN', currency: 'INR', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: '₹' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.BN_BD]: { code: SupportedLocale.BN_BD, name: 'Bengali (Bangladesh)', nativeName: 'বাংলা (বাংলাদেশ)', flag: '🇧🇩', rtl: false, direction: TextDirection.LTR, region: 'BD', currency: 'BDT', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: '৳' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.UR_PK]: { code: SupportedLocale.UR_PK, name: 'Urdu (Pakistan)', nativeName: 'اردو (پاکستان)', flag: '🇵🇰', rtl: true, direction: TextDirection.RTL, region: 'PK', currency: 'PKR', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: '₨' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.TH_TH]: { code: SupportedLocale.TH_TH, name: 'Thai (Thailand)', nativeName: 'ไทย (ประเทศไทย)', flag: '🇹🇭', rtl: false, direction: TextDirection.LTR, region: 'TH', currency: 'THB', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: '฿' }, pluralRules: ['other'] },
    [SupportedLocale.VI_VN]: { code: SupportedLocale.VI_VN, name: 'Vietnamese (Vietnam)', nativeName: 'Tiếng Việt (Việt Nam)', flag: '🇻🇳', rtl: false, direction: TextDirection.LTR, region: 'VN', currency: 'VND', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', currency: '₫' }, pluralRules: ['other'] },
    [SupportedLocale.ID_ID]: { code: SupportedLocale.ID_ID, name: 'Indonesian (Indonesia)', nativeName: 'Bahasa Indonesia (Indonesia)', flag: '🇮🇩', rtl: false, direction: TextDirection.LTR, region: 'ID', currency: 'IDR', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', currency: 'Rp' }, pluralRules: ['other'] },
    [SupportedLocale.MS_MY]: { code: SupportedLocale.MS_MY, name: 'Malay (Malaysia)', nativeName: 'Bahasa Melayu (Malaysia)', flag: '🇲🇾', rtl: false, direction: TextDirection.LTR, region: 'MY', currency: 'MYR', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: 'RM' }, pluralRules: ['other'] },
    [SupportedLocale.SV_SE]: { code: SupportedLocale.SV_SE, name: 'Swedish (Sweden)', nativeName: 'Svenska (Sverige)', flag: '🇸🇪', rtl: false, direction: TextDirection.LTR, region: 'SE', currency: 'SEK', dateFormat: 'yyyy-MM-dd', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', currency: 'kr' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.DA_DK]: { code: SupportedLocale.DA_DK, name: 'Danish (Denmark)', nativeName: 'Dansk (Danmark)', flag: '🇩🇰', rtl: false, direction: TextDirection.LTR, region: 'DK', currency: 'DKK', dateFormat: 'dd-MM-yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: '.', currency: 'kr' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.NO_NO]: { code: SupportedLocale.NO_NO, name: 'Norwegian (Norway)', nativeName: 'Norsk (Norge)', flag: '🇳🇴', rtl: false, direction: TextDirection.LTR, region: 'NO', currency: 'NOK', dateFormat: 'dd.MM.yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', currency: 'kr' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.FI_FI]: { code: SupportedLocale.FI_FI, name: 'Finnish (Finland)', nativeName: 'Suomi (Suomi)', flag: '🇫🇮', rtl: false, direction: TextDirection.LTR, region: 'FI', currency: 'EUR', dateFormat: 'd.M.yyyy', timeFormat: 'H:mm', numberFormat: { decimal: ',', thousands: ' ', currency: '€' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.PL_PL]: { code: SupportedLocale.PL_PL, name: 'Polish (Poland)', nativeName: 'Polski (Polska)', flag: '🇵🇱', rtl: false, direction: TextDirection.LTR, region: 'PL', currency: 'PLN', dateFormat: 'dd.MM.yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', currency: 'zł' }, pluralRules: ['one', 'few', 'many', 'other'] },
    [SupportedLocale.RU_RU]: { code: SupportedLocale.RU_RU, name: 'Russian (Russia)', nativeName: 'Русский (Россия)', flag: '🇷🇺', rtl: false, direction: TextDirection.LTR, region: 'RU', currency: 'RUB', dateFormat: 'dd.MM.yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: ',', thousands: ' ', currency: '₽' }, pluralRules: ['one', 'few', 'many', 'other'] },
    [SupportedLocale.SW_KE]: { code: SupportedLocale.SW_KE, name: 'Swahili (Kenya)', nativeName: 'Kiswahili (Kenya)', flag: '🇰🇪', rtl: false, direction: TextDirection.LTR, region: 'KE', currency: 'KES', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: 'KSh' }, pluralRules: ['one', 'other'] },
    [SupportedLocale.AF_ZA]: { code: SupportedLocale.AF_ZA, name: 'Afrikaans (South Africa)', nativeName: 'Afrikaans (Suid-Afrika)', flag: '🇿🇦', rtl: false, direction: TextDirection.LTR, region: 'ZA', currency: 'ZAR', dateFormat: 'yyyy/MM/dd', timeFormat: 'HH:mm', numberFormat: { decimal: '.', thousands: ',', currency: 'R' }, pluralRules: ['one', 'other'] },
};

// Helper functions for language operations
export function getLanguageMetadata(language: SupportedLanguage): LanguageMetadata {
    return LANGUAGE_METADATA[language];
}

export function isRTLLanguage(language: SupportedLanguage): boolean {
    return LANGUAGE_METADATA[language].rtl;
}

export function getSupportedLanguages(): SupportedLanguage[] {
    return Object.keys(LANGUAGE_METADATA) as SupportedLanguage[];
}

export function getLanguagesByRegion(region: string): SupportedLanguage[] {
    return getSupportedLanguages().filter(lang =>
        LANGUAGE_METADATA[lang].region === region
    );
}

export function getRTLLanguages(): SupportedLanguage[] {
    return getSupportedLanguages().filter(lang =>
        LANGUAGE_METADATA[lang].rtl
    );
}

export function getLanguageFlag(language: SupportedLanguage): string {
    return LANGUAGE_METADATA[language].flag || '';
}

export function getLanguageNativeName(language: SupportedLanguage): string {
    return LANGUAGE_METADATA[language].nativeName;
}