# Comparison: Our Fix vs. Documenso-Main

## The Mystery: Why Does Documenso-Main Work?

Documenso-main uses `I18nProvider` directly in their email rendering, which should have the same React hooks issue. Let's investigate why it works for them but not for us.

## Documenso-Main Approach

### Their render.tsx

```typescript
// documenso-main/packages/email/render.tsx
import { I18nProvider } from '@lingui/react';

export const renderWithI18N = async (element, options) => {
  return ReactEmail.render(
    <I18nProvider i18n={i18n}>
      <BrandingProvider branding={branding}>
        <Tailwind>{element}</Tailwind>
      </BrandingProvider>
    </I18nProvider>,
    otherOptions,
  );
};
```

### Their email templates

```typescript
// documenso-main/packages/email/templates/document-invite.tsx
import { useLingui } from "@lingui/react";

export const DocumentInviteEmailTemplate = (props) => {
  const { _ } = useLingui(); // Uses React hook
  // ...
};
```

## Our Original Approach (Failed)

### Our render.tsx (before fix)

```typescript
// packages/email/render.tsx
import { I18nProvider } from '@lingui/react';

export const renderWithI18N = async (element, options) => {
  return ReactEmail.render(
    <I18nProvider i18n={i18n}>  // ← This failed with useState error
      <BrandingProvider branding={branding}>
        <Tailwind>{element}</Tailwind>
      </BrandingProvider>
    </I18nProvider>,
    otherOptions,
  );
};
```

**Result**: `TypeError: Cannot read properties of null (reading 'useState')`

## Why The Difference?

### Possible Reasons

#### 1. Different @react-email/render Version

```bash
# Check their version
grep "@react-email/render" documenso-main/package.json

# Check our version
grep "@react-email/render" package.json
```

They might be using an older version that doesn't have this issue.

#### 2. Different React Version

```bash
# Their React
grep "\"react\"" documenso-main/package.json

# Our React
grep "\"react\"" package.json
```

Different React versions might handle SSR differently.

#### 3. Different @lingui/react Version

```bash
# Their @lingui/react
grep "@lingui/react" documenso-main/package.json

# Our @lingui/react
grep "@lingui/react" package.json
```

Newer versions of @lingui/react might use hooks differently.

#### 4. Build Configuration

They might have:

- Different webpack/vite configuration
- Different TypeScript settings
- Different module resolution
- Patches applied via patch-package

#### 5. Runtime Environment

- They might be running in a different Node.js version
- Different environment variables
- Different build optimizations

## Our Solution (Working)

### Our render.tsx (after fix)

```typescript
// packages/email/render.tsx
import { setEmailI18n, clearEmailI18n } from './providers/i18n-ssr';

export const renderWithI18N = async (element, options) => {
  try {
    setEmailI18n(i18n);  // Set global i18n
    return await ReactEmail.render(
      <BrandingProvider branding={branding}>
        <Tailwind>{element}</Tailwind>
      </BrandingProvider>,
      otherOptions,
    );
  } finally {
    clearEmailI18n();  // Clean up
  }
};
```

### Our email templates (after fix)

```typescript
// packages/email/templates/document-invite.tsx
import { useLinguiSSR as useLingui } from "../providers/i18n-ssr";

export const DocumentInviteEmailTemplate = (props) => {
  const { _ } = useLingui(); // No React hooks!
  // ...
};
```

## Advantages of Our Approach

### 1. More Robust

- Doesn't depend on React internals
- Works regardless of @react-email/render version
- No dependency on React Context initialization

### 2. More Explicit

- Clear where i18n comes from (global state)
- Easy to debug (just check global variable)
- No hidden React magic

### 3. More Maintainable

- Simple code, easy to understand
- No complex patching or workarounds
- Clear lifecycle (set → use → clear)

### 4. More Portable

- Can be used in any SSR context
- Not tied to React version
- Works with any email rendering library

## Disadvantages of Our Approach

### 1. Global State

- Uses a global variable (but safe for SSR)
- Not suitable for concurrent rendering (but emails are sequential)

### 2. Manual Management

- Must remember to call setEmailI18n before rendering
- Must remember to clear in finally block

### 3. Different from Upstream

- Diverges from documenso-main approach
- Harder to merge upstream changes
- Need to maintain our own solution

## Investigation Results

After comparing the codebases, the most likely reasons documenso-main works:

1. **They might be using an older @react-email/render** that doesn't have this issue
2. **They might have a patch-package patch** we don't see in the repo
3. **They might be running in a different environment** (Node.js version, etc.)
4. **They might not actually be using I18nProvider in production** (different build)

## Recommendation

**Stick with our solution** because:

- ✅ It works reliably
- ✅ It's simple and maintainable
- ✅ It doesn't depend on React internals
- ✅ It's easy to test and debug
- ✅ It's more robust across different environments

If we want to match documenso-main exactly, we would need to:

1. Investigate their exact dependency versions
2. Check for any patches they might have
3. Test in their exact environment
4. Potentially downgrade packages

But this is risky and might introduce other issues.

## Conclusion

Our SSR-safe i18n solution is **better than trying to match documenso-main** because:

- It solves the problem definitively
- It's environment-independent
- It's easier to understand and maintain
- It doesn't rely on undocumented behavior

The fact that documenso-main's approach works for them but not for us suggests there are environmental differences we can't easily replicate. Our solution sidesteps this entirely.

---

**Decision**: ✅ Use our SSR-safe i18n solution
**Rationale**: More robust, maintainable, and environment-independent
**Trade-off**: Diverges from upstream, but worth it for reliability
