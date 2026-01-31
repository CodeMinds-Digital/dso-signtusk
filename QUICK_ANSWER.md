# Quick Answer: Confirmation Emails

## Are confirmation emails in SSR or frontend?

**Answer: SSR (Server-Side Rendering) - Backend only**

## All Emails Are Server-Side

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  - User clicks "Sign Up"                                │
│  - User clicks "Resend Confirmation"                    │
│  - Calls backend API                                    │
│  - Shows loading spinner                                │
│  - Shows success/error message                          │
│                                                          │
│  ❌ Does NOT render emails                              │
│  ❌ Does NOT send emails                                │
└─────────────────────────────────────────────────────────┘
                         │
                         │ API Call
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND (SSR)                      │
│                                                          │
│  1. Receives API request                                │
│  2. Creates verification token                          │
│  3. Queues background job                               │
│  4. ✅ RENDERS email template (SSR)                     │
│  5. ✅ SENDS email via SMTP                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Two Email Systems (Both SSR)

### 1. Confirmation Emails ✅ (Always Worked)

- **System**: `renderSimple()`
- **Template**: `ConfirmEmailHtmlTemplate`
- **Features**: Pure HTML, inline styles, no React hooks
- **Status**: ✅ Never had issues

### 2. Document Emails ✅ (NOW Fixed)

- **System**: `renderWithI18N()`
- **Template**: `DocumentInviteEmailTemplate`, etc.
- **Features**: i18n, Tailwind, branding
- **Status**: ✅ Fixed with useLinguiSSR

## Why Confirmation Emails Always Worked

```typescript
// Confirmation email rendering (simple, no hooks)
const template = createElement(ConfirmEmailHtmlTemplate, {
  confirmationLink: "https://...",
  translations: {
    welcomeTitle: "Welcome to Signtusk!",
    // Pre-translated strings passed as props
  },
});

const html = await renderSimple(template);
// ✅ No I18nProvider, no React hooks, no issues
```

## Why Document Emails Were Broken (Now Fixed)

```typescript
// BEFORE (broken):
<I18nProvider i18n={i18n}>  // ❌ Uses useState → crash
  <DocumentInviteEmailTemplate />
</I18nProvider>

// AFTER (fixed):
setEmailI18n(i18n);  // ✅ Global variable, no hooks
<DocumentInviteEmailTemplate />  // ✅ Uses useLinguiSSR
clearEmailI18n();
```

## Bottom Line

- ✅ **ALL emails are SSR** (rendered on backend)
- ✅ **Confirmation emails always worked** (simple system)
- ✅ **Document emails NOW work** (fixed with useLinguiSSR)
- ❌ **Frontend NEVER renders emails** (only triggers sending)

## What You Need to Deploy

The fix we made applies to **document/team/org emails only**.
Confirmation emails don't need any changes - they already work!

After deployment:

1. ✅ Confirmation emails will still work (unchanged)
2. ✅ Document emails will NOW work (fixed)
3. ✅ Team emails will NOW work (fixed)
4. ✅ All emails rendered on backend (SSR)
