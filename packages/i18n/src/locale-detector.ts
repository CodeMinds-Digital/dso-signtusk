import { LocaleDetector, SupportedLocale } from './types';

export class LocaleDetectorImpl implements LocaleDetector {
    private supportedLocales: Set<SupportedLocale>;
    private fallbackLocale: SupportedLocale;

    constructor(
        supportedLocales?: SupportedLocale[],
        fallbackLocale: SupportedLocale = SupportedLocale.EN_US
    ) {
        this.supportedLocales = new Set(supportedLocales || Object.values(SupportedLocale));
        this.fallbackLocale = fallbackLocale;
    }

    async detect(request: any): Promise<SupportedLocale> {
        // Try multiple detection methods in order of preference
        const detectionMethods = [
            () => this.detectFromQuery(request),
            () => this.detectFromCookie(request),
            () => this.detectFromAcceptLanguage(request.headers?.['accept-language']),
            () => this.detectFromUserAgent(request.headers?.['user-agent']),
            () => this.detectFromIP(request.ip || request.connection?.remoteAddress),
        ];

        for (const method of detectionMethods) {
            try {
                const locale = await method();
                if (locale && this.supportedLocales.has(locale)) {
                    return locale;
                }
            } catch (error) {
                // Continue to next method if this one fails
                console.warn('Locale detection method failed:', error);
            }
        }

        return this.fallbackLocale;
    }

    async detectFromAcceptLanguage(acceptLanguage?: string): Promise<SupportedLocale> {
        if (!acceptLanguage) {
            return this.fallbackLocale;
        }

        // Parse Accept-Language header
        const languages = this.parseAcceptLanguage(acceptLanguage);

        for (const lang of languages) {
            // Try exact match first
            const exactMatch = this.findExactLocaleMatch(lang.code);
            if (exactMatch) {
                return exactMatch;
            }

            // Try language-only match (e.g., 'en' matches 'en-US')
            const languageMatch = this.findLanguageMatch(lang.code);
            if (languageMatch) {
                return languageMatch;
            }
        }

        return this.fallbackLocale;
    }

    async detectFromUserAgent(userAgent?: string): Promise<SupportedLocale> {
        if (!userAgent) {
            return this.fallbackLocale;
        }

        // Simple user agent language detection
        // This is a basic implementation - in production, you might use a more sophisticated library
        const languagePatterns = [
            { pattern: /\b(zh-CN|zh_CN)\b/i, locale: SupportedLocale.ZH_CN },
            { pattern: /\b(zh-TW|zh_TW)\b/i, locale: SupportedLocale.ZH_TW },
            { pattern: /\b(ja|ja-JP|ja_JP)\b/i, locale: SupportedLocale.JA_JP },
            { pattern: /\b(ko|ko-KR|ko_KR)\b/i, locale: SupportedLocale.KO_KR },
            { pattern: /\b(ar|ar-SA|ar_SA)\b/i, locale: SupportedLocale.AR_SA },
            { pattern: /\b(es|es-ES|es_ES)\b/i, locale: SupportedLocale.ES_ES },
            { pattern: /\b(fr|fr-FR|fr_FR)\b/i, locale: SupportedLocale.FR_FR },
            { pattern: /\b(de|de-DE|de_DE)\b/i, locale: SupportedLocale.DE_DE },
            { pattern: /\b(it|it-IT|it_IT)\b/i, locale: SupportedLocale.IT_IT },
            { pattern: /\b(pt|pt-BR|pt_BR)\b/i, locale: SupportedLocale.PT_BR },
            { pattern: /\b(ru|ru-RU|ru_RU)\b/i, locale: SupportedLocale.RU_RU },
        ];

        for (const { pattern, locale } of languagePatterns) {
            if (pattern.test(userAgent) && this.supportedLocales.has(locale)) {
                return locale;
            }
        }

        return this.fallbackLocale;
    }

    async detectFromIP(ipAddress?: string): Promise<SupportedLocale> {
        if (!ipAddress) {
            return this.fallbackLocale;
        }

        // In a real implementation, you would use a GeoIP service
        // This is a simplified mock implementation
        const countryToLocaleMap: Record<string, SupportedLocale> = {
            'US': SupportedLocale.EN_US,
            'GB': SupportedLocale.EN_GB,
            'CA': SupportedLocale.EN_CA,
            'AU': SupportedLocale.EN_AU,
            'ES': SupportedLocale.ES_ES,
            'MX': SupportedLocale.ES_MX,
            'AR': SupportedLocale.ES_AR,
            'FR': SupportedLocale.FR_FR,
            'BE': SupportedLocale.FR_BE,
            'CH': SupportedLocale.FR_CH,
            'DE': SupportedLocale.DE_DE,
            'AT': SupportedLocale.DE_AT,
            'IT': SupportedLocale.IT_IT,
            'BR': SupportedLocale.PT_BR,
            'PT': SupportedLocale.PT_PT,
            'CN': SupportedLocale.ZH_CN,
            'TW': SupportedLocale.ZH_TW,
            'JP': SupportedLocale.JA_JP,
            'KR': SupportedLocale.KO_KR,
            'SA': SupportedLocale.AR_SA,
            'EG': SupportedLocale.AR_EG,
            'IL': SupportedLocale.HE_IL,
            'IR': SupportedLocale.FA_IR,
            'IN': SupportedLocale.HI_IN,
            'BD': SupportedLocale.BN_BD,
            'PK': SupportedLocale.UR_PK,
            'TH': SupportedLocale.TH_TH,
            'VN': SupportedLocale.VI_VN,
            'ID': SupportedLocale.ID_ID,
            'MY': SupportedLocale.MS_MY,
            'NL': SupportedLocale.NL_NL,
            'SE': SupportedLocale.SV_SE,
            'DK': SupportedLocale.DA_DK,
            'NO': SupportedLocale.NO_NO,
            'FI': SupportedLocale.FI_FI,
            'PL': SupportedLocale.PL_PL,
            'RU': SupportedLocale.RU_RU,
        };

        // Mock GeoIP lookup - in reality, you'd use a service like MaxMind
        const mockCountry = this.mockGeoIPLookup(ipAddress);
        const locale = countryToLocaleMap[mockCountry];

        if (locale && this.supportedLocales.has(locale)) {
            return locale;
        }

        return this.fallbackLocale;
    }

    // Helper methods
    private async detectFromQuery(request: any): Promise<SupportedLocale | null> {
        const locale = request.query?.locale || request.query?.lang;
        if (locale && Object.values(SupportedLocale).includes(locale)) {
            return locale as SupportedLocale;
        }
        return null;
    }

    private async detectFromCookie(request: any): Promise<SupportedLocale | null> {
        const locale = request.cookies?.locale || request.cookies?.language;
        if (locale && Object.values(SupportedLocale).includes(locale)) {
            return locale as SupportedLocale;
        }
        return null;
    }

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

    private findExactLocaleMatch(languageCode: string): SupportedLocale | null {
        // Normalize the language code
        const normalized = languageCode.toLowerCase().replace('_', '-');

        for (const locale of this.supportedLocales) {
            if (locale.toLowerCase() === normalized) {
                return locale;
            }
        }

        return null;
    }

    private findLanguageMatch(languageCode: string): SupportedLocale | null {
        // Extract just the language part (before the first '-' or '_')
        const language = languageCode.toLowerCase().split(/[-_]/)[0];

        // Define preferred locales for each language
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
            'bn': SupportedLocale.BN_BD,
            'ur': SupportedLocale.UR_PK,
            'th': SupportedLocale.TH_TH,
            'vi': SupportedLocale.VI_VN,
            'id': SupportedLocale.ID_ID,
            'ms': SupportedLocale.MS_MY,
            'nl': SupportedLocale.NL_NL,
            'sv': SupportedLocale.SV_SE,
            'da': SupportedLocale.DA_DK,
            'no': SupportedLocale.NO_NO,
            'fi': SupportedLocale.FI_FI,
            'pl': SupportedLocale.PL_PL,
            'ru': SupportedLocale.RU_RU,
            'sw': SupportedLocale.SW_KE,
            'af': SupportedLocale.AF_ZA,
        };

        const defaultLocale = languageDefaults[language];
        if (defaultLocale && this.supportedLocales.has(defaultLocale)) {
            return defaultLocale;
        }

        // If no default found, try to find any locale with this language
        for (const locale of this.supportedLocales) {
            if (locale.toLowerCase().startsWith(language + '-')) {
                return locale;
            }
        }

        return null;
    }

    private mockGeoIPLookup(ipAddress: string): string {
        // This is a mock implementation for demonstration
        // In a real application, you would use a GeoIP service

        // Some common IP ranges for testing
        if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('127.')) {
            return 'US'; // Local/private IPs default to US
        }

        // Mock some IP ranges for different countries
        const ipToCountry: Record<string, string> = {
            '8.8.8.8': 'US',
            '1.1.1.1': 'US',
            '208.67.222.222': 'US',
        };

        return ipToCountry[ipAddress] || 'US';
    }

    // Utility methods
    setSupportedLocales(locales: SupportedLocale[]): void {
        this.supportedLocales = new Set(locales);
    }

    setFallbackLocale(locale: SupportedLocale): void {
        this.fallbackLocale = locale;
    }

    getSupportedLocales(): SupportedLocale[] {
        return Array.from(this.supportedLocales);
    }

    getFallbackLocale(): SupportedLocale {
        return this.fallbackLocale;
    }
}