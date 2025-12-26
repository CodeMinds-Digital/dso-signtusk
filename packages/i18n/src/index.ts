// Core types and interfaces
export * from './types';

// Core service implementation
export { I18nServiceImpl } from './i18n-service';

// Cache implementations
export { InMemoryTranslationCache, RedisTranslationCache } from './cache';

// Locale detection
export { LocaleDetectorImpl } from './locale-detector';

// Cultural adaptation
export { CulturalAdaptationService } from './cultural-adaptation';

// Utility functions
export {
    createI18nService,
    loadTranslationsFromJSON,
    validateTranslationKeys,
    generateTranslationReport,
} from './utils';

// Default factory function
import { I18nServiceImpl } from './i18n-service';
import { InMemoryTranslationCache } from './cache';
import { LocaleDetectorImpl } from './locale-detector';
import { CulturalAdaptationService } from './cultural-adaptation';

export function createDefaultI18nService() {
    const cache = new InMemoryTranslationCache();
    const localeDetector = new LocaleDetectorImpl();
    const culturalAdaptation = new CulturalAdaptationService();

    return new I18nServiceImpl(cache, localeDetector, culturalAdaptation);
}

// Re-export commonly used types for convenience
export type {
    I18nService,
    LocaleConfig,
    TranslationKey,
    TranslationValue,
    TranslationProject,
    CulturalAdaptation,
    TranslationMemoryEntry,
    TranslationProvider,
    LocaleDetector,
    TranslationCache,
} from './types';