# Complete Email Triggers End-to-End Comparison

## Status: ✅ Confirmation Email Working

**User Confirmation**: "confirmation mail is working as expected"

This document provides a comprehensive comparison of ALL email triggers in the system, their templates, trigger conditions, and testing scenarios.

---

## Email System Architecture

### Core Components

1. **Email Renderer**: `packages/email/render-with-i18n-wrapper.tsx` - Patched with ALL React hooks
2. **Email Mailer**: `packages/email/mailer.ts` - Handles actual email sending via Resend
3. **Job System**: Background jobs in `packages/lib/jobs/definitions/emails/`
4. **Templates**: React components in `packages/email/templates/`

### React Hooks Patched (SSR Email Rendering)

- ✅ `useRef` - Returns `{ current: initialValue }`
- ✅ `useContext` - Returns stored context values
- ✅ `createContext` - Stores contexts in Map
- ✅ `useCallback` - Returns function directly
- ✅ `useMemo` - Calls factory immediately
- ✅ `useEffect` - No-op in SSR
- ✅ `useLayoutEffect` - No-op in SSR

---

## 1. Authentication & Account Emails

### 1.1 Signup Confirmation Email ✅ WORKING

**Job ID**: `send.signup.confirmation.email`

**Template**: `packages/email/templates/confirm-email.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-confirmation-email.handler.ts`

**Trigger Conditions**:

- User signs up with new account
- User requests email verification resend
- Force flag can bypass rate limiting

**Email Flow**:

```
User Signs Up → Job Triggered → sendConfirmationToken() →
Generate Token → Render Template → Send via Mailer →
Store Token in DB
```

**Key Functions**:

- `sendConfirmationToken()` in `packages/lib/server-only/user/send-confirmation-token.ts`
- `sendConfirmationEmail()` in `packages/lib/server-only/auth/send-confirmation-email.ts`

**Test Scenario**:

1. Create new user account
2. Check email inbox for confirmation
3. Click confirmation link
4. Verify account activated

**Status**: ✅ **CONFIRMED WORKING** by user

---

### 1.2 Password Reset Request Email

**Template**: `packages/email/templates/forgot-password.tsx`

**Handler**: `packages/lib/server-only/auth/send-forgot-password.ts`

**Trigger Conditions**:

- User clicks "Forgot Password"
- Enters email address
- System generates reset token

**Email Flow**:

```
User Requests Reset → Generate Token → Render Template →
Send Email → User Clicks Link → Reset Password Page
```

**Test Scenario**:

1. Go to login page
2. Click "Forgot Password"
3. Enter email
4. Check inbox for reset link
5. Click link and verify redirect to reset page

---

### 1.3 Password Reset Success Email

**Job ID**: `send.password.reset.success.email`

**Template**: `packages/email/templates/reset-password.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-password-reset-success-email.handler.ts`

**Trigger Conditions**:

- User successfully resets password
- Confirmation sent for security

**Email Flow**:

```
Password Reset Complete → Job Triggered →
Render Template → Send Confirmation Email
```

**Test Scenario**:

1. Complete password reset flow
2. Check inbox for success confirmation
3. Verify email contains security notice

---

### 1.4 Two-Factor Authentication Email

**Template**: `packages/email/templates/access-auth-2fa.tsx`

**Handler**: `packages/lib/server-only/2fa/email/send-2fa-token-email.ts`

**Trigger Conditions**:

- User has 2FA enabled
- User attempts to login
- System sends 6-digit code

**Email Flow**:

```
Login Attempt → Check 2FA Enabled → Generate Code →
Send Email → User Enters Code → Verify & Login
```

**Test Scenario**:

1. Enable 2FA on account
2. Logout and login again
3. Check email for 6-digit code
4. Enter code and verify login

---

## 2. Document Workflow Emails

### 2.1 Document Signing Request Email

**Job ID**: `send.signing.requested.email`

**Template**: `packages/email/templates/document-invite.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-signing-email.handler.ts`

**Trigger Conditions**:

- Document sent to recipient
- Recipient role: SIGNER, APPROVER, or VIEWER
- Email settings enabled: `recipientSigningRequest`

**Email Flow**:

```
Document Sent → Job Triggered → Check Recipient Role →
Check Email Settings → Render Template → Send Email →
Update Recipient Status (SENT) → Create Audit Log
```

**Key Features**:

- Custom email message support
- Self-signer detection
- Direct template handling
- Organisation branding
- Multi-language support

**Test Scenario**:

1. Create document
2. Add recipient with SIGNER role
3. Send document
4. Check recipient inbox
5. Verify signing link works
6. Check audit log created

---

### 2.2 Recipient Signed Notification Email

**Job ID**: `send.recipient.signed.email`

**Template**: `packages/email/templates/document-recipient-signed.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-recipient-signed-email.handler.ts`

**Trigger Conditions**:

- Recipient completes signing
- Recipient is NOT the document owner
- Email settings enabled: `recipientSigned`

**Email Flow**:

```
Recipient Signs → Job Triggered → Check Not Self-Signed →
Render Template → Send to Document Owner →
Owner Notified of Progress
```

**Test Scenario**:

1. Send document to external recipient
2. Recipient signs document
3. Check document owner inbox
4. Verify notification received
5. Check document status updated

---

### 2.3 Document Rejection Emails (2 emails sent)

**Job ID**: `send.signing.rejected.emails`

**Templates**:

- `packages/email/templates/document-rejection-confirmed.tsx` (to recipient)
- `packages/email/templates/document-rejected.tsx` (to owner)

**Handler**: `packages/lib/jobs/definitions/emails/send-rejection-emails.handler.ts`

**Trigger Conditions**:

- Recipient rejects document
- Rejection reason provided (optional)
- Email settings enabled: `recipientSigningRequest`

**Email Flow**:

```
Recipient Rejects → Job Triggered →
Send Confirmation to Recipient →
Send Notification to Owner →
Update Recipient Status
```

**Test Scenario**:

1. Send document to recipient
2. Recipient clicks "Reject"
3. Enters rejection reason
4. Check recipient inbox for confirmation
5. Check owner inbox for notification
6. Verify both emails contain rejection reason

---

### 2.4 Document Cancelled Emails (Multiple recipients)

**Job ID**: `send.document.cancelled.emails`

**Template**: `packages/email/templates/document-cancel.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts`

**Trigger Conditions**:

- Document owner cancels document
- Recipients have been sent document OR opened it
- Recipients have NOT rejected it
- Email settings enabled: `documentDeleted`

**Email Flow**:

```
Owner Cancels Document → Job Triggered →
Filter Recipients (SENT or OPENED) →
Send Email to Each Recipient →
Include Cancellation Reason
```

**Test Scenario**:

1. Send document to multiple recipients
2. One recipient opens document
3. Owner cancels document with reason
4. Check all sent/opened recipients receive email
5. Verify cancellation reason included

---

### 2.5 Document Completed Email

**Template**: `packages/email/templates/document-completed.tsx`

**Handler**: `packages/lib/server-only/document/send-completed-email.ts`

**Trigger Conditions**:

- All recipients complete signing
- Document status changes to COMPLETED
- Email settings enabled

**Email Flow**:

```
Last Signature → Document Completed →
Send to Owner → Send to All Recipients →
Include Download Link
```

**Test Scenario**:

1. Send document to multiple recipients
2. All recipients sign
3. Check all parties receive completion email
4. Verify download link works

---

### 2.6 Document Pending Reminder Email

**Template**: `packages/email/templates/document-pending.tsx`

**Handler**: `packages/lib/server-only/document/send-pending-email.ts`

**Trigger Conditions**:

- Document pending for X days
- Recipient hasn't signed yet
- Reminder system triggered

**Email Flow**:

```
Scheduled Job → Check Pending Documents →
Send Reminder to Unsigned Recipients →
Update Last Reminder Timestamp
```

**Test Scenario**:

1. Send document to recipient
2. Wait for reminder period
3. Check recipient receives reminder
4. Verify reminder count incremented

---

### 2.7 Document Self-Signed Email

**Template**: `packages/email/templates/document-self-signed.tsx`

**Handler**: Inline in document completion flow

**Trigger Conditions**:

- User signs their own document
- Document requires only owner signature

**Test Scenario**:

1. Create document with only self as signer
2. Sign document
3. Check inbox for self-signed confirmation

---

### 2.8 Recipient Removed from Document Email

**Template**: `packages/email/templates/recipient-removed-from-document.tsx`

**Handler**: `packages/lib/server-only/recipient/delete-envelope-recipient.ts`

**Trigger Conditions**:

- Document owner removes recipient
- Recipient was previously added
- Document not yet completed

**Email Flow**:

```
Owner Removes Recipient → Check Recipient Status →
Send Notification Email → Update Document
```

**Test Scenario**:

1. Send document to recipient
2. Remove recipient before they sign
3. Check recipient receives removal notification

---

### 2.9 Document Super Delete Email (Admin)

**Template**: `packages/email/templates/document-super-delete.tsx`

**Handler**: `packages/lib/server-only/admin/admin-super-delete-document.ts`

**Trigger Conditions**:

- Admin performs super delete
- All recipients notified
- Compliance requirement

**Test Scenario**:

1. Admin deletes document (super delete)
2. Check all recipients receive notification
3. Verify admin action logged

---

## 3. Organisation & Team Emails

### 3.1 Organisation Member Joined Email

**Job ID**: `send.organisation-member-joined.email`

**Template**: `packages/email/templates/organisation-join.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-organisation-member-joined-email.handler.ts`

**Trigger Conditions**:

- New member joins organisation
- Sent to all organisation admins
- Excludes the new member

**Email Flow**:

```
Member Joins → Job Triggered →
Get All Admins → Send to Each Admin →
Include Member Details
```

**Test Scenario**:

1. Invite user to organisation
2. User accepts invitation
3. Check all admin inboxes
4. Verify new member details included

---

### 3.2 Organisation Member Left Email

**Job ID**: `send.organisation-member-left.email`

**Template**: `packages/email/templates/organisation-leave.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-organisation-member-left-email.handler.ts`

**Trigger Conditions**:

- Member leaves organisation
- Sent to all organisation admins
- Excludes the leaving member

**Email Flow**:

```
Member Leaves → Job Triggered →
Get All Admins → Send to Each Admin →
Include Member Details
```

**Test Scenario**:

1. Member leaves organisation
2. Check all admin inboxes
3. Verify leaving member details included

---

### 3.3 Organisation Invite Email

**Template**: `packages/email/templates/organisation-invite.tsx`

**Handler**: `packages/lib/server-only/organisation/create-organisation-member-invites.ts`

**Trigger Conditions**:

- Admin invites new member
- Invitation token generated
- Sent to invitee email

**Email Flow**:

```
Admin Sends Invite → Generate Token →
Render Template → Send Email →
User Clicks Link → Accept Invitation
```

**Test Scenario**:

1. Admin invites new member
2. Check invitee inbox
3. Click invitation link
4. Verify redirect to accept page

---

### 3.4 Organisation Account Link Confirmation

**Template**: `packages/email/templates/organisation-account-link-confirmation.tsx`

**Handler**: Inline in organisation linking flow

**Trigger Conditions**:

- User links account to organisation
- Confirmation required for security

**Test Scenario**:

1. Link account to organisation
2. Check inbox for confirmation
3. Verify link details correct

---

### 3.5 Team Deleted Email

**Job ID**: `send.team-deleted.email`

**Template**: `packages/email/templates/team-delete.tsx`

**Handler**: `packages/lib/jobs/definitions/emails/send-team-deleted-email.handler.ts`

**Trigger Conditions**:

- Team is deleted
- Sent to all team members
- Includes team details

**Email Flow**:

```
Team Deleted → Job Triggered →
Get All Members → Send to Each Member →
Include Team Name and URL
```

**Test Scenario**:

1. Delete team
2. Check all member inboxes
3. Verify team details included

---

### 3.6 Team Email Verification

**Template**: `packages/email/templates/confirm-team-email.tsx`

**Handler**: `packages/lib/server-only/team/create-team-email-verification.ts`

**Trigger Conditions**:

- Team sets custom email address
- Verification required before use
- Token sent to team email

**Email Flow**:

```
Set Team Email → Generate Token →
Send Verification Email → User Clicks Link →
Email Verified and Active
```

**Test Scenario**:

1. Set custom team email
2. Check team email inbox
3. Click verification link
4. Verify email now active

---

### 3.7 Team Email Removed Notification

**Template**: `packages/email/templates/team-email-removed.tsx`

**Handler**: `packages/lib/server-only/team/delete-team-email.ts`

**Trigger Conditions**:

- Team email address removed
- Notification sent to organisation owner
- Security notification

**Test Scenario**:

1. Remove team email
2. Check organisation owner inbox
3. Verify removal notification received

---

## 4. Template & Bulk Operations Emails

### 4.1 Document Created from Direct Template

**Template**: `packages/email/templates/document-created-from-direct-template.tsx`

**Handler**: `packages/lib/server-only/template/create-document-from-direct-template.ts`

**Trigger Conditions**:

- Document created via direct template link
- Template owner notified
- Includes recipient details

**Email Flow**:

```
User Uses Direct Template → Document Created →
Notify Template Owner → Include Document Details
```

**Test Scenario**:

1. Create direct template
2. Share link with user
3. User creates document
4. Check template owner inbox
5. Verify document details included

---

### 4.2 Bulk Send Complete Email

**Template**: `packages/email/templates/bulk-send-complete.tsx`

**Handler**: `packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts`

**Trigger Conditions**:

- Bulk send operation completes
- Sent to user who initiated bulk send
- Includes success/failure stats

**Email Flow**:

```
Bulk Send Completes → Job Triggered →
Calculate Stats → Render Template →
Send Summary to User
```

**Test Scenario**:

1. Initiate bulk send with multiple recipients
2. Wait for completion
3. Check inbox for summary
4. Verify stats are accurate

---

## Email Settings & Configuration

### Document-Level Email Settings

Located in `documentMeta` table, controls which emails are sent:

```typescript
{
  recipientSigningRequest: boolean,  // Controls signing request emails
  recipientSigned: boolean,          // Controls signed notification emails
  documentCompleted: boolean,        // Controls completion emails
  documentDeleted: boolean,          // Controls cancellation emails
}
```

### Email Context System

`getEmailContext()` in `packages/lib/server-only/email/get-email-context.ts` provides:

- Branding configuration
- Email language (i18n)
- Sender email address
- Reply-to email address
- Organisation settings

---

## Testing Checklist

### ✅ Phase 1: Authentication Emails (User confirmed working)

- [x] Signup confirmation email - **CONFIRMED WORKING**
- [ ] Password reset request email
- [ ] Password reset success email
- [ ] Two-factor authentication email

### Phase 2: Core Document Workflow

- [ ] Document signing request email
- [ ] Recipient signed notification email
- [ ] Document rejection emails (both)
- [ ] Document cancelled emails
- [ ] Document completed email

### Phase 3: Advanced Document Features

- [ ] Document pending reminder email
- [ ] Document self-signed email
- [ ] Recipient removed email
- [ ] Document super delete email (admin)

### Phase 4: Organisation & Team

- [ ] Organisation member joined email
- [ ] Organisation member left email
- [ ] Organisation invite email
- [ ] Team deleted email
- [ ] Team email verification
- [ ] Team email removed notification

### Phase 5: Templates & Bulk

- [ ] Document created from direct template
- [ ] Bulk send complete email

---

## Common Email Issues & Solutions

### Issue 1: React Context Errors ✅ FIXED

**Error**: `TypeError: Cannot read properties of null (reading 'useCallback')`

**Solution**: Patched ALL React hooks in `render-with-i18n-wrapper.tsx`:

- useRef, useContext, createContext
- useCallback, useMemo
- useEffect, useLayoutEffect

**Status**: ✅ Fixed and deployed

---

### Issue 2: Invalid Email Addresses ⚠️ PENDING

**Error**: `Output validation failed: Invalid email at results[0].email`

**Solution**: Run SQL fix to update invalid emails:

```bash
npx prisma db execute --file fix-invalid-emails.sql --schema packages/prisma/schema.prisma
```

**Status**: ⚠️ SQL script provided, awaiting execution

---

### Issue 3: Font Routing Error ✅ FIXED

**Error**: `No route matches URL "/fonts/inter-variablefont_opsz,wght.ttf"`

**Solution**: Updated middleware to exclude `/fonts/` from React Router

**Status**: ✅ Fixed and deployed

---

## Email Rendering Pipeline

```
1. Job Triggered
   ↓
2. Fetch Data (user, document, recipient, etc.)
   ↓
3. Check Email Settings (enabled/disabled)
   ↓
4. Get Email Context (branding, language, sender)
   ↓
5. Create React Element (template with props)
   ↓
6. Render with I18N Wrapper (patched React hooks)
   ↓
7. Generate HTML & Plain Text
   ↓
8. Send via Mailer (Resend API)
   ↓
9. Update Database (status, audit log)
```

---

## Next Steps

1. **Fix Invalid Emails** (Priority: HIGH)
   - Run `fix-invalid-emails.sql`
   - Verify no invalid emails remain
   - Add database constraints

2. **Test All Email Triggers** (Priority: MEDIUM)
   - Follow testing checklist above
   - Document any failures
   - Fix issues as they arise

3. **Monitor Email Delivery** (Priority: LOW)
   - Check Resend dashboard
   - Monitor bounce rates
   - Track open rates

---

## Summary

- **Total Email Types**: 25+
- **Job-Based Emails**: 8
- **Direct Send Emails**: 17+
- **Templates**: 25
- **Status**: Confirmation email working, others need testing

All email templates use the same rendering system with patched React hooks, so if confirmation email works, the rendering system is solid. Any failures in other emails will likely be due to:

1. Invalid email addresses in database
2. Email settings disabled
3. Missing data/relationships
4. Logic errors in handlers

The fix for React hooks applies to ALL emails universally.
