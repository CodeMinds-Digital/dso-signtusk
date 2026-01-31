# Why Use renderSimple() for ALL Emails?

## Your Question

"If confirmation email works, why not use this for all email events?"

## Answer: YES! That's the BEST solution!

You're absolutely right. Using `renderSimple()` for ALL emails is:

- ✅ Simpler
- ✅ More reliable
- ✅ No React hooks issues
- ✅ Faster rendering
- ✅ Easier to maintain
- ✅ No complex workarounds needed

## Why We Have Two Systems Now

### Historical Reasons

1. **Original codebase** used `renderWithI18N()` with Tailwind and i18n hooks
2. **Confirmation email broke** → Quick fix with `renderSimple()`
3. **Document emails still broken** → We tried to fix with SSR-safe hooks
4. **But this is complex** and error-prone

### The Problem with Current Approach

```typescript
// Complex: Need to manage global state
setEmailI18n(i18n);
setEmailBranding(branding);
// Render
clearEmailI18n();
clearEmailBranding();

// Templates need special imports
import { useLinguiSSR as useLingui } from "../providers/i18n-ssr";
import { useBrandingSSR as useBranding } from "../providers/branding-ssr";
```

## Better Solution: Use renderSimple() for Everything

### Advantages

#### 1. No React Hooks Issues ✅

```typescript
// Simple: Just pass data as props
const template = createElement(DocumentInviteEmail, {
  documentName: "Contract.pdf",
  inviterName: "John Doe",
  translations: {
    title: "Sign this document",
    button: "Sign now",
  },
});

const html = await renderSimple(template);
```

#### 2. Faster Rendering ✅

- No Tailwind processing (uses inline styles)
- No i18n context initialization
- No React Context overhead
- Direct HTML generation

#### 3. More Reliable ✅

- Works in any environment
- No version conflicts
- No SSR issues
- No Suspense issues

#### 4. Easier to Maintain ✅

- One rendering system
- Simple templates
- Clear data flow
- Easy to debug

#### 5. Better for Serverless ✅

- Smaller bundle size
- Faster cold starts
- Less memory usage
- No complex dependencies

## How to Migrate

### Step 1: Create Simple Templates

Convert each template from:

```typescript
// OLD: Uses hooks and Tailwind
export const DocumentInviteEmail = (props) => {
  const { _ } = useLingui();
  const branding = useBranding();

  return (
    <Html>
      <Text className="text-lg font-bold">
        {_(msg`Sign this document`)}
      </Text>
    </Html>
  );
};
```

To:

```typescript
// NEW: Uses props and inline styles
export const DocumentInviteEmailSimple = ({
  documentName,
  inviterName,
  translations = defaultTranslations,
  branding = defaultBranding,
}) => {
  return (
    <Html>
      <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
        {translations.title}
      </Text>
    </Html>
  );
};
```

### Step 2: Update Email Handlers

```typescript
// OLD: Complex rendering
const html = await renderEmailWithI18N(
  createElement(DocumentInviteEmail, props),
  { lang: "en", branding }
);

// NEW: Simple rendering
const translations = getTranslations(lang);
const html = await renderSimple(
  createElement(DocumentInviteEmailSimple, {
    ...props,
    translations,
    branding,
  })
);
```

### Step 3: Translation Helper

```typescript
// Helper to get translations for a language
const getEmailTranslations = (lang: string, emailType: string) => {
  const i18n = getI18nInstance(lang);
  i18n.activate(lang);

  return {
    documentInvite: {
      title: i18n._(msg`Sign this document`),
      button: i18n._(msg`Sign now`),
      // ... more translations
    },
    // ... other email types
  }[emailType];
};
```

## Comparison

### Current Approach (Complex)

```
┌─────────────────────────────────────────┐
│ renderWithI18N()                        │
│  ↓                                      │
│ Set global i18n                         │
│ Set global branding                     │
│  ↓                                      │
│ Wrap in I18nProvider (broken)          │
│ Wrap in BrandingProvider               │
│ Wrap in Tailwind (Suspense issues)     │
│  ↓                                      │
│ Template uses useLinguiSSR()            │
│ Template uses useBrandingSSR()          │
│  ↓                                      │
│ Process Tailwind classes                │
│ Generate HTML                           │
│  ↓                                      │
│ Clear global state                      │
└─────────────────────────────────────────┘
```

### Simple Approach (Better)

```
┌─────────────────────────────────────────┐
│ renderSimple()                          │
│  ↓                                      │
│ Get translations for language           │
│  ↓                                      │
│ Pass translations as props              │
│ Pass branding as props                  │
│  ↓                                      │
│ Template uses props directly            │
│ Template uses inline styles             │
│  ↓                                      │
│ Generate HTML                           │
└─────────────────────────────────────────┘
```

## Migration Plan

### Phase 1: Create Simple Templates (1-2 days)

- [ ] Create `-simple.tsx` version of each template
- [ ] Use inline styles instead of Tailwind
- [ ] Accept translations as props
- [ ] Accept branding as props

### Phase 2: Update Handlers (1 day)

- [ ] Update email job handlers to use simple templates
- [ ] Add translation helper function
- [ ] Test each email type

### Phase 3: Remove Complex System (1 day)

- [ ] Remove `renderWithI18N()`
- [ ] Remove `useLinguiSSR`
- [ ] Remove `useBrandingSSR`
- [ ] Remove old templates
- [ ] Update documentation

### Phase 4: Testing (1 day)

- [ ] Test all 26 email types
- [ ] Verify translations work
- [ ] Verify branding works
- [ ] Performance testing

## Example: Document Invite Email

### Before (Complex)

```typescript
// Template
export const DocumentInviteEmail = (props) => {
  const { _ } = useLinguiSSR();
  const branding = useBrandingSSR();

  return (
    <Html>
      <Head />
      <Body className="bg-white font-sans">
        <Container className="max-w-xl mx-auto p-4">
          {branding.brandingLogo && (
            <Img src={branding.brandingLogo} className="h-6 mb-4" />
          )}
          <Text className="text-lg font-bold">
            {_(msg`Sign this document`)}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Handler
const html = await renderEmailWithI18N(
  createElement(DocumentInviteEmail, props),
  { lang: 'en', branding }
);
```

### After (Simple)

```typescript
// Template
export const DocumentInviteEmailSimple = ({
  documentName,
  inviterName,
  translations,
  branding,
  assetBaseUrl,
}) => {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {branding.brandingLogo && (
            <Img src={branding.brandingLogo} style={styles.logo} />
          )}
          <Text style={styles.title}>
            {translations.title}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: { backgroundColor: '#ffffff', fontFamily: 'sans-serif' },
  container: { maxWidth: '580px', margin: '0 auto', padding: '16px' },
  logo: { height: '24px', marginBottom: '16px' },
  title: { fontSize: '18px', fontWeight: 'bold' },
};

// Handler
const translations = getEmailTranslations(lang, 'documentInvite');
const html = await renderSimple(
  createElement(DocumentInviteEmailSimple, {
    ...props,
    translations,
    branding
  })
);
```

## Benefits Summary

| Aspect           | Current (Complex)     | Simple Approach |
| ---------------- | --------------------- | --------------- |
| **Reliability**  | ❌ React hooks issues | ✅ Always works |
| **Performance**  | ❌ Slower (Tailwind)  | ✅ Faster       |
| **Maintenance**  | ❌ Complex            | ✅ Simple       |
| **Debugging**    | ❌ Hard               | ✅ Easy         |
| **Bundle Size**  | ❌ Larger             | ✅ Smaller      |
| **Cold Start**   | ❌ Slower             | ✅ Faster       |
| **Dependencies** | ❌ Many               | ✅ Few          |
| **Testing**      | ❌ Complex            | ✅ Simple       |

## Recommendation

**YES, migrate ALL emails to use `renderSimple()`!**

### Immediate Action

1. Start with the most critical emails (document invite, complete)
2. Create simple versions alongside existing ones
3. Test thoroughly
4. Switch over gradually
5. Remove complex system once all migrated

### Timeline

- **Week 1**: Create simple templates for top 10 emails
- **Week 2**: Migrate handlers and test
- **Week 3**: Create simple templates for remaining emails
- **Week 4**: Complete migration and remove old system

### Risk

- **LOW**: Simple approach is proven (confirmation email works)
- **Rollback**: Easy (keep old templates during migration)
- **Testing**: Straightforward (just check email content)

## Conclusion

You're absolutely right to question why we have two systems. The simple approach is:

- ✅ Better in every way
- ✅ Already proven to work
- ✅ Easier to maintain
- ✅ More reliable

**Let's migrate everything to `renderSimple()`!**
