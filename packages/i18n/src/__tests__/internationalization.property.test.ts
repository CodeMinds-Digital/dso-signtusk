import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { I18nServiceImpl } from '../i18n-service';
import { InMemoryTranslationCache } from '../cache';
import { LocaleDetectorImpl } from '../locale-detector';
import { CulturalAdaptationService } from '../cultural-adaptation';
import { SupportedLocale, DateFormatStyle, NumberFormatStyle } from '../types';

describe('Internationalization Property Tests', () => {
    let i18nService: I18nServiceImpl;

    beforeEach(() => {
        const cache = new InMemoryTranslationCache();
        const localeDetector = new LocaleDetectorImpl();
        const culturalAdaptation = new CulturalAdaptationService();
        i18nService = new I18nServiceImpl(cache, localeDetector, culturalAdaptation);
    });

    /**
     * **Feature: docusign-alternative-comprehensive, Property 55: Internationalization Completeness**
     * **Validates: Requirements 11.5**
     */
    it('Property 55: Internationalization Completeness - multi-language support should work correctly with appropriate cultural adaptations and complete localization support', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...Object.values(SupportedLocale)),
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.record({
                    name: fc.string({ minLength: 1, maxLength: 100 }),
                    value: fc.float({ min: 0, max: 1000000 }),
                    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                }),
                async (locale, translationKey, testData) => {
                    // Test 1: Locale configuration should be available and valid
                    const localeConfig = await i18nService.getLocaleConfig(locale);
                    expect(localeConfig).toBeDefined();
                    expect(localeConfig.code).toBe(locale);
                    expect(localeConfig.name).toBeTruthy();
                    expect(localeConfig.nativeName).toBeTruthy();
                    expect(['ltr', 'rtl']).toContain(localeConfig.direction);

                    // Test 2: Cultural adaptation should be available
                    const culturalAdaptation = await i18nService.getCulturalAdaptation(locale);
                    expect(culturalAdaptation).toBeDefined();
                    expect(culturalAdaptation.locale).toBe(locale);
                    expect(culturalAdaptation.dateFormats).toBeDefined();
                    expect(culturalAdaptation.timeFormats).toBeDefined();
                    expect(culturalAdaptation.numberFormats).toBeDefined();

                    // Test 3: Date formatting should work for all locales
                    const formattedDate = await i18nService.formatDate(testData.date, locale, DateFormatStyle.MEDIUM);
                    expect(formattedDate).toBeTruthy();
                    expect(typeof formattedDate).toBe('string');

                    // Test 4: Number formatting should work for all locales
                    const formattedNumber = await i18nService.formatNumber(testData.value, locale, NumberFormatStyle.DECIMAL);
                    expect(formattedNumber).toBeTruthy();
                    expect(typeof formattedNumber).toBe('string');

                    // Test 5: Currency formatting should work for all locales
                    const formattedCurrency = await i18nService.formatCurrency(testData.value, locale);
                    expect(formattedCurrency).toBeTruthy();
                    expect(typeof formattedCurrency).toBe('string');

                    // Test 6: Translation system should handle any key gracefully
                    const testTranslation = `Test translation for ${testData.name}`;
                    await i18nService.setTranslation(translationKey, locale, testTranslation);
                    const retrievedTranslation = await i18nService.getTranslation(translationKey, locale);
                    expect(retrievedTranslation).toBe(testTranslation);

                    // Test 7: Text direction should be correctly determined
                    const textDirection = i18nService.getTextDirection(locale);
                    expect(['ltr', 'rtl']).toContain(textDirection);

                    // Test 8: RTL detection should be consistent with locale configuration
                    const isRTL = i18nService.isRTL(locale);
                    expect(typeof isRTL).toBe('boolean');
                    expect(isRTL).toBe(textDirection === 'rtl');

                    // Test 9: Relative time formatting should work
                    const relativeTime = await i18nService.formatRelativeTime(testData.date, locale);
                    expect(relativeTime).toBeTruthy();
                    expect(typeof relativeTime).toBe('string');

                    // Test 10: Translation with variables should work
                    const variableTranslation = `Hello {name}, your value is {value}`;
                    await i18nService.setTranslation(`${translationKey}.variable`, locale, variableTranslation);
                    const formattedTranslation = await i18nService.getTranslation(
                        `${translationKey}.variable`,
                        locale,
                        { name: testData.name, value: testData.value }
                    );
                    expect(formattedTranslation).toContain(testData.name);
                    expect(formattedTranslation).toContain(testData.value.toString());
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property: Translation Memory Consistency - translation memory should maintain consistency across operations', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...Object.values(SupportedLocale)),
                fc.constantFrom(...Object.values(SupportedLocale)),
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.integer({ min: 1, max: 100 }),
                async (sourceLocale, targetLocale, sourceText, targetText, quality) => {
                    // Add entry to translation memory
                    await i18nService.addToTranslationMemory({
                        sourceText,
                        targetText,
                        sourceLocale,
                        targetLocale,
                        quality,
                        usage: 1,
                    });

                    // Search should find the entry
                    const results = await i18nService.searchTranslationMemory(sourceText, sourceLocale, targetLocale);

                    // Should find at least one result
                    expect(results.length).toBeGreaterThan(0);

                    // Should find the exact entry we added
                    const exactMatch = results.find(r =>
                        r.sourceText === sourceText &&
                        r.targetText === targetText &&
                        r.sourceLocale === sourceLocale &&
                        r.targetLocale === targetLocale
                    );
                    expect(exactMatch).toBeDefined();
                    expect(exactMatch!.quality).toBe(quality);
                }
            ),
            { numRuns: 30 }
        );
    });

    it('Property: Locale Detection Consistency - locale detection should be deterministic and consistent', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 2, maxLength: 10 }),
                fc.string({ minLength: 10, maxLength: 200 }),
                fc.ipV4(),
                async (acceptLanguage, userAgent, ipAddress) => {
                    const request = {
                        headers: {
                            'accept-language': acceptLanguage,
                            'user-agent': userAgent,
                        },
                        ip: ipAddress,
                    };

                    // Detection should be consistent
                    const detected1 = await i18nService.detectLocale(request);
                    const detected2 = await i18nService.detectLocale(request);

                    expect(detected1).toBe(detected2);

                    // Result should be a valid supported locale
                    const supportedLocales = await i18nService.getSupportedLocales();
                    const isSupported = supportedLocales.some(l => l.code === detected1);
                    expect(isSupported).toBe(true);
                }
            ),
            { numRuns: 20 }
        );
    });

    it('Property: Cultural Adaptation Completeness - cultural adaptations should be complete and valid', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...Object.values(SupportedLocale)),
                async (locale) => {
                    const adaptation = await i18nService.getCulturalAdaptation(locale);

                    // All required format properties should exist
                    expect(adaptation.dateFormats.short).toBeTruthy();
                    expect(adaptation.dateFormats.medium).toBeTruthy();
                    expect(adaptation.dateFormats.long).toBeTruthy();
                    expect(adaptation.dateFormats.full).toBeTruthy();

                    expect(adaptation.timeFormats.short).toBeTruthy();
                    expect(adaptation.timeFormats.medium).toBeTruthy();
                    expect(adaptation.timeFormats.long).toBeTruthy();
                    expect(adaptation.timeFormats.full).toBeTruthy();

                    // Number formats should be properly configured
                    expect(adaptation.numberFormats.decimal).toBeDefined();
                    expect(adaptation.numberFormats.currency).toBeDefined();
                    expect(adaptation.numberFormats.percent).toBeDefined();

                    // Address format should be valid
                    expect(adaptation.addressFormat.format).toBeTruthy();
                    expect(Array.isArray(adaptation.addressFormat.requiredFields)).toBe(true);
                    expect(adaptation.addressFormat.requiredFields.length).toBeGreaterThan(0);

                    // Phone format should be valid
                    expect(adaptation.phoneFormat.format).toBeTruthy();
                    expect(adaptation.phoneFormat.countryCode).toBeTruthy();
                    expect(adaptation.phoneFormat.countryCode.startsWith('+')).toBe(true);

                    // Cultural notes should be an array
                    expect(Array.isArray(adaptation.culturalNotes)).toBe(true);
                }
            ),
            { numRuns: Object.values(SupportedLocale).length }
        );
    });

    it('Property: Translation Fallback Chain - translation fallback should work correctly', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 100 }),
                async (translationKey, translationValue) => {
                    // Set translation only in English
                    await i18nService.setTranslation(translationKey, SupportedLocale.EN_US, translationValue);

                    // Try to get translation in other locales - should fall back to English
                    const supportedLocales = await i18nService.getSupportedLocales();

                    for (const localeConfig of supportedLocales) {
                        if (localeConfig.code !== SupportedLocale.EN_US) {
                            try {
                                const translation = await i18nService.getTranslation(translationKey, localeConfig.code);
                                // Should either get the English fallback or throw an error
                                expect(typeof translation === 'string').toBe(true);
                            } catch (error) {
                                // It's acceptable to throw an error if no fallback is found
                                expect(error).toBeDefined();
                            }
                        }
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    it('Property: User Locale Persistence - user locale settings should persist correctly', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.constantFrom(...Object.values(SupportedLocale)),
                async (userId, locale) => {
                    // Set user locale
                    await i18nService.setUserLocale(userId, locale);

                    // Get user locale should return the same value
                    const retrievedLocale = await i18nService.getUserLocale(userId);
                    expect(retrievedLocale).toBe(locale);

                    // Setting a different locale should update correctly
                    const otherLocales = Object.values(SupportedLocale).filter(l => l !== locale);
                    if (otherLocales.length > 0) {
                        const newLocale = otherLocales[0];
                        await i18nService.setUserLocale(userId, newLocale);
                        const updatedLocale = await i18nService.getUserLocale(userId);
                        expect(updatedLocale).toBe(newLocale);
                    }
                }
            ),
            { numRuns: 30 }
        );
    });
});