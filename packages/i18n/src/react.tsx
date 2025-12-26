import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation, Trans, I18nextProvider } from 'react-i18next';
import { SupportedLanguage, SupportedLocale, TranslationNamespace, LocalizationContext } from './types';
import { i18n, initializeI18n } from './config';
import { rtlManager } from './rtl';
import { culturalAdaptationService } from './cultural-adaptation';
import { LANGUAGE_METADATA } from './languages';

// I18n Context
interface I18nContextValue {
    language: SupportedLanguage;
    setLanguage: (language: SupportedLanguage) => void;
    isRTL: boolean;
    localizationContext: LocalizationContext | null;
    isLoading: boolean;
    error: string | null;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// I18n Provider Props
interface I18nProviderProps {
    children: ReactNode;
    defaultLanguage?: SupportedLanguage;
    supportedLanguages?: SupportedLanguage[];
    onLanguageChange?: (language: SupportedLanguage) => void;
}

// I18n Provider Component
export function I18nProvider({
    children,
    defaultLanguage = SupportedLocale.EN_US,
    supportedLanguages,
    onLanguageChange,
}: I18nProviderProps) {
    const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localizationContext, setLocalizationContext] = useState<LocalizationContext | null>(null);

    useEffect(() => {
        culturalAdaptationService.createLocalizationContext(defaultLanguage).then(setLocalizationContext);
    }, [defaultLanguage]);

    // Initialize i18n
    useEffect(() => {
        const initI18n = async () => {
            try {
                setIsLoading(true);
                setError(null);

                await initializeI18n({
                    defaultLanguage,
                    supportedLanguages,
                });

                setIsLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to initialize i18n');
                setIsLoading(false);
            }
        };

        initI18n();
    }, [defaultLanguage, supportedLanguages]);

    // Handle language changes
    const setLanguage = async (newLanguage: SupportedLanguage) => {
        try {
            setIsLoading(true);
            setError(null);

            // Change i18n language
            await i18n.changeLanguage(newLanguage);

            // Update RTL configuration
            rtlManager.applyRTLToDocument(newLanguage);

            // Update localization context
            culturalAdaptationService.createLocalizationContext(newLanguage).then(setLocalizationContext);

            // Update state
            setLanguageState(newLanguage);

            // Call callback
            onLanguageChange?.(newLanguage);

            setIsLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change language');
            setIsLoading(false);
        }
    };

    // Apply RTL on language change
    useEffect(() => {
        rtlManager.applyRTLToDocument(language);
    }, [language]);

    const contextValue: I18nContextValue = {
        language,
        setLanguage,
        isRTL: rtlManager.isRTL(language),
        localizationContext,
        isLoading,
        error,
    };

    return (
        <I18nContext.Provider value={contextValue}>
            <I18nextProvider i18n={i18n}>
                {children}
            </I18nextProvider>
        </I18nContext.Provider>
    );
}

// Hook to use I18n context
export function useI18n(): I18nContextValue {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

// Enhanced translation hook
export function useTranslations(namespace?: TranslationNamespace) {
    const { t, i18n: i18nInstance } = useTranslation(namespace);
    const { language, isRTL, localizationContext } = useI18n();

    return {
        t,
        language,
        isRTL,
        localizationContext,
        changeLanguage: i18nInstance.changeLanguage,
        exists: i18nInstance.exists,
        getFixedT: i18nInstance.getFixedT,
    };
}

// Language Selector Component
interface LanguageSelectorProps {
    className?: string;
    showFlags?: boolean;
    showNativeNames?: boolean;
    supportedLanguages?: SupportedLanguage[];
    onLanguageChange?: (language: SupportedLanguage) => void;
}

export function LanguageSelector({
    className = '',
    showFlags = true,
    showNativeNames = true,
    supportedLanguages,
    onLanguageChange,
}: LanguageSelectorProps) {
    const { language, setLanguage } = useI18n();
    const { t } = useTranslations('common');

    const languages = supportedLanguages || Object.keys(LANGUAGE_METADATA) as SupportedLanguage[];

    const handleLanguageChange = async (newLanguage: SupportedLanguage) => {
        await setLanguage(newLanguage);
        onLanguageChange?.(newLanguage);
    };

    return (
        <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className={`language-selector ${className}`}
            aria-label={t('selectLanguage', 'Select Language')}
        >
            {languages.map((lang) => {
                const metadata = LANGUAGE_METADATA[lang];
                return (
                    <option key={lang} value={lang}>
                        {showFlags && metadata.flag && `${metadata.flag} `}
                        {showNativeNames ? metadata.nativeName : metadata.name}
                    </option>
                );
            })}
        </select>
    );
}

// Language Switcher Component (Button-based)
interface LanguageSwitcherProps {
    className?: string;
    showFlags?: boolean;
    showNativeNames?: boolean;
    supportedLanguages?: SupportedLanguage[];
    onLanguageChange?: (language: SupportedLanguage) => void;
}

export function LanguageSwitcher({
    className = '',
    showFlags = true,
    showNativeNames = true,
    supportedLanguages,
    onLanguageChange,
}: LanguageSwitcherProps) {
    const { language, setLanguage } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    const languages = supportedLanguages || Object.keys(LANGUAGE_METADATA) as SupportedLanguage[];
    const currentMetadata = LANGUAGE_METADATA[language];

    const handleLanguageChange = async (newLanguage: SupportedLanguage) => {
        await setLanguage(newLanguage);
        onLanguageChange?.(newLanguage);
        setIsOpen(false);
    };

    return (
        <div className={`language-switcher relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="language-switcher-button flex items-center space-x-2 px-3 py-2 border rounded-md hover:bg-gray-50"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {showFlags && currentMetadata.flag && <span>{currentMetadata.flag}</span>}
                <span>
                    {showNativeNames ? currentMetadata.nativeName : currentMetadata.name}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="language-switcher-dropdown absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50">
                    {languages.map((lang) => {
                        const metadata = LANGUAGE_METADATA[lang];
                        return (
                            <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 ${lang === language ? 'bg-blue-50 text-blue-600' : ''
                                    }`}
                                role="option"
                                aria-selected={lang === language}
                            >
                                {showFlags && metadata.flag && <span>{metadata.flag}</span>}
                                <span>
                                    {showNativeNames ? metadata.nativeName : metadata.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// RTL Wrapper Component
interface RTLWrapperProps {
    children: ReactNode;
    className?: string;
}

export function RTLWrapper({ children, className = '' }: RTLWrapperProps) {
    const { isRTL } = useI18n();

    return (
        <div
            className={`rtl-wrapper ${isRTL ? 'rtl' : 'ltr'} ${className}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {children}
        </div>
    );
}

// Formatted Date Component
interface FormattedDateProps {
    date: Date | string;
    format?: string;
    className?: string;
}

export function FormattedDate({ date, format, className = '' }: FormattedDateProps) {
    const { language } = useI18n();
    const [formattedDate, setFormattedDate] = useState<string>('');

    useEffect(() => {
        culturalAdaptationService.formatDate(date as Date, language, { format }).then(setFormattedDate);
    }, [date, language, format]);

    return <span className={`formatted-date ${className}`}>{formattedDate}</span>;
}

// Formatted Number Component
interface FormattedNumberProps {
    value: number;
    style?: 'decimal' | 'currency' | 'percent';
    currency?: string;
    className?: string;
}

export function FormattedNumber({
    value,
    style = 'decimal',
    currency,
    className = '',
}: FormattedNumberProps) {
    const { language } = useI18n();
    const [formattedNumber, setFormattedNumber] = useState<string>('');

    useEffect(() => {
        culturalAdaptationService.formatNumber(value, language, {
            style,
            currency,
        }).then(setFormattedNumber);
    }, [value, language, style, currency]);

    return <span className={`formatted-number ${className}`}>{formattedNumber}</span>;
}

// Formatted Currency Component
interface FormattedCurrencyProps {
    amount: number;
    currency?: string;
    className?: string;
}

export function FormattedCurrency({ amount, currency, className = '' }: FormattedCurrencyProps) {
    return (
        <FormattedNumber
            value={amount}
            style="currency"
            currency={currency}
            className={`formatted-currency ${className}`}
        />
    );
}

// Translation Loading Component
interface TranslationLoadingProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function TranslationLoading({ children, fallback }: TranslationLoadingProps) {
    const { isLoading, error } = useI18n();

    if (error) {
        return (
            <div className="translation-error p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">Translation Error: {error}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="translation-loading">
                {fallback || (
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading translations...</span>
                    </div>
                )}
            </div>
        );
    }

    return <>{children}</>;
}

// Higher-order component for translation loading
export function withTranslationLoading<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function TranslationLoadingWrapper(props: P) {
        return (
            <TranslationLoading fallback={fallback}>
                <Component {...props} />
            </TranslationLoading>
        );
    };
}

// Export commonly used components and hooks
export { Trans, useTranslation };
export type { I18nContextValue, LanguageSelectorProps, LanguageSwitcherProps };