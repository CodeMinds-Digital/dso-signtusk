# React Email Rendering Error Fix

## Error

```
Cannot read properties of null (reading 'useRef')
at I18nProvider
at renderWithI18N
```

## Root Cause

The error occurs when `@lingui/react`'s `I18nProvider` tries to use React hooks during server-side rendering with `@react-email/render`. This is a React context initialization issue where:

1. `@react-email/render` uses `react-dom/server` to render emails
2. `@lingui/react` tries to use `useRef` hook
3. React context is `null` during the render, causing the error

## Solution

### Option 1: Fix the Render Function (Recommended)

Update `packages/email/render.tsx` to properly initialize React context:

```typescript
import { createElement } from "react";
import type { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import * as ReactEmail from "@react-email/render";

export const renderWithI18N = async (
  element: React.ReactNode,
  options?: RenderOptions
) => {
  const { branding, i18n, ...otherOptions } = options ?? {};

  if (!i18n) {
    throw new Error("i18n is required");
  }

  // Wrap in createElement to ensure proper React context
  const wrappedElement = createElement(
    I18nProvider,
    { i18n },
    createElement(
      BrandingProvider,
      { branding },
      createElement(
        Tailwind,
        {
          config: {
            theme: {
              extend: {
                colors,
              },
            },
          },
        },
        element
      )
    )
  );

  return ReactEmail.render(wrappedElement, otherOptions);
};
```

### Option 2: Downgrade @lingui/react (Quick Fix)

The issue might be with the latest version of `@lingui/react`. Try downgrading:

```bash
npm install @lingui/react@4.11.4 @lingui/core@4.11.4
```

### Option 3: Use Plain Text Emails Temporarily

Disable i18n rendering temporarily to test:

```typescript
// In packages/lib/server-only/document/resend-document.ts
// Comment out the i18n rendering and use plain render

const html = await render(template, { branding });
const text = await render(template, { branding, plainText: true });
```

## Implementation

Let me apply Option 1 (the proper fix):
