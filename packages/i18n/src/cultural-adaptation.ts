import { CulturalAdaptation, SupportedLocale, TextDirection, LocalizationContext } from './types';

export class CulturalAdaptationService {
    private adaptations: Map<SupportedLocale, CulturalAdaptation>;

    constructor() {
        this.adaptations = new Map();
        this.initializeDefaultAdaptations();
    }

    async getAdaptation(locale: SupportedLocale): Promise<CulturalAdaptation> {
        const adaptation = this.adaptations.get(locale);
        if (!adaptation) {
            // Return English US as fallback
            return this.adaptations.get(SupportedLocale.EN_US)!;
        }
        return adaptation;
    }

    async setAdaptation(locale: SupportedLocale, adaptation: CulturalAdaptation): Promise<void> {
        this.adaptations.set(locale, adaptation);
    }

    async getAllAdaptations(): Promise<Map<SupportedLocale, CulturalAdaptation>> {
        return new Map(this.adaptations);
    }

    // Helper methods for common cultural adaptations
    async getDateFormat(locale: SupportedLocale, style: 'short' | 'medium' | 'long' | 'full' = 'medium'): Promise<string> {
        const adaptation = await this.getAdaptation(locale);
        return adaptation.dateFormats[style];
    }

    async getTimeFormat(locale: SupportedLocale, style: 'short' | 'medium' | 'long' | 'full' = 'medium'): Promise<string> {
        const adaptation = await this.getAdaptation(locale);
        return adaptation.timeFormats[style];
    }

    async getCurrencyFormat(locale: SupportedLocale): Promise<{ currency: string; currencyDisplay: string }> {
        const adaptation = await this.getAdaptation(locale);
        return adaptation.numberFormats.currency;
    }

    async getAddressFormat(locale: SupportedLocale): Promise<{ format: string; requiredFields: string[] }> {
        const adaptation = await this.getAdaptation(locale);
        return {
            format: adaptation.addressFormat.format,
            requiredFields: adaptation.addressFormat.requiredFields,
        };
    }

    async getPhoneFormat(locale: SupportedLocale): Promise<{ format: string; countryCode: string }> {
        const adaptation = await this.getAdaptation(locale);
        return {
            format: adaptation.phoneFormat.format,
            countryCode: adaptation.phoneFormat.countryCode,
        };
    }

    async getCulturalNotes(locale: SupportedLocale, category?: string): Promise<Array<{ category: string; note: string; importance: string }>> {
        const adaptation = await this.getAdaptation(locale);
        if (category) {
            return adaptation.culturalNotes.filter(note => note.category === category);
        }
        return adaptation.culturalNotes;
    }

    private initializeDefaultAdaptations(): void {
        // English (United States)
        this.adaptations.set(SupportedLocale.EN_US, {
            locale: SupportedLocale.EN_US,
            dateFormats: {
                short: 'M/d/yy',
                medium: 'MMM d, y',
                long: 'MMMM d, y',
                full: 'EEEE, MMMM d, y',
            },
            timeFormats: {
                short: 'h:mm a',
                medium: 'h:mm:ss a',
                long: 'h:mm:ss a z',
                full: 'h:mm:ss a zzzz',
            },
            numberFormats: {
                decimal: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                },
                currency: {
                    currency: 'USD',
                    currencyDisplay: 'symbol',
                },
                percent: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                },
            },
            addressFormat: {
                format: '{name}\n{street}\n{city}, {state} {postalCode}\n{country}',
                requiredFields: ['name', 'street', 'city', 'state', 'postalCode'],
                postalCodePattern: '^\\d{5}(-\\d{4})?$',
            },
            phoneFormat: {
                format: '(###) ###-####',
                countryCode: '+1',
            },
            culturalNotes: [
                {
                    category: 'business',
                    note: 'Business hours are typically 9 AM to 5 PM, Monday through Friday.',
                    importance: 'medium',
                },
                {
                    category: 'communication',
                    note: 'Direct communication style is preferred in business contexts.',
                    importance: 'high',
                },
            ],
        });

        // Spanish (Spain)
        this.adaptations.set(SupportedLocale.ES_ES, {
            locale: SupportedLocale.ES_ES,
            dateFormats: {
                short: 'd/M/yy',
                medium: 'd MMM y',
                long: 'd \'de\' MMMM \'de\' y',
                full: 'EEEE, d \'de\' MMMM \'de\' y',
            },
            timeFormats: {
                short: 'H:mm',
                medium: 'H:mm:ss',
                long: 'H:mm:ss z',
                full: 'H:mm:ss zzzz',
            },
            numberFormats: {
                decimal: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                },
                currency: {
                    currency: 'EUR',
                    currencyDisplay: 'symbol',
                },
                percent: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                },
            },
            addressFormat: {
                format: '{name}\n{street}\n{postalCode} {city}\n{country}',
                requiredFields: ['name', 'street', 'city', 'postalCode'],
                postalCodePattern: '^\\d{5}$',
            },
            phoneFormat: {
                format: '### ### ###',
                countryCode: '+34',
            },
            culturalNotes: [
                {
                    category: 'business',
                    note: 'Business hours are typically 9 AM to 2 PM and 4 PM to 7 PM, with a siesta break.',
                    importance: 'high',
                },
                {
                    category: 'communication',
                    note: 'Personal relationships are important in business. Take time for small talk.',
                    importance: 'high',
                },
            ],
        });

        // French (France)
        this.adaptations.set(SupportedLocale.FR_FR, {
            locale: SupportedLocale.FR_FR,
            dateFormats: {
                short: 'dd/MM/y',
                medium: 'd MMM y',
                long: 'd MMMM y',
                full: 'EEEE d MMMM y',
            },
            timeFormats: {
                short: 'HH:mm',
                medium: 'HH:mm:ss',
                long: 'HH:mm:ss z',
                full: 'HH:mm:ss zzzz',
            },
            numberFormats: {
                decimal: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                },
                currency: {
                    currency: 'EUR',
                    currencyDisplay: 'symbol',
                },
                percent: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                },
            },
            addressFormat: {
                format: '{name}\n{street}\n{postalCode} {city}\n{country}',
                requiredFields: ['name', 'street', 'city', 'postalCode'],
                postalCodePattern: '^\\d{5}$',
            },
            phoneFormat: {
                format: '## ## ## ## ##',
                countryCode: '+33',
            },
            culturalNotes: [
                {
                    category: 'business',
                    note: 'Formal business etiquette is important. Use titles and formal address.',
                    importance: 'high',
                },
                {
                    category: 'communication',
                    note: 'Intellectual discussion and debate are valued in business meetings.',
                    importance: 'medium',
                },
            ],
        });

        // German (Germany)
        this.adaptations.set(SupportedLocale.DE_DE, {
            locale: SupportedLocale.DE_DE,
            dateFormats: {
                short: 'dd.MM.yy',
                medium: 'dd.MM.y',
                long: 'd. MMMM y',
                full: 'EEEE, d. MMMM y',
            },
            timeFormats: {
                short: 'HH:mm',
                medium: 'HH:mm:ss',
                long: 'HH:mm:ss z',
                full: 'HH:mm:ss zzzz',
            },
            numberFormats: {
                decimal: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                },
                currency: {
                    currency: 'EUR',
                    currencyDisplay: 'symbol',
                },
                percent: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                },
            },
            addressFormat: {
                format: '{name}\n{street}\n{postalCode} {city}\n{country}',
                requiredFields: ['name', 'street', 'city', 'postalCode'],
                postalCodePattern: '^\\d{5}$',
            },
            phoneFormat: {
                format: '#### ########',
                countryCode: '+49',
            },
            culturalNotes: [
                {
                    category: 'business',
                    note: 'Punctuality is extremely important. Arrive on time or early.',
                    importance: 'high',
                },
                {
                    category: 'communication',
                    note: 'Direct, straightforward communication is preferred. Be precise and factual.',
                    importance: 'high',
                },
            ],
        });

        // Arabic (Saudi Arabia) - RTL example
        this.adaptations.set(SupportedLocale.AR_SA, {
            locale: SupportedLocale.AR_SA,
            dateFormats: {
                short: 'd/M/yy',
                medium: 'dd‏/MM‏/y',
                long: 'd MMMM y',
                full: 'EEEE، d MMMM y',
            },
            timeFormats: {
                short: 'h:mm a',
                medium: 'h:mm:ss a',
                long: 'h:mm:ss a z',
                full: 'h:mm:ss a zzzz',
            },
            numberFormats: {
                decimal: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                },
                currency: {
                    currency: 'SAR',
                    currencyDisplay: 'symbol',
                },
                percent: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                },
            },
            addressFormat: {
                format: '{name}\n{street}\n{city} {postalCode}\n{country}',
                requiredFields: ['name', 'street', 'city'],
                postalCodePattern: '^\\d{5}$',
            },
            phoneFormat: {
                format: '### ### ####',
                countryCode: '+966',
            },
            culturalNotes: [
                {
                    category: 'business',
                    note: 'Business hours may vary during Ramadan. Friday is the holy day.',
                    importance: 'high',
                },
                {
                    category: 'communication',
                    note: 'Relationship building is crucial. Expect longer negotiation processes.',
                    importance: 'high',
                },
                {
                    category: 'cultural',
                    note: 'Right-to-left text direction. Consider layout implications.',
                    importance: 'high',
                },
            ],
        });

        // Chinese (Simplified)
        this.adaptations.set(SupportedLocale.ZH_CN, {
            locale: SupportedLocale.ZH_CN,
            dateFormats: {
                short: 'y/M/d',
                medium: 'y年M月d日',
                long: 'y年M月d日',
                full: 'y年M月d日EEEE',
            },
            timeFormats: {
                short: 'ah:mm',
                medium: 'ah:mm:ss',
                long: 'z ah:mm:ss',
                full: 'zzzz ah:mm:ss',
            },
            numberFormats: {
                decimal: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                },
                currency: {
                    currency: 'CNY',
                    currencyDisplay: 'symbol',
                },
                percent: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                },
            },
            addressFormat: {
                format: '{country}\n{city}\n{street}\n{name}',
                requiredFields: ['name', 'street', 'city'],
                postalCodePattern: '^\\d{6}$',
            },
            phoneFormat: {
                format: '### #### ####',
                countryCode: '+86',
            },
            culturalNotes: [
                {
                    category: 'business',
                    note: 'Hierarchy and respect for seniority are important in business.',
                    importance: 'high',
                },
                {
                    category: 'communication',
                    note: 'Indirect communication style. Pay attention to context and non-verbal cues.',
                    importance: 'high',
                },
                {
                    category: 'cultural',
                    note: 'Gift giving has specific protocols. Avoid certain numbers and colors.',
                    importance: 'medium',
                },
            ],
        });

        // Japanese
        this.adaptations.set(SupportedLocale.JA_JP, {
            locale: SupportedLocale.JA_JP,
            dateFormats: {
                short: 'y/MM/dd',
                medium: 'y年M月d日',
                long: 'y年M月d日',
                full: 'y年M月d日EEEE',
            },
            timeFormats: {
                short: 'H:mm',
                medium: 'H:mm:ss',
                long: 'H:mm:ss z',
                full: 'H:mm:ss zzzz',
            },
            numberFormats: {
                decimal: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                },
                currency: {
                    currency: 'JPY',
                    currencyDisplay: 'symbol',
                },
                percent: {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                },
            },
            addressFormat: {
                format: '〒{postalCode}\n{country}{city}\n{street}\n{name}',
                requiredFields: ['name', 'street', 'city', 'postalCode'],
                postalCodePattern: '^\\d{3}-\\d{4}$',
            },
            phoneFormat: {
                format: '###-####-####',
                countryCode: '+81',
            },
            culturalNotes: [
                {
                    category: 'business',
                    note: 'Business cards (meishi) exchange is a formal ritual. Use both hands.',
                    importance: 'high',
                },
                {
                    category: 'communication',
                    note: 'Consensus building (nemawashi) is important before formal meetings.',
                    importance: 'high',
                },
                {
                    category: 'cultural',
                    note: 'Bowing and formal politeness levels are important in business.',
                    importance: 'high',
                },
            ],
        });
    }

    // Utility methods
    isRTL(locale: SupportedLocale): boolean {
        const rtlLocales = [
            SupportedLocale.AR_SA,
            SupportedLocale.AR_EG,
            SupportedLocale.HE_IL,
            SupportedLocale.FA_IR,
            SupportedLocale.UR_PK,
        ];
        return rtlLocales.includes(locale);
    }

    getTextDirection(locale: SupportedLocale): TextDirection {
        return this.isRTL(locale) ? TextDirection.RTL : TextDirection.LTR;
    }

    // Missing methods that are referenced in other files
    async createLocalizationContext(locale: SupportedLocale, options?: any): Promise<LocalizationContext> {
        const adaptation = await this.getAdaptation(locale);
        return {
            locale,
            direction: this.getTextDirection(locale),
            currency: adaptation.numberFormats.currency.currency,
            timezone: options?.timezone,
            dateFormat: adaptation.dateFormats.medium,
            timeFormat: adaptation.timeFormats.medium,
            numberFormat: adaptation.numberFormats,
        };
    }

    async formatDate(date: Date, locale: SupportedLocale, options?: { format?: string }): Promise<string> {
        const adaptation = await this.getAdaptation(locale);
        const format = options?.format || 'medium';
        const formatString = adaptation.dateFormats[format as keyof typeof adaptation.dateFormats] || adaptation.dateFormats.medium;

        // Use Intl.DateTimeFormat for proper formatting
        return new Intl.DateTimeFormat(locale).format(date);
    }

    async formatNumber(value: number, locale: SupportedLocale, options?: any): Promise<string> {
        const adaptation = await this.getAdaptation(locale);
        return new Intl.NumberFormat(locale, options).format(value);
    }

    async formatCurrency(amount: number, locale: SupportedLocale, currency?: string): Promise<string> {
        const adaptation = await this.getAdaptation(locale);
        const currencyCode = currency || adaptation.numberFormats.currency.currency;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    }

    async validateAddress(address: any, locale: SupportedLocale): Promise<{ valid: boolean; errors: string[] }> {
        const adaptation = await this.getAdaptation(locale);
        const errors: string[] = [];

        // Check required fields
        for (const field of adaptation.addressFormat.requiredFields) {
            if (!address[field] || address[field].trim() === '') {
                errors.push(`${field} is required`);
            }
        }

        // Validate postal code format if provided
        if (address.postalCode && adaptation.addressFormat.postalCodePattern) {
            const pattern = new RegExp(adaptation.addressFormat.postalCodePattern);
            if (!pattern.test(address.postalCode)) {
                errors.push('Invalid postal code format');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    async formatAddress(address: any, locale: SupportedLocale): Promise<string> {
        const adaptation = await this.getAdaptation(locale);
        let formatted = adaptation.addressFormat.format;

        // Replace placeholders with actual values
        const placeholders = [
            'name', 'street', 'city', 'state', 'postalCode', 'country'
        ];

        for (const placeholder of placeholders) {
            const value = address[placeholder] || '';
            formatted = formatted.replace(new RegExp(`{${placeholder}}`, 'g'), value);
        }

        // Clean up empty lines
        return formatted
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n');
    }

    async formatPhoneNumber(phoneNumber: string, locale: SupportedLocale): Promise<string> {
        const adaptation = await this.getAdaptation(locale);

        // Remove all non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');

        // Apply format pattern
        let formatted = adaptation.phoneFormat.format;
        let digitIndex = 0;

        for (let i = 0; i < formatted.length && digitIndex < digits.length; i++) {
            if (formatted[i] === '#') {
                formatted = formatted.substring(0, i) + digits[digitIndex] + formatted.substring(i + 1);
                digitIndex++;
            }
        }

        return formatted;
    }
}

// Export a default instance for convenience
export const culturalAdaptationService = new CulturalAdaptationService();