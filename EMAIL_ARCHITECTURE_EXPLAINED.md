# Email Architecture: SSR vs Frontend

## Question: Where are confirmation emails rendered?

**Answer: ALL emails are rendered on the SERVER (SSR), not in the frontend.**

## Email Types and Their Rendering

### 1. Confirmation Emails (Account Verification)

**Location**: Backend/SSR
**Flow**:

```
User Signs Up
    ↓
Backend creates verification token
    ↓
Backend job: send.signup.confirmation.email
    ↓
packages/lib/server-only/auth/send-confirmation-email.ts
    ↓
Uses renderSimple() - NO React hooks, NO Tailwind
    ↓
ConfirmEmailHtmlTemplate (pure HTML with inline styles)
    ↓
Email sent via mailer
```

**Status**: ✅ **ALREADY SAFE** - Uses `renderSimple()` which doesn't use I18nProvider or React hooks

### 2. Document Signing Emails (Invite, Complete, Reject, etc.)

**Location**: Backend/SSR
**Flow**:

```
Document Action (sign, complete, reject)
    ↓
Backend job triggered (e.g., send.signing.requested.email)
    ↓
packages/lib/jobs/definitions/emails/send-signing-email.handler.ts
    ↓
Uses renderEmailWithI18N() - WAS BROKEN, NOW FIXED
    ↓
DocumentInviteEmailTemplate (uses useLinguiSSR)
    ↓
Email sent via mailer
```

**Status**: ✅ **NOW FIXED** - Uses our new SSR-safe i18n system

### 3. Team/Organization Emails

**Location**: Backend/SSR
**Flow**:

```
Team action (invite, join, leave)
    ↓
Backend job triggered
    ↓
Uses renderEmailWithI18N() - WAS BROKEN, NOW FIXED
    ↓
Team email templates (use useLinguiSSR)
    ↓
Email sent via mailer
```

**Status**: ✅ **NOW FIXED** - Uses our new SSR-safe i18n system

## Two Different Rendering Systems

### System 1: renderSimple() - For Simple Emails

**Used for**: Confirmation emails, password reset
**Location**: `packages/email/render-simple.tsx`
**Characteristics**:

- ✅ No I18nProvider
- ✅ No Tailwind (uses inline styles)
- ✅ No React hooks
- ✅ Pure HTML templates
- ✅ Translations passed as props

**Why it works**: Doesn't use any React features that fail in SSR

**Example**:

```typescript
// Template receives pre-translated strings
const confirmationTemplate = createElement(ConfirmEmailHtmlTemplate, {
  assetBaseUrl,
  confirmationLink,
  translations: {
    previewText: "Please confirm your email address",
    welcomeTitle: "Welcome to Signtusk!",
    // ... more translations
  },
});

// Render without any React Context
const html = await renderSimple(confirmationTemplate);
```

### System 2: renderWithI18N() - For Complex Emails

**Used for**: Document emails, team emails, organization emails
**Location**: `packages/email/render.tsx`
**Characteristics**:

- ✅ Uses i18n for translations
- ✅ Uses Tailwind for styling
- ✅ Uses BrandingProvider for customization
- ✅ NOW uses useLinguiSSR (no React hooks)
- ✅ Supports multiple languages

**Why it NOW works**: Uses our SSR-safe i18n system instead of React Context

**Example**:

```typescript
// Template uses useLinguiSSR hook replacement
export const DocumentInviteEmailTemplate = (props) => {
  const { _ } = useLinguiSSR();  // Gets global i18n, no React hooks!
  const branding = useBranding();

  return (
    <Html>
      <Text>{_(msg`Sign this document`)}</Text>
    </Html>
  );
};

// Render with i18n
const html = await renderEmailWithI18N(template, {
  lang: 'en',
  branding: {...}
});
```

## Why Two Systems?

### Historical Reasons

1. **Confirmation emails were failing** with the complex system
2. **Quick fix**: Created `renderSimple()` with pure HTML
3. **Document emails still broken** until our recent fix

### Current State

- ✅ **Confirmation emails**: Use `renderSimple()` - always worked
- ✅ **Document emails**: Use `renderWithI18N()` - NOW FIXED with useLinguiSSR
- ✅ **Team emails**: Use `renderWithI18N()` - NOW FIXED with useLinguiSSR

## Frontend vs Backend

### Frontend (Browser)

**What happens**:

- User fills out forms
- User clicks buttons
- User sees UI feedback
- Calls backend APIs

**What does NOT happen**:

- ❌ Email rendering
- ❌ Email sending
- ❌ Email template processing

### Backend (Server)

**What happens**:

- ✅ Receives API requests
- ✅ Creates background jobs
- ✅ Renders email templates (SSR)
- ✅ Sends emails via SMTP
- ✅ Handles all email logic

## The React Hooks Issue

### Why It Only Affected Document Emails

**Confirmation Emails**:

```typescript
// Uses renderSimple() - no I18nProvider
renderSimple(ConfirmEmailHtmlTemplate); // ✅ Always worked
```

**Document Emails (Before Fix)**:

```typescript
// Used I18nProvider with React hooks
<I18nProvider i18n={i18n}>  // ❌ useState failed in SSR
  <DocumentInviteEmailTemplate />
</I18nProvider>
```

**Document Emails (After Fix)**:

```typescript
// Uses global i18n without React hooks
setEmailI18n(i18n);  // ✅ Set global variable
<DocumentInviteEmailTemplate />  // ✅ Uses useLinguiSSR
clearEmailI18n();  // ✅ Clean up
```

## Summary Table

| Email Type          | Rendering System | Location    | Status           |
| ------------------- | ---------------- | ----------- | ---------------- |
| Confirmation        | renderSimple()   | Backend/SSR | ✅ Always worked |
| Password Reset      | renderSimple()   | Backend/SSR | ✅ Always worked |
| Document Invite     | renderWithI18N() | Backend/SSR | ✅ NOW FIXED     |
| Document Complete   | renderWithI18N() | Backend/SSR | ✅ NOW FIXED     |
| Document Reject     | renderWithI18N() | Backend/SSR | ✅ NOW FIXED     |
| Team Invite         | renderWithI18N() | Backend/SSR | ✅ NOW FIXED     |
| Team Join           | renderWithI18N() | Backend/SSR | ✅ NOW FIXED     |
| Organization Invite | renderWithI18N() | Backend/SSR | ✅ NOW FIXED     |

## Key Takeaways

1. **ALL emails are rendered on the server** (SSR), never in the browser
2. **Confirmation emails always worked** because they use `renderSimple()`
3. **Document emails were broken** because they used React hooks in SSR
4. **Our fix applies to all document/team/org emails** that use `renderWithI18N()`
5. **Frontend only triggers email sending** via API calls, doesn't render emails

## Testing Checklist

After deployment, test both systems:

### System 1 (renderSimple) - Should still work

- [ ] Sign up new user → Confirmation email received
- [ ] Request password reset → Reset email received

### System 2 (renderWithI18N) - Should NOW work

- [ ] Send document for signature → Invite email received
- [ ] Sign document → Completion email received
- [ ] Reject document → Rejection email received
- [ ] Invite to team → Team invite email received

All should work without the useState error!
