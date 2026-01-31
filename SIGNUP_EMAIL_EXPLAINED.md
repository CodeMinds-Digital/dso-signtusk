# Signup Email Explained

## Question: Is there a signup email?

**Answer: YES, but it's the SAME as the confirmation email.**

## How Signup Works

```
User Signs Up
    ↓
Backend creates user account (emailVerified = false)
    ↓
Backend triggers job: "send.signup.confirmation.email"
    ↓
Sends confirmation email (ConfirmEmailTemplate)
    ↓
User clicks link in email
    ↓
Email verified, user can log in
```

## There's Only ONE Email Template

The system uses **ONE email template** for both:

1. ✅ Initial signup confirmation
2. ✅ Resending confirmation (if user didn't receive it)

### Template Used

- **File**: `packages/email/templates/confirm-email-html.tsx`
- **Job**: `send.signup.confirmation.email`
- **Rendering**: `renderSimple()` (SSR, no React hooks)
- **Status**: ✅ Always worked, not affected by our fix

## Email Content

The confirmation/signup email contains:

- Welcome message: "Welcome to Signtusk!"
- Instructions: "Please confirm your email address"
- Confirmation button with link
- Link expires in 1 hour

## When Is This Email Sent?

### 1. During Signup

```typescript
// packages/auth/server/routes/email-password.ts
.post("/signup", async (c) => {
  const user = await createUser({ name, email, password });

  await jobsClient.triggerJob({
    name: "send.signup.confirmation.email",  // ← Triggers email
    payload: { email: user.email }
  });

  return c.text("OK", 201);
})
```

### 2. During Login (if email not verified)

```typescript
// packages/auth/server/routes/email-password.ts
.post("/signin", async (c) => {
  // ... authenticate user ...

  if (!user.emailVerified) {
    // Resend confirmation if needed
    await jobsClient.triggerJob({
      name: "send.signup.confirmation.email",  // ← Same email
      payload: { email: user.email }
    });

    throw new AppError("UNVERIFIED_EMAIL");
  }
})
```

### 3. Manual Resend

```typescript
// User clicks "Resend Confirmation Email" button
await authClient.emailPassword.resendVerifyEmail({ email });
// ↓ Triggers same job
```

## Email Templates Comparison

### Signup/Confirmation Email ✅

- **Template**: `confirm-email-html.tsx`
- **System**: `renderSimple()`
- **Features**: Pure HTML, inline styles
- **i18n**: Pre-translated strings passed as props
- **Status**: ✅ Always worked
- **Affected by fix**: ❌ NO

### Document Emails ✅

- **Templates**: `document-invite.tsx`, `document-completed.tsx`, etc.
- **System**: `renderWithI18N()`
- **Features**: i18n hooks, Tailwind, branding
- **i18n**: Uses `useLinguiSSR()`
- **Status**: ✅ NOW FIXED
- **Affected by fix**: ✅ YES

## Why No Separate Welcome Email?

The system follows a **simple, secure flow**:

1. User signs up → Account created but locked
2. Confirmation email sent → Contains welcome message
3. User clicks link → Email verified, account unlocked
4. User can now log in → Full access

This is **better than** sending two emails:

- ❌ Welcome email (no verification)
- ❌ Separate confirmation email

Because:

- ✅ Less email spam
- ✅ Simpler user experience
- ✅ More secure (must verify before access)
- ✅ Industry standard practice

## All Email Types in System

| Email Type              | Template                | System           | Status           |
| ----------------------- | ----------------------- | ---------------- | ---------------- |
| **Signup/Confirmation** | confirm-email-html.tsx  | renderSimple()   | ✅ Always worked |
| Password Reset          | forgot-password.tsx     | renderWithI18N() | ✅ NOW FIXED     |
| Password Changed        | reset-password.tsx      | renderWithI18N() | ✅ NOW FIXED     |
| Document Invite         | document-invite.tsx     | renderWithI18N() | ✅ NOW FIXED     |
| Document Completed      | document-completed.tsx  | renderWithI18N() | ✅ NOW FIXED     |
| Document Rejected       | document-rejected.tsx   | renderWithI18N() | ✅ NOW FIXED     |
| Document Cancelled      | document-cancel.tsx     | renderWithI18N() | ✅ NOW FIXED     |
| Team Invite             | confirm-team-email.tsx  | renderWithI18N() | ✅ NOW FIXED     |
| Organization Invite     | organisation-invite.tsx | renderWithI18N() | ✅ NOW FIXED     |
| 2FA Code                | access-auth-2fa.tsx     | renderWithI18N() | ✅ NOW FIXED     |

## Testing Signup Email

### Test Flow

1. **Sign up new user**

   ```bash
   # Use the signup form or API
   POST /api/auth/email-password/signup
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "SecurePass123!"
   }
   ```

2. **Check logs**

   ```bash
   docker logs -f <container> | grep "SEND_CONFIRMATION_EMAIL"
   ```

   Should see:

   ```
   [SEND_CONFIRMATION_EMAIL] Job handler started for email: test@example.com
   [SEND_CONFIRMATION_EMAIL_FN] Starting for userId: 123
   [SEND_CONFIRMATION_EMAIL_FN] Found user: test@example.com
   [SEND_CONFIRMATION_EMAIL_FN] Email sent successfully
   ```

3. **Check email inbox**
   - Subject: "Please confirm your email"
   - From: Signtusk
   - Contains: Welcome message and confirmation button
   - Link format: `https://your-domain.com/verify-email/{token}`

4. **Click confirmation link**
   - Redirects to success page
   - User can now log in

### Expected Behavior

- ✅ Email sent immediately after signup
- ✅ Email arrives within 1-2 minutes
- ✅ Email properly formatted with logo and button
- ✅ Confirmation link works
- ✅ After confirmation, user can log in

## Summary

1. **YES, there is a signup email** - it's the confirmation email
2. **It's the SAME template** used for signup and resending
3. **It uses `renderSimple()`** - not affected by React hooks issue
4. **It always worked** - no fix needed
5. **Our fix only affects** document/team/org emails that use `renderWithI18N()`

## Quick Reference

**Signup Email**:

- ✅ Exists
- ✅ Works (always has)
- ✅ Uses renderSimple()
- ❌ Not affected by our fix
- ✅ No changes needed

**Document Emails**:

- ✅ Exist
- ✅ NOW work (after our fix)
- ✅ Use renderWithI18N()
- ✅ Affected by our fix
- ✅ Fixed with useLinguiSSR
