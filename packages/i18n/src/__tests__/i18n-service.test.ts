import { describe, it, expect, beforeEach } from 'vitest';
import { I18nServiceImpl } from '../i18n-service';
import { InMemoryTranslationCache } from '../cache';
import { LocaleDetectorImpl } from '../locale-detector';
import { CulturalAdaptationService } from '../cultural-adaptation';
import { SupportedLocale, DateFormatStyle, NumberFormatStyle } from '../types';

describe('I18nServiceImpl', () => {
    let i18nService: I18nServiceImpl;
    let cache: InMemoryTranslationCache;
    let localeDetector: LocaleDetectorImpl;
    let culturalAdaptation: CulturalAdaptationService;

    beforeEach(() => {
        cache = new InMemoryTranslationCache();
        localeDetector = new LocaleDetectorImpl();
        culturalAdaptation = new CulturalAdaptationService();
        i18nService = new I18nServiceImpl(cache, localeDetector, culturalAdaptation);
    });

    describe('getSupportedLocales', () => {
        it('should return supported locales', async () => {
            const locales = await i18nService.getSupportedLocales();
            expect(locales).toBeInstanceOf(Array);
            expect(locales.length).toBeGreaterThan(0);
            expect(locales.some(l => l.code === SupportedLocale.EN_US)).toBe(true);
        });
    });

    describe('getLocaleConfig', () => {
        it('should return locale config for supported locale', async () => {
            const config = await i18nService.getLocaleConfig(SupportedLocale.EN_US);
            expect(config.code).toBe(SupportedLocale.EN_US);
            expect(config.name).toBe('English (United States)');
            expect(config.enabled).toBe(true);
        });

        it('should throw error for unsupported locale', async () => {
            await expect(
                i18nService.getLocaleConfig('invalid-locale' as SupportedLocale)
            ).rejects.toThrow('Locale not supported');
        });
    });

    describe('translation management', () => {
        beforeEach(async () => {
            await i18nService.setTranslation('test.hello', SupportedLocale.EN_US, 'Hello');
            await i18nService.setTranslation('test.hello', SupportedLocale.ES_ES, 'Hola');
            await i18nService.setTranslation('test.greeting', SupportedLocale.EN_US, 'Hello {name}');
        });

        it('should set and get translations', async () => {
            const translation = await i18nService.getTranslation('test.hello', SupportedLocale.EN_US);
            expect(translation).toBe('Hello');
        });

        it('should format messages with variables', async () => {
            const translation = await i18nService.getTranslation(
                'test.greeting',
                SupportedLocale.EN_US,
                { name: 'John' }
            );
            expect(translation).toBe('Hello John');
        });

        it('should fall back to English for missing translations', async () => {
            const translation = await i18nService.getTranslation('test.greeting', SupportedLocale.FR_FR);
            expect(translation).toBe('Hello {name}');
        });

        it('should get translations by namespace', async () => {
            const translations = await i18nService.getTranslations('test', SupportedLocale.EN_US);
            expect(translations).toEqual({
                hello: 'Hello',
                greeting: 'Hello {name}',
            });
        });

        it('should bulk set translations', async () => {
            await i18nService.bulkSetTranslations([
                { key: 'bulk.test1', locale: SupportedLocale.EN_US, value: 'Test 1' },
                { key: 'bulk.test2', locale: SupportedLocale.EN_US, value: 'Test 2' },
            ]);

            const test1 = await i18nService.getTranslation('bulk.test1', SupportedLocale.EN_US);
            const test2 = await i18nService.getTranslation('bulk.test2', SupportedLocale.EN_US);

            expect(test1).toBe('Test 1');
            expect(test2).toBe('Test 2');
        });
    });

    describe('user locale management', () => {
        it('should set and get user locale', async () => {
            await i18nService.setUserLocale('user123', SupportedLocale.ES_ES);
            const locale = await i18nService.getUserLocale('user123');
            expect(locale).toBe(SupportedLocale.ES_ES);
        });

        it('should return default locale for unknown user', async () => {
            const locale = await i18nService.getUserLocale('unknown-user');
            expect(locale).toBe(SupportedLocale.EN_US);
        });
    });

    describe('formatting', () => {
        it('should format dates', async () => {
            const date = new Date('2023-12-25');
            const formatted = await i18nService.formatDate(date, SupportedLocale.EN_US, DateFormatStyle.MEDIUM);
            expect(formatted).toMatch(/Dec/);
            expect(formatted).toMatch(/25/);
            expect(formatted).toMatch(/2023/);
        });

        it('should format numbers', async () => {
            const formatted = await i18nService.formatNumber(1234.56, SupportedLocale.EN_US, NumberFormatStyle.DECIMAL);
            expect(formatted).toBe('1,234.56');
        });

        it('should format currency', async () => {
            const formatted = await i18nService.formatCurrency(1234.56, SupportedLocale.EN_US);
            expect(formatted).toMatch(/\$1,234\.56/);
        });

        it('should format relative time', async () => {
            const pastDate = new Date(Date.now() - 60000); // 1 minute ago
            const formatted = await i18nService.formatRelativeTime(pastDate, SupportedLocale.EN_US);
            expect(formatted).toMatch(/minute/);
        });
    });

    describe('cultural adaptation', () => {
        it('should get cultural adaptation for locale', async () => {
            const adaptation = await i18nService.getCulturalAdaptation(SupportedLocale.EN_US);
            expect(adaptation.locale).toBe(SupportedLocale.EN_US);
            expect(adaptation.dateFormats).toBeDefined();
            expect(adaptation.numberFormats).toBeDefined();
        });
    });

    describe('translation memory', () => {
        beforeEach(async () => {
            await i18nService.addToTranslationMemory({
                sourceText: 'Hello',
                targetText: 'Hola',
                sourceLocale: SupportedLocale.EN_US,
                targetLocale: SupportedLocale.ES_ES,
                quality: 95,
                usage: 1,
            });
        });

        it('should search translation memory', async () => {
            const results = await i18nService.searchTranslationMemory(
                'Hello',
                SupportedLocale.EN_US,
                SupportedLocale.ES_ES
            );

            expect(results).toHaveLength(1);
            expect(results[0].sourceText).toBe('Hello');
            expect(results[0].targetText).toBe('Hola');
        });

        it('should add to translation memory', async () => {
            await i18nService.addToTranslationMemory({
                sourceText: 'Goodbye',
                targetText: 'Adiós',
                sourceLocale: SupportedLocale.EN_US,
                targetLocale: SupportedLocale.ES_ES,
                quality: 90,
                usage: 1,
            });

            const results = await i18nService.searchTranslationMemory(
                'Goodbye',
                SupportedLocale.EN_US,
                SupportedLocale.ES_ES
            );

            expect(results).toHaveLength(1);
            expect(results[0].targetText).toBe('Adiós');
        });
    });

    describe('utility methods', () => {
        it('should detect RTL locales', () => {
            expect(i18nService.isRTL(SupportedLocale.AR_SA)).toBe(true);
            expect(i18nService.isRTL(SupportedLocale.HE_IL)).toBe(true);
            expect(i18nService.isRTL(SupportedLocale.EN_US)).toBe(false);
        });

        it('should get text direction', () => {
            expect(i18nService.getTextDirection(SupportedLocale.AR_SA)).toBe('rtl');
            expect(i18nService.getTextDirection(SupportedLocale.EN_US)).toBe('ltr');
        });
    });
});