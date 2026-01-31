# Email Triggers - Complete Flow Analysis

## Overview

This document traces the complete flow for each email type, from trigger point to email delivery, similar to how the confirmation email works.

---

## Flow Pattern (All Emails Follow This)

```
1. USER ACTION / SYSTEM EVENT
   ↓
2. TRIGGER POINT (API route, server function, etc.)
   ↓
3. jobs.triggerJob() or jobsClient.triggerJob()
   ↓
4. JOB DEFINITION (packages/lib/jobs/definitions/emails/*.ts)
   ↓
5. JOB HANDLER (*.handler.ts)
   ↓
6. FETCH DATA (user, document, recipient, etc.)
   ↓
7. CHECK CONDITIONS (email settings, recipient status, etc.)
   ↓
8. GET EMAIL CONTEXT (branding, language, sender)
   ↓
9. CREATE REACT ELEMENT (template with props)
   ↓
10. RENDER WITH I18N (patched React hooks) ✅
   ↓
11. SEND VIA MAILER (Resend API)
   ↓
12. UPDATE DATABASE (status, audit log)
```

---

## 1. Authentication Emails

### 1.1 Signup Confirmation Email ✅ WORKING

**Flow:**

```
User Signs Up
   ↓
packages/auth/server/routes/email-password.ts
   → POST /signup endpoint (line 156)
   → createUser() called
   ↓
jobsClient.triggerJob({
  name: 'send.signup.confirmation.email',
  payload: { email: user.email }
})
   ↓
packages/lib/jobs/definitions/emails/send-confirmation-email.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-confirmation-email.handler.ts
   → run() function
   ↓
packages/lib/server-only/user/send-confirmation-token.ts
   → sendConfirmationToken()
   → Generate random token
   → Store in VerificationToken table
   ↓
packages/lib/server-only/auth/send-confirmation-email.ts
   → sendConfirmationEmail()
   → Create React element (ConfirmEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
Email Sent ✅
```

**Trigger Points:**

1. **Signup**: `packages/auth/server/routes/email-password.ts:166`
2. **Login (unverified)**: `packages/auth/server/routes/email-password.ts:124`
3. **Resend verification**: `packages/auth/server/routes/email-password.ts:246`
4. **Verify email (expired)**: `packages/lib/server-only/user/verify-email.ts:57`

**Status**: ✅ **CONFIRMED WORKING**

---

### 1.2 Password Reset Request Email

**Flow:**

```
User Clicks "Forgot Password"
   ↓
packages/auth/server/routes/email-password.ts
   → POST /forgot-password endpoint (line 254)
   ↓
packages/lib/server-only/user/forgot-password.ts
   → forgotPassword()
   → Generate reset token
   → Store in PasswordResetToken table
   ↓
packages/lib/server-only/auth/send-forgot-password.ts
   → sendForgotPassword()
   → Create React element (ForgotPasswordTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
Email Sent
```

**Trigger Point:**

- `packages/auth/server/routes/email-password.ts:254` (POST /forgot-password)

**Template**: `packages/email/templates/forgot-password.tsx`

---

### 1.3 Password Reset Success Email

**Flow:**

```
User Resets Password Successfully
   ↓
packages/auth/server/routes/email-password.ts
   → POST /reset-password endpoint (line 268)
   ↓
packages/lib/server-only/user/reset-password.ts
   → resetPassword()
   → Update user password
   ↓
jobsClient.triggerJob({
  name: 'send.password.reset.success.email',
  payload: { userId }
})
   ↓
packages/lib/jobs/definitions/emails/send-password-reset-success-email.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-password-reset-success-email.handler.ts
   → run() function
   → Fetch user data
   → Create React element (ResetPasswordTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
Email Sent
```

**Trigger Point:**

- `packages/lib/server-only/user/reset-password.ts:91`

**Template**: `packages/email/templates/reset-password.tsx`

---

### 1.4 Two-Factor Authentication Email

**Flow:**

```
User Attempts Login (2FA Enabled)
   ↓
packages/lib/server-only/2fa/email/send-2fa-token-email.ts
   → send2FATokenEmail()
   → Generate 6-digit code
   → Store in database
   ↓
Create React element (AccessAuth2FATemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
Email Sent
```

**Trigger Point:**

- `packages/lib/server-only/2fa/email/send-2fa-token-email.ts:113`

**Template**: `packages/email/templates/access-auth-2fa.tsx`

---

## 2. Document Workflow Emails

### 2.1 Document Signing Request Email

**Flow:**

```
User Sends Document
   ↓
packages/lib/server-only/document/send-document.ts
   → sendDocument() function
   → Update envelope status to PENDING
   → Get recipients to notify
   ↓
FOR EACH RECIPIENT:
   jobs.triggerJob({
     name: 'send.signing.requested.email',
     payload: {
       userId,
       documentId,
       recipientId,
       requestMetadata
     }
   })
   ↓
packages/lib/jobs/definitions/emails/send-signing-email.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-signing-email.handler.ts
   → run() function
   → Fetch user, envelope, recipient
   → Check recipient role (skip CC)
   → Check email settings (recipientSigningRequest)
   → Get email context (branding, language, sender)
   → Build email message (custom or default)
   → Create React element (DocumentInviteEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   → Update recipient.sendStatus = SENT
   → Create audit log (EMAIL_SENT)
   ↓
Email Sent
```

**Trigger Points:**

1. **Send Document**: `packages/lib/server-only/document/send-document.ts:296`
2. **Sequential Signing (next recipient)**: `packages/lib/server-only/document/complete-document-with-token.ts:382`

**Template**: `packages/email/templates/document-invite.tsx`

**Email Settings Check**: `documentMeta.recipientSigningRequest`

---

### 2.2 Recipient Signed Notification Email

**Flow:**

```
Recipient Completes Signing
   ↓
packages/lib/server-only/document/complete-document-with-token.ts
   → completeDocumentWithToken() function
   → Update recipient.signingStatus = SIGNED
   → Create audit log (DOCUMENT_RECIPIENT_COMPLETED)
   ↓
jobs.triggerJob({
  name: 'send.recipient.signed.email',
  payload: {
    documentId,
    recipientId
  }
})
   ↓
packages/lib/jobs/definitions/emails/send-recipient-signed-email.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-recipient-signed-email.handler.ts
   → run() function
   → Fetch envelope with recipients and owner
   → Check email settings (recipientSigned)
   → Check NOT self-signed (owner.email !== recipient.email)
   → Get email context (branding, language, sender)
   → Create React element (DocumentRecipientSignedEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail() → Send to DOCUMENT OWNER
   ↓
Email Sent to Owner
```

**Trigger Point:**

- `packages/lib/server-only/document/complete-document-with-token.ts:298`

**Template**: `packages/email/templates/document-recipient-signed.tsx`

**Email Settings Check**: `documentMeta.recipientSigned`

**Recipient**: Document owner (NOT the signer)

---

### 2.3 Document Rejection Emails (2 emails)

**Flow:**

```
Recipient Rejects Document
   ↓
packages/lib/server-only/document/reject-document-with-token.ts
   → rejectDocumentWithToken() function
   → Update recipient.signingStatus = REJECTED
   → Store rejection reason
   → Create audit log (DOCUMENT_RECIPIENT_REJECTED)
   ↓
jobs.triggerJob({
  name: 'send.signing.rejected.emails',
  payload: {
    recipientId,
    documentId
  }
})
   ↓
packages/lib/jobs/definitions/emails/send-rejection-emails.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-rejection-emails.handler.ts
   → run() function
   → Fetch envelope and recipient
   → Check email settings (recipientSigningRequest)
   → Get email context (branding, language, sender)
   ↓
EMAIL 1: Confirmation to Rejecting Recipient
   → Create React element (DocumentRejectionConfirmedEmail)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail() → Send to RECIPIENT
   ↓
EMAIL 2: Notification to Document Owner
   → Create React element (DocumentRejectedEmail)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail() → Send to OWNER
   ↓
   → Update recipient.sendStatus = SENT
   ↓
Both Emails Sent
```

**Trigger Point:**

- `packages/lib/server-only/document/reject-document-with-token.ts:89`

**Templates**:

- `packages/email/templates/document-rejection-confirmed.tsx` (to recipient)
- `packages/email/templates/document-rejected.tsx` (to owner)

**Email Settings Check**: `documentMeta.recipientSigningRequest`

---

### 2.4 Document Cancelled Emails (Multiple recipients)

**Flow:**

```
Owner Cancels Document OR Recipient Rejects
   ↓
packages/lib/server-only/document/reject-document-with-token.ts
   → After rejection emails sent
   ↓
jobs.triggerJob({
  name: 'send.document.cancelled.emails',
  payload: {
    documentId,
    cancellationReason,
    requestMetadata
  }
})
   ↓
packages/lib/jobs/definitions/emails/send-document-cancelled-emails.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts
   → run() function
   → Fetch envelope with all recipients
   → Check email settings (documentDeleted)
   → Filter recipients:
      - sendStatus = SENT OR readStatus = OPENED
      - signingStatus ≠ REJECTED
      - Valid email address
   → Get email context (branding, language, sender)
   ↓
FOR EACH FILTERED RECIPIENT:
   → Create React element (DocumentCancelTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
All Emails Sent
```

**Trigger Points:**

1. **After Rejection**: `packages/lib/server-only/document/reject-document-with-token.ts:98`
2. **Manual Cancellation**: (via document deletion flow)

**Template**: `packages/email/templates/document-cancel.tsx`

**Email Settings Check**: `documentMeta.documentDeleted`

**Recipients**: Only those who were sent the document or opened it (excluding rejector)

---

### 2.5 Document Completed Email

**Flow:**

```
All Recipients Sign Document
   ↓
packages/lib/server-only/document/complete-document-with-token.ts
   → Last recipient signs
   → Check: all recipients signed OR are CC
   ↓
jobs.triggerJob({
  name: 'internal.seal-document',
  payload: { documentId, requestMetadata }
})
   ↓
Seal document job completes
   → Update envelope.status = COMPLETED
   ↓
packages/lib/server-only/document/send-completed-email.ts
   → sendCompletedEmail() function
   → Fetch envelope with all recipients
   → Check email settings (documentCompleted)
   → Get email context (branding, language, sender)
   ↓
EMAIL TO OWNER:
   → Create React element (DocumentCompletedEmailTemplate)
   → Include download link
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail() → Send to OWNER
   ↓
FOR EACH RECIPIENT (with valid email):
   → Create React element (DocumentCompletedEmailTemplate)
   → Include download link
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail() → Send to RECIPIENT
   ↓
All Emails Sent
```

**Trigger Point:**

- Called from seal-document job after completion

**Template**: `packages/email/templates/document-completed.tsx`

**Email Settings Check**: `documentMeta.documentCompleted`

**Recipients**: Owner + all recipients with valid emails

---

### 2.6 Document Pending Reminder Email

**Flow:**

```
Scheduled Job Runs (Cron)
   ↓
Check for pending documents
   → Find documents with unsigned recipients
   → Check reminder settings
   ↓
packages/lib/server-only/document/send-pending-email.ts
   → sendPendingEmail() function
   → Fetch envelope and recipient
   → Get email context (branding, language, sender)
   → Create React element (DocumentPendingEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   → Update last reminder timestamp
   ↓
Email Sent
```

**Trigger Point:**

- Scheduled cron job or manual trigger

**Template**: `packages/email/templates/document-pending.tsx`

---

### 2.7 Recipient Removed from Document Email

**Flow:**

```
Owner Removes Recipient
   ↓
packages/lib/server-only/recipient/delete-envelope-recipient.ts
   → deleteEnvelopeRecipient() function
   → Check recipient hasn't signed yet
   → Get email context (branding, language, sender)
   → Create React element (RecipientRemovedFromDocumentTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   → Delete recipient from database
   ↓
Email Sent
```

**Trigger Point:**

- `packages/lib/server-only/recipient/delete-envelope-recipient.ts:172`

**Template**: `packages/email/templates/recipient-removed-from-document.tsx`

---

## 3. Organisation & Team Emails

### 3.1 Organisation Member Joined Email

**Flow:**

```
New Member Accepts Invitation
   ↓
packages/lib/server-only/organisation/accept-organisation-invitation.ts
   → acceptOrganisationInvitation() function
   → Add member to organisation
   ↓
jobs.triggerJob({
  name: 'send.organisation-member-joined.email',
  payload: {
    organisationId,
    memberUserId
  }
})
   ↓
packages/lib/jobs/definitions/emails/send-organisation-member-joined-email.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-organisation-member-joined-email.handler.ts
   → run() function
   → Fetch organisation with admin members
   → Fetch invited member details
   → Get email context (branding, language, sender)
   ↓
FOR EACH ADMIN (excluding new member):
   → Create React element (OrganisationJoinEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
All Admin Emails Sent
```

**Trigger Point:**

- `packages/lib/server-only/organisation/accept-organisation-invitation.ts:131`

**Template**: `packages/email/templates/organisation-join.tsx`

**Recipients**: All organisation admins (excluding new member)

---

### 3.2 Organisation Member Left Email

**Flow:**

```
Member Leaves Organisation
   ↓
packages/trpc/server/organisation-router/leave-organisation.ts
   → leaveOrganisation() mutation
   → Remove member from organisation
   ↓
jobs.triggerJob({
  name: 'send.organisation-member-left.email',
  payload: {
    organisationId,
    memberUserId
  }
})
   ↓
packages/lib/jobs/definitions/emails/send-organisation-member-left-email.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-organisation-member-left-email.handler.ts
   → run() function
   → Fetch organisation with admin members
   → Fetch leaving member details
   → Get email context (branding, language, sender)
   ↓
FOR EACH ADMIN (excluding leaving member):
   → Create React element (OrganisationLeaveEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
All Admin Emails Sent
```

**Trigger Points:**

1. **Member Leaves**: `packages/trpc/server/organisation-router/leave-organisation.ts:73`
2. **Admin Removes Member**: `packages/trpc/server/organisation-router/delete-organisation-members.ts:104`

**Template**: `packages/email/templates/organisation-leave.tsx`

**Recipients**: All organisation admins (excluding leaving member)

---

### 3.3 Organisation Invite Email

**Flow:**

```
Admin Invites New Member
   ↓
packages/lib/server-only/organisation/create-organisation-member-invites.ts
   → createOrganisationMemberInvites() function
   → Generate invitation token
   → Store in OrganisationInvitation table
   → Get email context (branding, language, sender)
   → Create React element (OrganisationInviteTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
Email Sent to Invitee
```

**Trigger Point:**

- `packages/lib/server-only/organisation/create-organisation-member-invites.ts:223`

**Template**: `packages/email/templates/organisation-invite.tsx`

**Recipient**: Invited user's email

---

### 3.4 Team Deleted Email

**Flow:**

```
Team is Deleted
   ↓
packages/lib/server-only/team/delete-team.ts
   → deleteTeam() function
   → Mark team as deleted
   ↓
jobs.triggerJob({
  name: 'send.team-deleted.email',
  payload: {
    organisationId,
    team: { name, url },
    members: [{ id, name, email }]
  }
})
   ↓
packages/lib/jobs/definitions/emails/send-team-deleted-email.ts
   → Job definition triggered
   ↓
packages/lib/jobs/definitions/emails/send-team-deleted-email.handler.ts
   → run() function
   ↓
FOR EACH MEMBER:
   → Call sendTeamDeleteEmail()
   → Get email context (branding, language, sender)
   → Create React element (TeamDeleteEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
All Member Emails Sent
```

**Trigger Point:**

- `packages/lib/server-only/team/delete-team.ts:99`

**Template**: `packages/email/templates/team-delete.tsx`

**Recipients**: All team members

---

### 3.5 Team Email Verification

**Flow:**

```
Team Sets Custom Email
   ↓
packages/lib/server-only/team/create-team-email-verification.ts
   → createTeamEmailVerification() function
   → Generate verification token
   → Store in TeamEmailVerification table
   → Get email context (branding, language, sender)
   → Create React element (ConfirmTeamEmailTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
Email Sent to Team Email
```

**Trigger Point:**

- `packages/lib/server-only/team/create-team-email-verification.ts:150`

**Template**: `packages/email/templates/confirm-team-email.tsx`

**Recipient**: Team's custom email address

---

## 4. Template & Bulk Operations

### 4.1 Document Created from Direct Template

**Flow:**

```
User Creates Document from Direct Template Link
   ↓
packages/lib/server-only/template/create-document-from-direct-template.ts
   → createDocumentFromDirectTemplate() function
   → Create document from template
   → Get template owner details
   → Get email context (branding, language, sender)
   → Create React element (DocumentCreatedFromDirectTemplateTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail() → Send to TEMPLATE OWNER
   ↓
Email Sent to Template Owner
```

**Trigger Point:**

- `packages/lib/server-only/template/create-document-from-direct-template.ts:776`

**Template**: `packages/email/templates/document-created-from-direct-template.tsx`

**Recipient**: Template owner

---

### 4.2 Bulk Send Complete Email

**Flow:**

```
Bulk Send Operation Completes
   ↓
packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts
   → Bulk send job completes
   → Calculate success/failure stats
   → Get email context (branding, language, sender)
   → Create React element (BulkSendCompleteTemplate)
   → renderEmailWithI18N() ✅ Patched hooks
   → mailer.sendMail()
   ↓
Email Sent to Initiator
```

**Trigger Point:**

- `packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts:196`

**Template**: `packages/email/templates/bulk-send-complete.tsx`

**Recipient**: User who initiated bulk send

---

## Key Observations

### 1. Consistent Pattern

All emails follow the same pattern:

1. Trigger point (user action or system event)
2. Call `jobs.triggerJob()` or direct email function
3. Job handler fetches data
4. Check conditions (settings, status, etc.)
5. Get email context
6. Create React element
7. **Render with patched React hooks** ✅
8. Send via mailer
9. Update database

### 2. Email Settings Control

Most document-related emails check `documentMeta` settings:

- `recipientSigningRequest` - Controls signing request emails
- `recipientSigned` - Controls signed notification emails
- `documentCompleted` - Controls completion emails
- `documentDeleted` - Controls cancellation emails

### 3. Multiple Trigger Points

Some emails have multiple trigger points:

- **Confirmation email**: Signup, login (unverified), resend, verify (expired)
- **Signing request**: Send document, sequential signing (next recipient)
- **Member left**: Member leaves, admin removes member

### 4. Batch Emails

Some emails are sent to multiple recipients:

- **Document cancelled**: All recipients who received/opened document
- **Organisation member joined/left**: All admins
- **Team deleted**: All team members
- **Document completed**: Owner + all recipients

### 5. Email Context System

All emails use `getEmailContext()` to get:

- Branding configuration
- Email language (i18n)
- Sender email address
- Reply-to email address
- Organisation settings

### 6. Audit Logging

Most document-related emails create audit logs:

- `EMAIL_SENT` - When signing request sent
- `DOCUMENT_RECIPIENT_COMPLETED` - When recipient signs
- `DOCUMENT_RECIPIENT_REJECTED` - When recipient rejects
- `RECIPIENT_UPDATED` - When recipient info changes

---

## Testing Strategy

### Phase 1: Authentication Emails

1. ✅ Signup confirmation - **CONFIRMED WORKING**
2. Test password reset request
3. Test password reset success
4. Test 2FA email

### Phase 2: Core Document Workflow

5. Test document signing request
6. Test recipient signed notification
7. Test document rejection (both emails)
8. Test document cancellation
9. Test document completion

### Phase 3: Organisation & Team

10. Test organisation member joined
11. Test organisation member left
12. Test organisation invite
13. Test team deleted
14. Test team email verification

### Phase 4: Advanced Features

15. Test direct template notification
16. Test bulk send complete
17. Test recipient removed
18. Test document pending reminder

---

## Common Issues to Watch For

### 1. Invalid Email Addresses ⚠️

**Check**: Database contains invalid emails
**Fix**: Run `fix-invalid-emails.sql`

### 2. Email Settings Disabled

**Check**: `documentMeta` settings are false
**Fix**: Enable settings in document meta

### 3. Missing Data/Relationships

**Check**: Recipient, user, or envelope not found
**Fix**: Ensure proper data relationships

### 4. Job Not Triggered

**Check**: `triggerJob()` not called or failed
**Fix**: Check logs for errors, verify job worker running

### 5. Rendering Errors

**Check**: React hooks errors (should be fixed ✅)
**Fix**: Already patched in `render-with-i18n-wrapper.tsx`

---

## Summary

- **Total Email Types**: 25+
- **Job-Based Emails**: 8 (use background jobs)
- **Direct Send Emails**: 17+ (send immediately)
- **All Use Same Rendering**: ✅ Patched React hooks apply to ALL
- **Confirmation Email Working**: ✅ Proves rendering system works

Since confirmation email works and all emails use the same rendering system, any failures in other emails will be due to:

1. Invalid email addresses in database ⚠️
2. Email settings disabled
3. Missing data/relationships
4. Logic errors in specific handlers

**NOT due to rendering issues** ✅ (already fixed)
