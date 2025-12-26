# @signtusk/i18n

Comprehensive internationalization and localization package for Signtusk platform.

## Features

- **Multi-language Support**: Support for 70+ languages including RTL languages
- **Cultural Adaptation**: Locale-specific formatting for dates, numbers, currencies, and addresses
- **RTL Support**: Complete right-to-left language support with automatic layout adjustments
- **Translation Management**: Advanced translation workflow with versioning and professional services integration
- **React Integration**: Ready-to-use React components and hooks
- **Server-side Support**: Full server-side rendering support
- **Property-based Testing**: Comprehensive test coverage with property-based testing

## Supported Languages

The package supports 70+ languages including:

- **European**: English, Spanish, French, German, Italian, Portuguese, Dutch, Swedish, Danish, Norwegian, Finnish, Polish, Czech, Slovak, Hungarian, Romanian, Bulgarian, Croatian, Slovenian, Estonian, Latvian, Lithuanian, Russian, Ukrainian, Belarusian, Macedonian, Serbian, Bosnian, Montenegrin, Albanian, Greek, Turkish
- **Middle Eastern**: Arabic, Hebrew, Persian, Turkish
- **Asian**: Chinese (Simplified & Traditional), Japanese, Korean, Hindi, Bengali, Tamil, Telugu, Malayalam, Kannada, Gujarati, Punjabi, Odia, Assamese, Nepali, Sinhala, Myanmar, Khmer, Lao, Thai, Vietnamese, Indonesian, Malay, Filipino
- **Central Asian**: Mongolian, Kazakh, Kyrgyz, Uzbek, Tajik, Turkmen, Azerbaijani, Georgian, Armenian
- **African**: Amharic, Swahili, Zulu, Xhosa, Afrikaans

## Installation

```bash
npm install @signtusk/i18n
```

## Basic Usage

### React Integration

```tsx
import { I18nProvider, useTranslations, LanguageSelector } from '@signtusk/i18n/react';

function App() {
  return (
    <I18nProvider defaultLanguage="en">
      <MyComponent />
      <LanguageSelector />
    </I18nProvider>
  );
}

function MyComponent() {
  const { t, language, isRTL } = useTranslations('common');
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('welcome')}</h1>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### Server-side Usage

```typescript
import { 
  initializeServerI18nInstance, 
  translateServer, 
  detectLanguage,
  formatDateServer,
  formatCurrencyServer 
} from '@signtusk/i18n/server';

// Initialize server i18n
await initializeServerI18nInstance();

// Detect language from request
const language = detectLanguage(request);

// Translate text
const welcomeText = translateServer('welcome', language, { namespace: 'common' });

// Format date and currency
const formattedDate = formatDateServer(new Date(), language);
const formattedPrice = formatCurrencyServer(99.99, language);
```

### Language Metadata

```typescript
import { 
  getLanguageMetadata, 
  isRTLLanguage, 
  getSupportedLanguages 
} from '@signtusk/i18n';

// Get all supported languages
const languages = getSupportedLanguages();

// Check if language is RTL
const isRTL = isRTLLanguage('ar'); // true

// Get language metadata
const metadata = getLanguageMetadata('ar');
console.log(metadata.nativeName); // "العربية"
console.log(metadata.flag); // "🇸🇦"
```

### Cultural Adaptation

```typescript
import { 
  culturalAdaptationService,
  formatDate,
  formatCurrency,
  createLocalizationContext 
} from '@signtusk/i18n';

// Format date according to locale
const date = formatDate(new Date(), 'de'); // "22.12.2024"

// Format currency
const price = formatCurrency(1234.56, 'fr'); // "1 234,56 €"

// Create localization context
const context = createLocalizationContext('ja', {
  timezone: 'Asia/Tokyo',
  currency: 'JPY'
});
```

### RTL Support

```typescript
import { rtlManager, applyRTL, generateRTLCSS } from '@signtusk/i18n';

// Apply RTL to document
applyRTL('ar'); // Sets dir="rtl" and applies RTL styles

// Generate RTL CSS
const rtlCSS = generateRTLCSS('ar');

// Check RTL configuration
const config = rtlManager.getRTLConfiguration('ar');
console.log(config.textDirection); // "rtl"
```

## Translation Management

```typescript
import { translationService } from '@signtusk/i18n';

// Create translation
const translation = await translationService.createTranslation({
  namespace: 'common',
  language: 'es',
  key: 'welcome',
  value: 'Bienvenido',
  createdBy: 'user-id',
  updatedBy: 'user-id',
});

// Retrieve translation
const retrieved = translationService.getTranslation('common', 'es', 'welcome');

// Bulk operations
const translations = await translationService.bulkImportTranslations([
  { namespace: 'common', language: 'fr', key: 'hello', value: 'Bonjour', createdBy: 'user', updatedBy: 'user' },
  // ... more translations
]);
```

## React Components

### Language Selector

```tsx
import { LanguageSelector } from '@signtusk/i18n/react';

<LanguageSelector 
  showFlags={true}
  showNativeNames={true}
  supportedLanguages={['en', 'es', 'fr', 'de']}
  onLanguageChange={(lang) => console.log('Language changed to:', lang)}
/>
```

### Language Switcher (Dropdown)

```tsx
import { LanguageSwitcher } from '@signtusk/i18n/react';

<LanguageSwitcher 
  className="custom-switcher"
  showFlags={true}
  showNativeNames={true}
/>
```

### Formatted Components

```tsx
import { 
  FormattedDate, 
  FormattedNumber, 
  FormattedCurrency 
} from '@signtusk/i18n/react';

<FormattedDate date={new Date()} />
<FormattedNumber value={1234.56} />
<FormattedCurrency amount={99.99} currency="USD" />
```

### RTL Wrapper

```tsx
import { RTLWrapper } from '@signtusk/i18n/react';

<RTLWrapper>
  <div>This content will be automatically adjusted for RTL languages</div>
</RTLWrapper>
```

## Configuration

### Custom i18n Configuration

```typescript
import { initializeI18n } from '@signtusk/i18n';

await initializeI18n({
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de'],
  backend: {
    loadPath: '/api/locales/{{lng}}/{{ns}}.json',
  },
  detection: {
    order: ['querystring', 'cookie', 'localStorage'],
    caches: ['localStorage', 'cookie'],
  },
});
```

### Custom RTL Configuration

```typescript
import { rtlManager } from '@signtusk/i18n';

rtlManager.updateRTLConfiguration('ar', {
  mirrorIcons: true,
  adjustSpacing: true,
  customCSS: `
    .custom-rtl-class {
      text-align: right;
    }
  `,
});
```

## Testing

The package includes comprehensive property-based tests to ensure correctness across all supported languages:

```bash
npm test
```

The tests verify:
- Complete metadata for all supported languages
- Correct RTL language identification
- Valid date and number formatting
- Translation management functionality
- Consistency across all i18n components

## Architecture

The package is built with a modular architecture:

- **Types**: Comprehensive TypeScript types for all i18n features
- **Languages**: Language metadata and utilities
- **Config**: i18next configuration and initialization
- **Translation Service**: Advanced translation management
- **RTL Manager**: Right-to-left language support
- **Cultural Adaptation**: Locale-specific formatting
- **React Components**: Ready-to-use React integration
- **Server Utilities**: Server-side rendering support

## Contributing

1. Add new languages to `src/languages.ts`
2. Update translation files in `locales/`
3. Run tests to ensure compatibility
4. Update documentation

## License

MIT License - see LICENSE file for details.