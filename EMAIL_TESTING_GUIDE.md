# Email Testing Guide - Quick Reference

## Quick Test Commands

### Run Automated Test Suite

```bash
npx tsx scripts/test-all-email-triggers.ts
```

### Fix Invalid Emails (if needed)

```bash
npx prisma db execute --file fix-invalid-emails.sql --schema packages/prisma/schema.prisma
```

---

## Manual Testing Scenarios

### 1. Authentication Emails

#### Test Signup Confirmation ✅ WORKING

```bash
# 1. Go to signup page
# 2. Create new account with test email
# 3. Check inbox for confirmation email
# 4. Click link to verify

# Status: ✅ User confirmed working
```

#### Test Password Reset

```bash
# 1. Go to /signin
# 2. Click "Forgot Password"
# 3. Enter email address
# 4. Check inbox for reset link
# 5. Click link and reset password
# 6. Check inbox for success confirmation
```

#### Test 2FA Email

```bash
# 1. Enable 2FA in account settings
# 2. Logout
# 3. Login again
# 4. Check inbox for 6-digit code
# 5. Enter code to complete login
```

---

### 2. Document Workflow Emails

#### Test Signing Request Email

```bash
# 1. Create new document
# 2. Upload PDF
# 3. Add recipient with email
# 4. Add signature field
# 5. Click "Send"
# 6. Check recipient inbox

# Expected: Document invitation email with signing link
```

#### Test Recipient Signed Notification

```bash
# 1. Send document to external recipient
# 2. Recipient signs document
# 3. Check document owner inbox

# Expected: Notification that recipient signed
```

#### Test Document Rejection

```bash
# 1. Send document to recipient
# 2. Recipient opens document
# 3. Recipient clicks "Reject"
# 4. Enters rejection reason
# 5. Check both inboxes:
#    - Recipient: Rejection confirmation
#    - Owner: Rejection notification
```

#### Test Document Cancellation

```bash
# 1. Send document to multiple recipients
# 2. At least one recipient opens it
# 3. Owner cancels document
# 4. Enters cancellation reason
# 5. Check all recipient inboxes

# Expected: Cancellation email with reason
```

#### Test Document Completion

```bash
# 1. Send document to 2+ recipients
# 2. All recipients sign
# 3. Check all inboxes (owner + recipients)

# Expected: Completion email with download link
```

---

### 3. Organisation & Team Emails

#### Test Organisation Member Joined

```bash
# 1. Admin invites new member to organisation
# 2. New member accepts invitation
# 3. Check all admin inboxes

# Expected: Notification of new member
```

#### Test Organisation Member Left

```bash
# 1. Member leaves organisation
# 2. Check all admin inboxes

# Expected: Notification of member departure
```

#### Test Team Deleted

```bash
# 1. Create team with multiple members
# 2. Delete team
# 3. Check all member inboxes

# Expected: Team deletion notification
```

#### Test Team Email Verification

```bash
# 1. Go to team settings
# 2. Set custom team email
# 3. Check team email inbox
# 4. Click verification link

# Expected: Verification email with link
```

---

### 4. Template & Bulk Operations

#### Test Direct Template Email

```bash
# 1. Create direct template
# 2. Share direct link
# 3. User creates document from link
# 4. Check template owner inbox

# Expected: Notification of document creation
```

#### Test Bulk Send Complete

```bash
# 1. Create template
# 2. Initiate bulk send with 5+ recipients
# 3. Wait for completion
# 4. Check initiator inbox

# Expected: Summary email with stats
```

---

## Email Verification Checklist

For each email type, verify:

- [ ] Email is received in inbox (not spam)
- [ ] Subject line is correct and clear
- [ ] Sender name/email is correct
- [ ] Email content renders properly (HTML)
- [ ] All links work correctly
- [ ] Plain text version exists
- [ ] Branding/logo displays correctly
- [ ] Language/i18n works correctly
- [ ] Custom messages appear (if applicable)
- [ ] Recipient name is personalized
- [ ] Document name is correct
- [ ] Timestamps are accurate
- [ ] Action buttons work
- [ ] Unsubscribe link present (if required)

---

## Common Issues & Quick Fixes

### Issue: Email not received

**Check:**

1. Spam folder
2. Email address is valid
3. Email settings enabled in document meta
4. Resend API key configured
5. Check logs for errors

**Fix:**

```bash
# Check recent email logs
docker logs <container-id> | grep -i "email\|mailer"

# Check Resend dashboard
# https://resend.com/emails
```

---

### Issue: Email renders incorrectly

**Check:**

1. React hooks patched correctly
2. Template syntax errors
3. Missing props
4. Font files accessible

**Fix:**

```bash
# Rebuild with latest fixes
npm run build

# Check font files exist
ls -la apps/remix/public/fonts/
```

---

### Issue: Links don't work

**Check:**

1. NEXT_PUBLIC_WEBAPP_URL configured
2. Token generation working
3. Route exists for link
4. Token not expired

**Fix:**

```bash
# Check environment variable
echo $NEXT_PUBLIC_WEBAPP_URL

# Should be: https://your-domain.com (no trailing slash)
```

---

### Issue: Invalid email addresses

**Check:**

```sql
SELECT id, email, name
FROM "User"
WHERE email IS NULL
   OR email = ''
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%.%'
LIMIT 10;
```

**Fix:**

```bash
npx prisma db execute --file fix-invalid-emails.sql --schema packages/prisma/schema.prisma
```

---

## Email Settings Configuration

### Document-Level Settings

Located in `documentMeta` table:

```typescript
{
  recipientSigningRequest: true,  // Enable signing request emails
  recipientSigned: true,          // Enable signed notification emails
  documentCompleted: true,        // Enable completion emails
  documentDeleted: true,          // Enable cancellation emails
}
```

### Check Email Settings

```sql
SELECT
  id,
  subject,
  message,
  "recipientSigningRequest",
  "recipientSigned",
  "documentCompleted",
  "documentDeleted"
FROM "DocumentMeta"
WHERE "envelopeId" = <your-envelope-id>;
```

### Enable All Email Settings

```sql
UPDATE "DocumentMeta"
SET
  "recipientSigningRequest" = true,
  "recipientSigned" = true,
  "documentCompleted" = true,
  "documentDeleted" = true
WHERE "envelopeId" = <your-envelope-id>;
```

---

## Environment Variables Required

```bash
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Application URL (no trailing slash)
NEXT_PUBLIC_WEBAPP_URL=https://your-domain.com

# Internal Email
SIGNTUSK_INTERNAL_EMAIL=noreply@your-domain.com

# Optional: Custom sender
NEXT_PUBLIC_SENDER_EMAIL=hello@your-domain.com
NEXT_PUBLIC_SENDER_NAME="Your Company"
```

---

## Testing Priority Order

### Phase 1: Critical (Test First) ✅

1. Signup confirmation - **CONFIRMED WORKING**
2. Document signing request
3. Password reset

### Phase 2: Important (Test Next)

4. Recipient signed notification
5. Document completion
6. Document rejection

### Phase 3: Standard (Test After)

7. Document cancellation
8. Organisation member joined/left
9. Team deleted

### Phase 4: Advanced (Test Last)

10. Direct template notifications
11. Bulk send complete
12. 2FA emails
13. Team email verification

---

## Debugging Email Issues

### Enable Debug Logging

```typescript
// In packages/email/mailer.ts
console.log("[MAILER] Sending email:", {
  to: options.to,
  from: options.from,
  subject: options.subject,
});
```

### Check Email Queue

```bash
# If using background jobs
npx tsx scripts/check-background-jobs.ts
```

### Test Email Rendering Locally

```typescript
// Create test script
import { renderEmailWithI18N } from "@signtusk/lib/utils/render-email-with-i18n";
import DocumentInviteEmailTemplate from "@signtusk/email/templates/document-invite";
import { createElement } from "react";

const template = createElement(DocumentInviteEmailTemplate, {
  documentName: "Test Document",
  inviterName: "Test User",
  inviterEmail: "test@example.com",
  assetBaseUrl: "http://localhost:3000",
  signDocumentLink: "http://localhost:3000/sign/test-token",
  customBody: "Please sign this test document",
  role: "SIGNER",
  selfSigner: false,
});

const html = await renderEmailWithI18N(template, { lang: "en" });
console.log(html);
```

---

## Success Criteria

An email trigger is considered working when:

1. ✅ Email is sent without errors
2. ✅ Email arrives in inbox (not spam)
3. ✅ Content renders correctly
4. ✅ All links work
5. ✅ Personalization works (names, etc.)
6. ✅ Branding displays correctly
7. ✅ Database updated correctly (status, audit log)
8. ✅ No console errors

---

## Next Steps After Testing

1. **Document Results**: Record which emails work and which don't
2. **Fix Issues**: Address any failures found during testing
3. **Monitor Production**: Watch email delivery rates
4. **Optimize**: Improve templates based on user feedback
5. **Add Tests**: Create automated tests for critical flows

---

## Quick Reference: Email Job IDs

```
send.signup.confirmation.email              ✅ WORKING
send.signing.requested.email                ⏳ Needs testing
send.recipient.signed.email                 ⏳ Needs testing
send.signing.rejected.emails                ⏳ Needs testing
send.document.cancelled.emails              ⏳ Needs testing
send.organisation-member-joined.email       ⏳ Needs testing
send.organisation-member-left.email         ⏳ Needs testing
send.team-deleted.email                     ⏳ Needs testing
send.password.reset.success.email           ⏳ Needs testing
```

---

## Support & Resources

- **Email Templates**: `packages/email/templates/`
- **Job Handlers**: `packages/lib/jobs/definitions/emails/`
- **Email Renderer**: `packages/email/render-with-i18n-wrapper.tsx`
- **Mailer Config**: `packages/email/mailer.ts`
- **Complete Comparison**: `EMAIL_TRIGGERS_COMPLETE_COMPARISON.md`

---

**Last Updated**: Based on context transfer - Confirmation email confirmed working by user
